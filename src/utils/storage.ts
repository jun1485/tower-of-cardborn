// localStorage 저장/복원 래퍼 (버전 및 구조 검증 포함)

import type { CombatState } from '@tower-of-cardborn/game-core/types/combat';
import type { Enemy, Intent, Player, StatusEffect } from '@tower-of-cardborn/game-core/types/character';
import type { GameScreen, GameState } from '@tower-of-cardborn/game-core/types/game';
import type { GameMap, MapNode, NodeType } from '@tower-of-cardborn/game-core/types/map';
import { CARD_DEFINITIONS } from '@tower-of-cardborn/game-core/data/cards';
import { ENEMY_DEFINITIONS } from '@tower-of-cardborn/game-core/data/enemies';
import { EVENTS } from '@tower-of-cardborn/game-core/data/events';
import { getAscensionModifier, MAX_ASCENSION } from '@tower-of-cardborn/game-core/data/ascension';
import { RELIC_DEFINITIONS } from '@tower-of-cardborn/game-core/data/relics';
import type { RelicId } from '@tower-of-cardborn/game-core/types/relic';
import { MAX_POTION_SLOTS, POTION_DEFINITIONS } from '@tower-of-cardborn/game-core/data/potions';
import type { PotionId } from '@tower-of-cardborn/game-core/types/potion';
import type { EventId } from '@tower-of-cardborn/game-core/types/event';

const SAVE_KEY = 'tower-of-cardborn-save';
const SAVE_VERSION = 8;
const LEGACY_SAVE_VERSIONS: readonly number[] = [3, 5, 6];

const GAME_SCREENS: readonly GameScreen[] = [
  'title', 'map', 'combat', 'combat_reward', 'rest', 'upgrade',
  'remove_card', 'shop', 'event', 'game_over', 'victory',
];
const NODE_TYPES: readonly NodeType[] = ['combat', 'elite', 'rest', 'shop', 'event', 'boss', 'treasure'];
const STATUS_TYPES: readonly StatusEffect['type'][] = ['vulnerable', 'weak', 'strength', 'poison', 'frail', 'dexterity'];
const INTENT_STATUS_TYPES: readonly string[] = ['vulnerable', 'weak', 'poison', 'frail'];
const POWER_TYPES: readonly string[] = ['turn_start_block', 'turn_start_strength', 'turn_start_draw', 'turn_start_heal'];

interface SaveData {
  readonly version: number;
  readonly state: GameState;
}

/** JSON 객체 형태 확인 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 유한 숫자 확인 */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** 0 이상 정수 확인 */
function isNonNegativeInteger(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0;
}

/** 레거시 맵 구조 현행화 */
function migrateLegacyMap(value: unknown): unknown {
  if (!isRecord(value) || !Array.isArray(value.nodes)) return value;
  const legacyNodes = value.nodes;
  const nodes = legacyNodes.map((node) => {
    if (!isRecord(node) || node.pos !== undefined) return node;
    const sameFloorNodes = legacyNodes.filter((candidate) => isRecord(candidate) && candidate.floor === node.floor);
    const floorIndex = sameFloorNodes.indexOf(node);
    return { ...node, pos: (floorIndex + 1) / (sameFloorNodes.length + 1) };
  });
  return {
    ...value,
    nodes,
    mapIndex: value.mapIndex === undefined ? 1 : value.mapIndex,
    totalMaps: value.totalMaps === undefined ? 1 : value.totalMaps,
    totalFloorsPerMap: value.totalFloorsPerMap === undefined ? value.totalFloors : value.totalFloorsPerMap,
  };
}

/** 레거시 전투 구조 현행화 */
function migrateLegacyCombat(value: unknown, ascension: unknown, mapIndex: unknown): unknown {
  return isRecord(value)
    ? {
        ...value,
        ascension: value.ascension === undefined ? ascension : value.ascension,
        mapIndex: value.mapIndex === undefined ? mapIndex : value.mapIndex,
      }
    : value;
}

