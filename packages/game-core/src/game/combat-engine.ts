// 전투 로직: 카드 사용, 데미지/방어 계산, 턴 처리

import type { CardEffect, CardInstance } from '../types/card';
import type { CombatState, PlayerPower } from '../types/combat';
import type { Enemy, Player, StatusEffect } from '../types/character';
import { CARD_DEFINITIONS } from '../data/cards';
import { ENEMY_DEFINITIONS } from '../data/enemies';
import { COMBAT_BALANCE, POTION_BALANCE } from '../data/balance';
import { getActModifier, getAscensionModifier } from '../data/ascension';
import { createDrawPile, discardHand, drawCards } from './deck-manager';
import { decideIntent } from './enemy-ai';
import { generateId } from '../utils/random';
import type { RelicCombatBonuses } from '../types/relic';
import type { PotionId } from '../types/potion';

const HAND_SIZE = COMBAT_BALANCE.handSize;
const STARTING_ENERGY = COMBAT_BALANCE.startingEnergy;
const NO_RELIC_BONUSES: RelicCombatBonuses = { energy: 0, strength: 0, block: 0, dexterity: 0 };

// #region 전투 초기화
/** 승천 레벨별 적 체력 배율 적용 */
function scaleEnemyHp(hp: number, ascension: number, mapIndex: number): number {
  const enemyHpMul = getAscensionModifier(ascension).enemyHpMul * getActModifier(mapIndex).enemyHpMul;
  return enemyHpMul === 1 ? hp : Math.round(hp * enemyHpMul);
}

/** 전투 상태 초기 생성 */
export function initCombat(
  deckIds: readonly string[],
  enemyIds: readonly string[],
  playerHp = 80,
  playerMaxHp = 80,
  ascension = 0,
  mapIndex = 1,
  relicBonuses: RelicCombatBonuses = NO_RELIC_BONUSES,
): CombatState {
  const drawPile = createDrawPile(deckIds);
  const enemies: Enemy[] = enemyIds.map((id) => {
    const def = ENEMY_DEFINITIONS[id];
    const enemy: Enemy = {
      id: generateId(),
      name: def.name,
      hp: scaleEnemyHp(def.hp, ascension, mapIndex),
      maxHp: scaleEnemyHp(def.maxHp, ascension, mapIndex),
      block: 0,
      intent: { type: 'attack', value: 0 },
      statusEffects: [],
      turnCount: 0,
      definitionId: def.id,
    };
    return { ...enemy, intent: decideIntent(enemy, ascension, mapIndex) };
  });

  const startStatusEffects: StatusEffect[] = [];
  if (relicBonuses.strength > 0) startStatusEffects.push({ type: 'strength', duration: relicBonuses.strength });
  if (relicBonuses.dexterity > 0) startStatusEffects.push({ type: 'dexterity', duration: relicBonuses.dexterity });

  const player: Player = {
    hp: playerHp,
    maxHp: playerMaxHp,
    block: relicBonuses.block,
    energy: STARTING_ENERGY + relicBonuses.energy,
    maxEnergy: STARTING_ENERGY + relicBonuses.energy,
    statusEffects: startStatusEffects,
  };

  const { hand, drawPile: remainingDraw, discardPile } = drawCards(drawPile, [], [], HAND_SIZE);

  return {
    player,
    enemies,
    drawPile: remainingDraw,
    hand,
    discardPile,
    exhaustPile: [],
    powers: [...(relicBonuses.powers ?? [])],
    turn: 1,
    phase: 'player_turn',
    result: 'ongoing',
    ascension,
    mapIndex,
  };
}
// #endregion

