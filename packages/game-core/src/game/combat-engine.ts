// 전투 로직: 카드 사용, 데미지/방어 계산, 턴 처리

import type { CardEffect, CardInstance } from '../types/card';
import type { CombatState } from '../types/combat';
import type { Enemy, Player, StatusEffect } from '../types/character';
import { CARD_DEFINITIONS } from '../data/cards';
import { ENEMY_DEFINITIONS } from '../data/enemies';
import { createDrawPile, discardHand, drawCards } from './deck-manager';
import { decideIntent } from './enemy-ai';
import { generateId } from '../utils/random';

const HAND_SIZE = 5;
const STARTING_ENERGY = 3;

// #region 전투 초기화
/** 전투 상태 초기 생성 */
export function initCombat(
  deckIds: readonly string[],
  enemyIds: readonly string[],
  playerHp = 80,
  playerMaxHp = 80,
): CombatState {
  const drawPile = createDrawPile(deckIds);
  const enemies: Enemy[] = enemyIds.map((id) => {
    const def = ENEMY_DEFINITIONS[id];
    const enemy: Enemy = {
      id: generateId(),
      name: def.name,
      hp: def.hp,
      maxHp: def.maxHp,
      block: 0,
      intent: { type: 'attack', value: 0 },
      statusEffects: [],
      turnCount: 0,
      definitionId: def.id,
    };
    return { ...enemy, intent: decideIntent(enemy) };
  });

  const player: Player = {
    hp: playerHp,
    maxHp: playerMaxHp,
    block: 0,
    energy: STARTING_ENERGY,
    maxEnergy: STARTING_ENERGY,
    statusEffects: [],
  };

  const { hand, drawPile: remainingDraw, discardPile } = drawCards(drawPile, [], [], HAND_SIZE);

  return {
    player,
    enemies,
    drawPile: remainingDraw,
    hand,
    discardPile,
    exhaustPile: [],
    turn: 1,
    phase: 'player_turn',
    result: 'ongoing',
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
  if (state.player.energy < definition.cost) return state;

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

  // 효과 적용
  let currentHand = [...newHand];
  for (const effect of definition.effects) {
    const result = applyEffect(effect, player, enemies, targetEnemyId, currentHand, drawPile, newDiscardPile);
    player = result.player;
    enemies = result.enemies;
    currentHand = result.hand;
    drawPile = result.drawPile;
    newDiscardPile = result.discardPile;
  }

  // 사망한 적 제거
  enemies = enemies.filter((e) => e.hp > 0);

  // 승리 체크
  const result = enemies.length === 0 ? 'victory' as const : 'ongoing' as const;

  return {
    ...state,
    player,
    enemies,
    hand: currentHand,
    drawPile,
    discardPile: newDiscardPile,
    exhaustPile: newExhaustPile,
    result,
  };
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
        player: { ...player, block: player.block + effect.value },
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
  const existing = player.statusEffects.findIndex((s) => s.type === statusType);
  let newEffects: StatusEffect[];
  if (existing >= 0) {
    newEffects = player.statusEffects.map((s, i) =>
      i === existing ? { ...s, duration: s.duration + value } : s,
    ) as StatusEffect[];
  } else {
    newEffects = [...player.statusEffects, { type: statusType, duration: value }];
  }
  return { ...player, statusEffects: newEffects };
}

/** 데미지 계산 (힘 + 약화 + 취약 반영) */
function calculateDamage(baseDamage: number, strength: number, attackerWeak: boolean, targetVulnerable: boolean): number {
  let total = baseDamage + strength;
  if (attackerWeak) total = Math.floor(total * 0.75);
  if (targetVulnerable) total = Math.floor(total * 1.5);
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
  if (!effect.statusType) return enemies;
  return enemies.map((enemy) => {
    if (targetEnemyId && enemy.id !== targetEnemyId) return enemy;
    if (!targetEnemyId && enemies.indexOf(enemy) !== 0) return enemy;
    const existing = enemy.statusEffects.findIndex((s) => s.type === effect.statusType);
    let newEffects: StatusEffect[];
    if (existing >= 0) {
      newEffects = enemy.statusEffects.map((s, i) =>
        i === existing ? { ...s, duration: s.duration + effect.value } : s,
      );
    } else {
      newEffects = [...enemy.statusEffects, { type: effect.statusType!, duration: effect.value }];
    }
    return { ...enemy, statusEffects: newEffects };
  });
}
// #endregion

// #region 턴 종료
/** 플레이어 턴 종료 → 적 행동 → 다음 턴 준비 */
export function endPlayerTurn(state: CombatState): CombatState {
  if (state.phase !== 'player_turn' || state.result !== 'ongoing') return state;

  // 패 전체 버리기
  const { hand: emptyHand, discardPile: newDiscard } = discardHand(state.hand, state.discardPile);

  // 적 행동 실행
  let player = { ...state.player };
  let enemies = state.enemies.map((enemy) => ({ ...enemy }));

  for (const enemy of enemies) {
    const actionResult = executeEnemyAction(enemy, player);
    player = actionResult.player;
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

  // 적 상태이상 턴 감소 + 방어 초기화 + 다음 인텐트 결정
  enemies = enemies.map((enemy) => {
    const newTurnCount = enemy.turnCount + 1;
    const updatedEnemy: Enemy = {
      ...enemy,
      block: 0,
      turnCount: newTurnCount,
      statusEffects: tickStatusEffects(enemy.statusEffects),
    };
    return { ...updatedEnemy, intent: decideIntent(updatedEnemy) };
  });

  // 다음 턴: 플레이어 방어 초기화 + 에너지 충전 + 드로우
  const nextPlayer: Player = {
    ...player,
    block: 0,
    energy: player.maxEnergy,
    statusEffects: tickStatusEffects(player.statusEffects),
  };

  const drawResult = drawCards(state.drawPile, [], newDiscard, HAND_SIZE);

  return {
    player: nextPlayer,
    enemies,
    drawPile: drawResult.drawPile,
    hand: drawResult.hand,
    discardPile: drawResult.discardPile,
    exhaustPile: state.exhaustPile,
    turn: state.turn + 1,
    phase: 'player_turn',
    result: 'ongoing',
  };
}

/** 적 행동 실행 (인텐트 기반, 약화/취약 반영) */
function executeEnemyAction(
  enemy: Enemy,
  player: Player,
): { player: Player } {
  switch (enemy.intent.type) {
    case 'attack': {
      const isWeak = enemy.statusEffects.some((s) => s.type === 'weak' && s.duration > 0);
      const isPlayerVulnerable = player.statusEffects.some((s) => s.type === 'vulnerable' && s.duration > 0);
      const damage = calculateDamage(enemy.intent.value, 0, isWeak, isPlayerVulnerable);
      const blockedDamage = Math.min(player.block, damage);
      const remainingDamage = damage - blockedDamage;
      return {
        player: {
          ...player,
          block: player.block - blockedDamage,
          hp: player.hp - remainingDamage,
        },
      };
    }
    case 'defend':
      return { player };
    case 'buff':
      return { player };
  }
}

/** 상태이상 지속시간 1턴 감소, 0 이하 제거 (strength는 영구 유지) */
function tickStatusEffects(effects: readonly StatusEffect[]): StatusEffect[] {
  return effects
    .map((e) => e.type === 'strength' ? e : { ...e, duration: e.duration - 1 })
    .filter((e) => e.type === 'strength' || e.duration > 0);
}
// #endregion