/** 레거시 게임 상태 현행화 */
function migrateLegacyState(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const ascension = value.ascension === undefined ? 0 : value.ascension;
  const map = migrateLegacyMap(value.map);
  const mapIndex = isRecord(map) ? map.mapIndex : 1;
  return {
    ...value,
    combatState: migrateLegacyCombat(value.combatState, ascension, mapIndex),
    map,
    gold: value.gold === undefined ? getAscensionModifier(0).startGold : value.gold,
    rewardGold: value.rewardGold === undefined ? 0 : value.rewardGold,
    shopCards: value.shopCards === undefined ? [] : value.shopCards,
    removeSource: value.removeSource === undefined ? null : value.removeSource,
    kills: value.kills === undefined ? 0 : value.kills,
    ascension,
    eventId: value.eventId === undefined ? null : value.eventId,
    eventResult: value.eventResult === undefined ? null : value.eventResult,
    seenEventIds: value.seenEventIds === undefined ? [] : value.seenEventIds,
    pendingRemoveCount: value.pendingRemoveCount === undefined ? 0 : value.pendingRemoveCount,
    pendingUpgradeCount: value.pendingUpgradeCount === undefined ? 0 : value.pendingUpgradeCount,
    upgradeSource: value.upgradeSource === undefined ? null : value.upgradeSource,
    runRecorded: value.runRecorded === undefined ? false : value.runRecorded,
    unlockedAscension: value.unlockedAscension === undefined ? null : value.unlockedAscension,
  };
}

/** 구버전 저장 데이터 현행 버전 승격 */
function migrateSave(version: number, state: unknown): unknown {
  return LEGACY_SAVE_VERSIONS.includes(version)
    ? migrateLegacyState(state)
    : null;
}

/** 런 시드 범위 확인 */
function isRandomSeed(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0 && value <= 0xFFFFFFFF;
}

/** 문자열 배열 확인 */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** 카드 ID 배열 확인 */
function isCardIdArray(value: unknown): value is string[] {
  return isStringArray(value) && value.every((cardId) => CARD_DEFINITIONS[cardId] !== undefined);
}

/** 적 ID 배열 확인 */
function isEnemyIdArray(value: unknown): value is string[] {
  return isStringArray(value) && value.every((enemyId) => ENEMY_DEFINITIONS[enemyId] !== undefined);
}

/** 유물 ID 확인 */
function isRelicId(value: unknown): value is RelicId {
  return typeof value === 'string' && Object.hasOwn(RELIC_DEFINITIONS, value);
}

/** 유물 ID 배열 확인 */
function isRelicIdArray(value: unknown): value is RelicId[] {
  return isStringArray(value)
    && value.every(isRelicId)
    && new Set(value).size === value.length;
}

/** 포션 ID 확인 */
function isPotionId(value: unknown): value is PotionId {
  return typeof value === 'string' && Object.hasOwn(POTION_DEFINITIONS, value);
}

/** 포션 인벤토리 확인 */
function isPotionIdArray(value: unknown): value is PotionId[] {
  return Array.isArray(value) && value.length <= MAX_POTION_SLOTS && value.every(isPotionId);
}

/** 이벤트 ID 확인 */
function isEventId(value: unknown): value is EventId {
  return typeof value === 'string' && EVENTS.some((event) => event.id === value);
}

/** 이벤트 ID 배열 확인 */
function isEventIdArray(value: unknown): value is EventId[] {
  return Array.isArray(value) && value.every(isEventId);
}

/** 상태 효과 구조 확인 */
function isStatusEffect(value: unknown): value is StatusEffect {
  return isRecord(value)
    && STATUS_TYPES.includes(value.type as StatusEffect['type'])
    && isNonNegativeInteger(value.duration)
    && value.duration > 0;
}

/** 플레이어 상태 구조 확인 */
function isPlayer(value: unknown): value is Player {
  return isRecord(value)
    && isNonNegativeInteger(value.hp)
    && isNonNegativeInteger(value.maxHp)
    && isNonNegativeInteger(value.block)
    && isNonNegativeInteger(value.energy)
    && isNonNegativeInteger(value.maxEnergy)
    && value.maxHp > 0
    && value.hp <= value.maxHp
    && Array.isArray(value.statusEffects)
    && value.statusEffects.every(isStatusEffect);
}

/** 적 인텐트 구조 확인 */
function isIntent(value: unknown): value is Intent {
  return isRecord(value)
    && (value.type === 'attack' || value.type === 'defend' || value.type === 'buff' || value.type === 'debuff')
    && isNonNegativeInteger(value.value)
    && (value.type !== 'debuff'
      || (typeof value.statusType === 'string' && INTENT_STATUS_TYPES.includes(value.statusType)));
}