// #region 카드 사용
/** 카드 사용 (플레이어 턴) */
export function playCard(
  state: CombatState,
  cardInstanceId: string,
  targetEnemyId?: string,
): CombatState {
  if (state.phase !== 'player_turn' || state.result !== 'ongoing') return state;

  const cardIndex = state.hand.findIndex((c) => c.instanceId === cardInstanceId);
  if (cardIndex === -1) return state;

  const cardInstance = state.hand[cardIndex];
  const definition = CARD_DEFINITIONS[cardInstance.definitionId];
  if (!definition) return state;
  if (definition.unplayable) return state;
  if (state.player.energy < definition.cost) return state;
  const requiresEnemyTarget = definition.effects.some((effect) => effect.target === 'single');
  if (requiresEnemyTarget && (
    state.enemies.length === 0
    || (targetEnemyId !== undefined && !state.enemies.some((enemy) => enemy.id === targetEnemyId))
  )) return state;

  // 에너지 소비
  let player: Player = {
    ...state.player,
    energy: state.player.energy - definition.cost,
  };

  // 패에서 제거
  const newHand = state.hand.filter((_, i) => i !== cardIndex);
  let newDiscardPile = [...state.discardPile];
  let newExhaustPile = [...state.exhaustPile];
  let enemies = [...state.enemies];
  let drawPile = [...state.drawPile];

  // exhaust 또는 power → 소멸 파일, 일반 → 버린 카드
  if (definition.exhaust || definition.type === 'power') {
    newExhaustPile = [...newExhaustPile, cardInstance];
  } else {
    newDiscardPile = [...newDiscardPile, cardInstance];
  }

  // 효과 적용 (지속 파워는 파워 목록 누적)
  let currentHand = [...newHand];
  let powers = [...(state.powers ?? [])];
  for (const effect of definition.effects) {
    if (effect.type === 'add_power') {
      powers = addPower(powers, effect);
      continue;
    }
    const result = applyEffect(effect, player, enemies, targetEnemyId, currentHand, drawPile, newDiscardPile);
    player = result.player;
    enemies = result.enemies;
    currentHand = result.hand;
    drawPile = result.drawPile;
    newDiscardPile = result.discardPile;
  }

  // 사망한 적 제거
  enemies = enemies.filter((e) => e.hp > 0);

  // 플레이어 사망 우선 결과 판정
  const result = player.hp <= 0 ? 'defeat' as const : enemies.length === 0 ? 'victory' as const : 'ongoing' as const;

  return {
    ...state,
    player,
    enemies,
    hand: currentHand,
    drawPile,
    discardPile: newDiscardPile,
    exhaustPile: newExhaustPile,
    powers,
    result,
  };
}

/** 지속 파워 누적 (동일 종류 합산) */
function addPower(powers: readonly PlayerPower[], effect: CardEffect): PlayerPower[] {
  const { powerType } = effect;
  if (!powerType) return [...powers];
  const existing = powers.findIndex((power) => power.type === powerType);
  return existing >= 0
    ? powers.map((power, index) => index === existing ? { ...power, value: power.value + effect.value } : power)
    : [...powers, { type: powerType, value: effect.value }];
}

interface EffectResult {
  player: Player;
  enemies: Enemy[];
  hand: CardInstance[];
  drawPile: CardInstance[];
  discardPile: CardInstance[];
}

/** 플레이어 힘 수치 조회 */
function getPlayerStrength(player: Player): number {
  const str = player.statusEffects.find((s) => s.type === 'strength');
  return str ? str.duration : 0;
}

/** 상태 효과 수치 조회 */
function getStatusAmount(effects: readonly StatusEffect[], statusType: StatusEffect['type']): number {
  const status = effects.find((s) => s.type === statusType);
  return status ? status.duration : 0;
}

/** 상태 효과 활성 여부 확인 */
function hasActiveStatus(effects: readonly StatusEffect[], statusType: StatusEffect['type']): boolean {
  return effects.some((s) => s.type === statusType && s.duration > 0);
}

/** 방어도 획득량 계산 (민첩 가산 + 손상 감소 반영) */
function calculateBlockGain(baseBlock: number, effects: readonly StatusEffect[]): number {
  const total = baseBlock + getStatusAmount(effects, 'dexterity');
  return Math.max(0, hasActiveStatus(effects, 'frail') ? Math.floor(total * COMBAT_BALANCE.frailMultiplier) : total);
}