/** 지속 파워 배열 구조 확인 */
function isPowerArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((power) => (
    isRecord(power)
    && typeof power.type === 'string'
    && POWER_TYPES.includes(power.type)
    && isNonNegativeInteger(power.value)
  ));
}

/** 적 상태 구조 확인 */
function isEnemy(value: unknown): value is Enemy {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.definitionId === 'string'
    && ENEMY_DEFINITIONS[value.definitionId] !== undefined
    && isNonNegativeInteger(value.hp)
    && isNonNegativeInteger(value.maxHp)
    && isNonNegativeInteger(value.block)
    && isNonNegativeInteger(value.turnCount)
    && value.maxHp > 0
    && value.hp <= value.maxHp
    && isIntent(value.intent)
    && Array.isArray(value.statusEffects)
    && value.statusEffects.every(isStatusEffect);
}

/** 카드 파일 구조 확인 */
function isCardPile(value: unknown): boolean {
  return Array.isArray(value) && value.every((card) => (
    isRecord(card)
    && typeof card.instanceId === 'string'
    && typeof card.definitionId === 'string'
    && CARD_DEFINITIONS[card.definitionId] !== undefined
  ));
}

/** 전투 상태 구조 확인 */
function isCombatState(value: unknown): value is CombatState {
  return isRecord(value)
    && isPlayer(value.player)
    && Array.isArray(value.enemies)
    && value.enemies.every(isEnemy)
    && isCardPile(value.drawPile)
    && isCardPile(value.hand)
    && isCardPile(value.discardPile)
    && (value.exhaustPile === undefined || isCardPile(value.exhaustPile))
    && (value.powers === undefined || isPowerArray(value.powers))
    && isNonNegativeInteger(value.turn)
    && value.turn >= 1
    && (value.phase === 'player_turn' || value.phase === 'enemy_turn')
    && (value.result === 'ongoing' || value.result === 'victory' || value.result === 'defeat')
    && isNonNegativeInteger(value.ascension)
    && value.ascension <= MAX_ASCENSION
    && (value.mapIndex === undefined || (isNonNegativeInteger(value.mapIndex) && value.mapIndex >= 1));
}

/** 맵 노드 구조 확인 */
function isMapNode(value: unknown): value is MapNode {
  return isRecord(value)
    && typeof value.id === 'string'
    && isNonNegativeInteger(value.floor)
    && isFiniteNumber(value.pos)
    && value.floor >= 1
    && value.pos >= 0
    && value.pos <= 1
    && NODE_TYPES.includes(value.type as NodeType)
    && isStringArray(value.nextNodeIds)
    && isEnemyIdArray(value.enemyIds)
    && ((value.type === 'combat' || value.type === 'elite' || value.type === 'boss')
      ? value.enemyIds.length > 0
      : value.enemyIds.length === 0);
}

/** 맵 상태 구조 확인 */
function isGameMap(value: unknown): value is GameMap {
  if (!isRecord(value) || !Array.isArray(value.nodes) || !value.nodes.every(isMapNode)) return false;
  const { totalFloorsPerMap } = value;
  if ((value.currentNodeId !== null && typeof value.currentNodeId !== 'string')
    || !isStringArray(value.visitedNodeIds)
    || !isNonNegativeInteger(value.mapIndex)
    || !isNonNegativeInteger(value.totalMaps)
    || !isNonNegativeInteger(totalFloorsPerMap)) return false;
  const nodeIds = new Set(value.nodes.map((node) => node.id));
  const nodesById = new Map(value.nodes.map((node) => [node.id, node]));
  return nodeIds.size === value.nodes.length
    && value.mapIndex >= 1
    && value.totalMaps >= value.mapIndex
    && totalFloorsPerMap >= 1
    && (value.currentNodeId === null || nodeIds.has(value.currentNodeId))
    && value.visitedNodeIds.every((nodeId) => nodeIds.has(nodeId))
    && value.nodes.every((node) => node.floor <= totalFloorsPerMap)
    && value.nodes.every((node) => node.nextNodeIds.every((nodeId) => nodesById.get(nodeId)?.floor === node.floor + 1));
}

/** 이벤트 결과 구조 확인 */
function isEventResult(value: unknown): boolean {
  return isRecord(value)
    && typeof value.key === 'string'
    && Array.isArray(value.args)
    && value.args.every((arg) => typeof arg === 'string' || isFiniteNumber(arg));
}

/** 게임 저장 상태 구조 확인 */
function isGameState(value: unknown): value is GameState {
  if (!isRecord(value)) return false;
  return GAME_SCREENS.includes(value.screen as GameScreen)
    && (value.combatState === null || isCombatState(value.combatState))
    && isCardIdArray(value.deck)
    && isNonNegativeInteger(value.playerHp)
    && isNonNegativeInteger(value.playerMaxHp)
    && value.playerMaxHp > 0
    && value.playerHp <= value.playerMaxHp
    && (value.map === null || isGameMap(value.map))
    && (value.characterClass === 'warrior' || value.characterClass === 'archer'
      || value.characterClass === 'mage' || value.characterClass === 'assassin')
    && isCardIdArray(value.rewardCards)
    && isNonNegativeInteger(value.gold)
    && isNonNegativeInteger(value.rewardGold)
    && isCardIdArray(value.shopCards)
    && (value.removeSource === null || value.removeSource === 'rest'
      || value.removeSource === 'shop' || value.removeSource === 'event')
    && isNonNegativeInteger(value.kills)
    && isNonNegativeInteger(value.ascension)
    && value.ascension <= MAX_ASCENSION
    && (value.eventId === null || isEventId(value.eventId))
    && (value.eventResult === null || isEventResult(value.eventResult))
    && isEventIdArray(value.seenEventIds)
    && isNonNegativeInteger(value.pendingRemoveCount)
    && isNonNegativeInteger(value.pendingUpgradeCount)
    && (value.upgradeSource === null || value.upgradeSource === 'rest'
      || value.upgradeSource === 'event' || value.upgradeSource === 'shop')
    && typeof value.runRecorded === 'boolean'
    && (value.unlockedAscension === null
      || (isNonNegativeInteger(value.unlockedAscension) && value.unlockedAscension <= MAX_ASCENSION))
    && (value.runSeed === undefined || value.runSeed === null || isRandomSeed(value.runSeed))
    && (value.randomState === undefined || value.randomState === null || isRandomSeed(value.randomState))
    && (value.relics === undefined || isRelicIdArray(value.relics))
    && (value.rewardRelic === undefined || value.rewardRelic === null || isRelicId(value.rewardRelic))
    && (value.potions === undefined || isPotionIdArray(value.potions))
    && (value.rewardPotion === undefined || value.rewardPotion === null || isPotionId(value.rewardPotion))
    && (value.shopRelics === undefined || isRelicIdArray(value.shopRelics))
    && (value.shopPotions === undefined || isPotionIdArray(value.shopPotions))
    && (value.isDaily === undefined || typeof value.isDaily === 'boolean')
    && (value.recordedRunAt === undefined || value.recordedRunAt === null || isNonNegativeInteger(value.recordedRunAt));
}

/** 손상 저장 데이터 정리 */
function removeInvalidSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    console.error('손상된 게임 저장 데이터를 정리하지 못했습니다.');
  }
}

/** 게임 상태 저장 */
export function saveGame(state: GameState): boolean {
  try {
    const data: SaveData = { version: SAVE_VERSION, state };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    console.error('게임 상태를 저장하지 못했습니다.');
    return false;
  }
}

/** 게임 상태 복원 (구버전 저장본 마이그레이션 포함) */
export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)
      || !isNonNegativeInteger(parsed.version)
      || parsed.version < 1
      || parsed.version > SAVE_VERSION) {
      removeInvalidSave();
      return null;
    }
    const migrated = parsed.version === SAVE_VERSION
      ? parsed.state
      : migrateSave(parsed.version, parsed.state);
    if (!isGameState(migrated)) {
      removeInvalidSave();
      return null;
    }
    // 승격된 저장본 현행 버전 재저장
    if (parsed.version !== SAVE_VERSION) saveGame(migrated);
    return migrated;
  } catch {
    removeInvalidSave();
    return null;
  }
}

/** 게임 저장 데이터 삭제 */
export function clearSave(): boolean {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch {
    console.error('게임 저장 데이터를 삭제하지 못했습니다.');
    return false;
  }
}