/** 개별 카드 효과 적용 */
function applyEffect(
  effect: CardEffect,
  player: Player,
  enemies: Enemy[],
  targetEnemyId: string | undefined,
  hand: readonly CardInstance[],
  drawPile: readonly CardInstance[],
  discardPile: readonly CardInstance[],
): EffectResult {
  switch (effect.type) {
    case 'damage': {
      const strength = getPlayerStrength(player);
      const isWeak = player.statusEffects.some((s) => s.type === 'weak' && s.duration > 0);
      const updatedEnemies = applyDamageEffect(effect, strength, isWeak, enemies, targetEnemyId);
      return { player, enemies: updatedEnemies, hand: [...hand], drawPile: [...drawPile], discardPile: [...discardPile] };
    }
    case 'block': {
      return {
        player: { ...player, block: player.block + calculateBlockGain(effect.value, player.statusEffects) },
        enemies, hand: [...hand],
        drawPile: [...drawPile],
        discardPile: [...discardPile],
      };
    }
    case 'draw': {
      const drawResult = drawCards(drawPile, hand, discardPile, effect.value);
      return {
        player, enemies,
        hand: [...drawResult.hand],
        drawPile: [...drawResult.drawPile],
        discardPile: [...drawResult.discardPile],
      };
    }
    case 'apply_status': {
      if (!effect.statusType) return { player, enemies, hand: [...hand], drawPile: [...drawPile], discardPile: [...discardPile] };
      const updatedEnemies = applyStatusEffect(effect, enemies, targetEnemyId);
      return { player, enemies: updatedEnemies, hand: [...hand], drawPile: [...drawPile], discardPile: [...discardPile] };
    }
    case 'gain_strength': {
      const updatedPlayer = addPlayerStatus(player, 'strength', effect.value);
      return { player: updatedPlayer, enemies, hand: [...hand], drawPile: [...drawPile], discardPile: [...discardPile] };
    }
    case 'gain_dexterity': {
      const updatedPlayer = addPlayerStatus(player, 'dexterity', effect.value);
      return { player: updatedPlayer, enemies, hand: [...hand], drawPile: [...drawPile], discardPile: [...discardPile] };
    }
    case 'add_power': {
      // 파워 누적은 playCard에서 처리
      return { player, enemies, hand: [...hand], drawPile: [...drawPile], discardPile: [...discardPile] };
    }
    case 'gain_energy': {
      return {
        player: { ...player, energy: player.energy + effect.value },
        enemies, hand: [...hand],
        drawPile: [...drawPile],
        discardPile: [...discardPile],
      };
    }
    case 'self_damage': {
      return {
        player: { ...player, hp: Math.max(0, player.hp - effect.value) },
        enemies, hand: [...hand],
        drawPile: [...drawPile],
        discardPile: [...discardPile],
      };
    }
    case 'heal': {
      return {
        player: { ...player, hp: Math.min(player.maxHp, player.hp + effect.value) },
        enemies, hand: [...hand],
        drawPile: [...drawPile],
        discardPile: [...discardPile],
      };
    }
  }
}

/** 플레이어에게 상태 효과 추가/누적 */
function addPlayerStatus(player: Player, statusType: StatusEffect['type'], value: number): Player {
  return { ...player, statusEffects: addStatusEffect(player.statusEffects, statusType, value) };
}

/** 전투 포션 효과 적용 */
export function usePotion(state: CombatState, potionId: PotionId, targetEnemyId?: string): CombatState {
  if (state.phase !== 'player_turn' || state.result !== 'ongoing') return state;

  if (potionId === 'healing_potion') {
    if (state.player.hp >= state.player.maxHp) return state;
    return { ...state, player: { ...state.player, hp: Math.min(state.player.maxHp, state.player.hp + POTION_BALANCE.healingPotionHeal) } };
  }

  if (potionId === 'block_potion') {
    return { ...state, player: { ...state.player, block: state.player.block + POTION_BALANCE.blockPotionBlock } };
  }

  if (potionId === 'energy_potion') {
    return { ...state, player: { ...state.player, energy: state.player.energy + POTION_BALANCE.energyPotionGain } };
  }

  if (potionId === 'strength_potion') {
    return { ...state, player: addPlayerStatus(state.player, 'strength', POTION_BALANCE.strengthPotionGain) };
  }

  // 대상 지정 포션 (화염·맹독)
  const targetId = targetEnemyId ?? state.enemies[0]?.id;
  if (!targetId || !state.enemies.some((enemy) => enemy.id === targetId)) return state;

  if (potionId === 'toxin_potion') {
    const enemies = state.enemies.map((enemy) => enemy.id === targetId
      ? { ...enemy, statusEffects: addStatusEffect(enemy.statusEffects, 'poison', POTION_BALANCE.toxinPotionStacks) }
      : enemy);
    return { ...state, enemies };
  }

  const enemies = state.enemies
    .map((enemy) => enemy.id === targetId ? applyFixedDamageToEnemy(enemy, POTION_BALANCE.firePotionDamage) : enemy)
    .filter((enemy) => enemy.hp > 0);
  return { ...state, enemies, result: enemies.length === 0 ? 'victory' : 'ongoing' };
}

/** 고정 피해의 방어도와 HP 반영 */
function applyFixedDamageToEnemy(enemy: Enemy, damage: number): Enemy {
  const blockedDamage = Math.min(enemy.block, damage);
  return {
    ...enemy,
    block: enemy.block - blockedDamage,
    hp: Math.max(0, enemy.hp - (damage - blockedDamage)),
  };
}

/** 상태 효과 지속시간 누적 */
function addStatusEffect(
  effects: readonly StatusEffect[],
  statusType: StatusEffect['type'],
  value: number,
): StatusEffect[] {
  const existing = effects.findIndex((effect) => effect.type === statusType);
  return existing >= 0
    ? effects.map((effect, index) => index === existing ? { ...effect, duration: effect.duration + value } : effect)
    : [...effects, { type: statusType, duration: value }];
}

/** 데미지 계산 (힘 + 약화 + 취약 반영) */
function calculateDamage(baseDamage: number, strength: number, attackerWeak: boolean, targetVulnerable: boolean): number {
  let total = baseDamage + strength;
  if (attackerWeak) total = Math.floor(total * COMBAT_BALANCE.weakMultiplier);
  if (targetVulnerable) total = Math.floor(total * COMBAT_BALANCE.vulnerableMultiplier);
  return Math.max(0, total);
}

/** 데미지 효과 적용 */
function applyDamageEffect(
  effect: CardEffect,
  strength: number,
  attackerWeak: boolean,
  enemies: Enemy[],
  targetEnemyId: string | undefined,
): Enemy[] {
  if (effect.target === 'all') {
    return enemies.map((enemy) => applyDamageToEnemy(enemy, effect.value, strength, attackerWeak));
  }
  return enemies.map((enemy) => {
    if (targetEnemyId && enemy.id !== targetEnemyId) return enemy;
    if (!targetEnemyId && enemies.indexOf(enemy) !== 0) return enemy;
    return applyDamageToEnemy(enemy, effect.value, strength, attackerWeak);
  });
}

/** 단일 적에게 데미지 적용 (방어 차감 → HP 감소) */
function applyDamageToEnemy(enemy: Enemy, baseDamage: number, strength: number, attackerWeak: boolean): Enemy {
  const isVulnerable = enemy.statusEffects.some((s) => s.type === 'vulnerable' && s.duration > 0);
  const damage = calculateDamage(baseDamage, strength, attackerWeak, isVulnerable);
  const blockedDamage = Math.min(enemy.block, damage);
  const remainingDamage = damage - blockedDamage;
  return {
    ...enemy,
    block: enemy.block - blockedDamage,
    hp: Math.max(0, enemy.hp - remainingDamage),
  };
}

/** 상태이상 부여 */
function applyStatusEffect(
  effect: CardEffect,
  enemies: Enemy[],
  targetEnemyId: string | undefined,
): Enemy[] {
  const { statusType } = effect;
  if (!statusType) return enemies;
  if (effect.target === 'all') {
    return enemies.map((enemy) => ({ ...enemy, statusEffects: addStatusEffect(enemy.statusEffects, statusType, effect.value) }));
  }
  return enemies.map((enemy) => {
    if (targetEnemyId && enemy.id !== targetEnemyId) return enemy;
    if (!targetEnemyId && enemies.indexOf(enemy) !== 0) return enemy;
    return { ...enemy, statusEffects: addStatusEffect(enemy.statusEffects, statusType, effect.value) };
  });
}
// #endregion

// #region 턴 종료
/** 플레이어 턴 종료 → 적 행동 → 다음 턴 준비 */
export function endPlayerTurn(state: CombatState): CombatState {
  if (state.phase !== 'player_turn' || state.result !== 'ongoing') return state;

  // 패 전체 버리기
  const { hand: emptyHand, discardPile: newDiscard } = discardHand(state.hand, state.discardPile);

  // 적 턴 시작: 방어도 초기화 + 독 피해 (방어 무시)
  let player = { ...state.player };
  let enemies = state.enemies
    .map((enemy) => ({ ...enemy, block: 0, hp: Math.max(0, enemy.hp - getStatusAmount(enemy.statusEffects, 'poison')) }))
    .filter((enemy) => enemy.hp > 0);

  // 독 전멸 시 즉시 승리
  if (enemies.length === 0) {
    return { ...state, player, enemies, hand: emptyHand, discardPile: newDiscard, result: 'victory' };
  }

  for (let index = 0; index < enemies.length; index++) {
    const actionResult = executeEnemyAction(enemies[index], player);
    player = actionResult.player;
    enemies[index] = actionResult.enemy;
  }

  // 패배 체크
  if (player.hp <= 0) {
    return {
      ...state,
      player: { ...player, hp: 0 },
      enemies,
      hand: emptyHand,
      discardPile: newDiscard,
      phase: 'enemy_turn',
      result: 'defeat',
    };
  }

  // 적 상태이상 턴 감소 + 다음 인텐트 결정
  enemies = enemies.map((enemy) => {
    const newTurnCount = enemy.turnCount + 1;
    const updatedEnemy: Enemy = {
      ...enemy,
      turnCount: newTurnCount,
      statusEffects: tickStatusEffects(enemy.statusEffects),
    };
    return { ...updatedEnemy, intent: decideIntent(updatedEnemy, state.ascension, state.mapIndex) };
  });

  // 플레이어 턴 시작: 독 피해 (방어 무시)
  const playerPoison = getStatusAmount(player.statusEffects, 'poison');
  const hpAfterPoison = player.hp - playerPoison;
  if (hpAfterPoison <= 0) {
    return {
      ...state,
      player: { ...player, hp: 0 },
      enemies,
      hand: emptyHand,
      discardPile: newDiscard,
      phase: 'enemy_turn',
      result: 'defeat',
    };
  }

  // 다음 턴: 방어 초기화 + 에너지 충전 + 지속 파워 발동 + 드로우
  const powers = state.powers ?? [];
  const powerBlock = getPowerValue(powers, 'turn_start_block');
  const powerStrength = getPowerValue(powers, 'turn_start_strength');
  const powerDraw = getPowerValue(powers, 'turn_start_draw');
  const powerHeal = getPowerValue(powers, 'turn_start_heal');

  const tickedEffects = tickStatusEffects(player.statusEffects);
  const nextPlayer: Player = {
    ...player,
    hp: Math.min(player.maxHp, hpAfterPoison + powerHeal),
    block: powerBlock,
    energy: player.maxEnergy,
    statusEffects: powerStrength > 0 ? addStatusEffect(tickedEffects, 'strength', powerStrength) : tickedEffects,
  };

  const drawResult = drawCards(state.drawPile, [], newDiscard, HAND_SIZE + powerDraw);

  return {
    player: nextPlayer,
    enemies,
    drawPile: drawResult.drawPile,
    hand: drawResult.hand,
    discardPile: drawResult.discardPile,
    exhaustPile: state.exhaustPile,
    powers,
    turn: state.turn + 1,
    phase: 'player_turn',
    result: 'ongoing',
    ascension: state.ascension,
    mapIndex: state.mapIndex,
  };
}

/** 지속 파워 종류별 수치 합산 */
function getPowerValue(powers: readonly PlayerPower[], powerType: PlayerPower['type']): number {
  return powers.reduce((total, power) => power.type === powerType ? total + power.value : total, 0);
}

/** 적 행동 실행 (인텐트 기반, 약화/취약 반영) */
function executeEnemyAction(
  enemy: Enemy,
  player: Player,
): { enemy: Enemy; player: Player } {
  switch (enemy.intent.type) {
    case 'attack': {
      const strength = enemy.statusEffects.find((status) => status.type === 'strength')?.duration ?? 0;
      const isWeak = enemy.statusEffects.some((s) => s.type === 'weak' && s.duration > 0);
      const isPlayerVulnerable = player.statusEffects.some((s) => s.type === 'vulnerable' && s.duration > 0);
      const damage = calculateDamage(enemy.intent.value, strength, isWeak, isPlayerVulnerable);
      const blockedDamage = Math.min(player.block, damage);
      const remainingDamage = damage - blockedDamage;
      return {
        enemy,
        player: {
          ...player,
          block: player.block - blockedDamage,
          hp: player.hp - remainingDamage,
        },
      };
    }
    case 'defend':
      // 손상 상태 적은 방어 획득 감소
      return {
        enemy: { ...enemy, block: enemy.block + calculateBlockGain(enemy.intent.value, enemy.statusEffects) },
        player,
      };
    case 'buff':
      return {
        enemy: { ...enemy, statusEffects: addStatusEffect(enemy.statusEffects, 'strength', enemy.intent.value) },
        player,
      };
    case 'debuff': {
      const { statusType } = enemy.intent;
      if (!statusType) return { enemy, player };
      // 독은 즉시 피해 없이 다음 턴부터 감산되므로 동일 턴 감소 보정 제외
      const compensation = statusType === 'poison' ? 0 : 1;
      return { enemy, player: addPlayerStatus(player, statusType, enemy.intent.value + compensation) };
    }
  }
}

/** 영구 유지 상태 효과 (턴 감소 미적용) */
const PERMANENT_STATUS_TYPES: readonly StatusEffect['type'][] = ['strength', 'dexterity'];

/** 상태이상 지속시간 1턴 감소, 0 이하 제거 (영구 효과 유지) */
function tickStatusEffects(effects: readonly StatusEffect[]): StatusEffect[] {
  return effects
    .map((e) => PERMANENT_STATUS_TYPES.includes(e.type) ? e : { ...e, duration: e.duration - 1 })
    .filter((e) => PERMANENT_STATUS_TYPES.includes(e.type) || e.duration > 0);
}
// #endregion

