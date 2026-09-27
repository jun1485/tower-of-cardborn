// 게임 기본 상태와 저장 복원 정규화

import { getAscensionModifier } from '@tower-of-cardborn/game-core/data/ascension';
import { GOLD_REWARD_BALANCE } from '@tower-of-cardborn/game-core/data/balance';
import { STARTER_DECK, getRewardCards } from '@tower-of-cardborn/game-core/data/cards';
import { initCombat } from '@tower-of-cardborn/game-core/game/combat-engine';
import { getFloorsClimbed } from '@tower-of-cardborn/game-core/game/map-generator';
import type { GameState } from '@tower-of-cardborn/game-core/types/game';
import type { GameMap, NodeType } from '@tower-of-cardborn/game-core/types/map';
import { random, resetRandomSource, restoreRandomState } from '@tower-of-cardborn/game-core/utils/random';
import { applyRelicGoldBonus, getRelicCombatBonuses, getRelicReward, hasExtraRewardCard } from '@tower-of-cardborn/game-core/data/relics';
import { rollPotionReward } from '@tower-of-cardborn/game-core/data/potions';
import type { PotionId } from '@tower-of-cardborn/game-core/types/potion';
import type { RelicId } from '@tower-of-cardborn/game-core/types/relic';
import { recordRunEnd, updateRecordedRun } from './meta';
import { applyEquipmentCombatBonuses } from './equipment';
import { clearSave, loadGame } from './storage';

export const DEFAULT_GAME_STATE: GameState = {
  screen: 'title',
  combatState: null,
  deck: STARTER_DECK,
  playerHp: getAscensionModifier(0).startHp,
  playerMaxHp: 80,
  map: null,
  characterClass: 'warrior',
  rewardCards: [],
  gold: getAscensionModifier(0).startGold,
  rewardGold: 0,
  shopCards: [],
  removeSource: null,
  kills: 0,
  ascension: 0,
  eventId: null,
  eventResult: null,
  seenEventIds: [],
  pendingRemoveCount: 0,
  pendingUpgradeCount: 0,
  upgradeSource: null,
  runRecorded: false,
  unlockedAscension: null,
  runSeed: null,
  randomState: null,
  relics: [],
  rewardRelic: null,
  potions: [],
  rewardPotion: null,
};

/** 노드 타입별 승리 보상 골드 산정 */
function rollGoldReward(nodeType: NodeType | undefined): number {
  switch (nodeType) {
    case 'elite': return GOLD_REWARD_BALANCE.eliteBase + Math.floor(random() * (GOLD_REWARD_BALANCE.eliteVariance + 1));
    case 'boss': return GOLD_REWARD_BALANCE.bossBase + Math.floor(random() * (GOLD_REWARD_BALANCE.bossVariance + 1));
    default: return GOLD_REWARD_BALANCE.normalBase + Math.floor(random() * (GOLD_REWARD_BALANCE.normalVariance + 1));
  }
}

/** 현재 맵 노드 조회 */
export function findCurrentNode(map: GameMap | null) {
  if (!map?.currentNodeId) return undefined;
  return map.nodes.find((node) => node.id === map.currentNodeId);
}

interface CombatRewards {
  readonly rewardCards: readonly string[];
  readonly rewardGold: number;
  readonly rewardRelic: RelicId | null;
  readonly rewardPotion: PotionId | null;
}

/** 현재 전투 노드 보상 일괄 산출 (보물 노드는 카드 보상 없음) */
export function rollCombatRewards(state: GameState, potionInventorySize = state.potions.length): CombatRewards {
  const currentNode = findCurrentNode(state.map);
  const rewardTier = currentNode?.type === 'boss' ? 'boss' : currentNode?.type === 'elite' ? 'elite' : 'normal';
  const rewardCardCount = hasExtraRewardCard(state.relics) ? 4 : 3;
  const rewardCards = currentNode?.type === 'treasure'
    ? state.rewardCards
    : state.rewardCards.length > 0
      ? state.rewardCards
      : getRewardCards(rewardCardCount, state.characterClass, rewardTier);
  // 보스는 보스 등급 유물, 엘리트는 일반 등급 유물 지급
  const rewardRelic = state.rewardRelic
    ?? (currentNode?.type === 'boss'
      ? getRelicReward(state.relics, 'boss') ?? getRelicReward(state.relics, 'normal')
      : currentNode?.type === 'elite' ? getRelicReward(state.relics, 'normal') : null);
  const exhaustedRelicGold = (currentNode?.type === 'elite' || currentNode?.type === 'boss') && !rewardRelic
    ? GOLD_REWARD_BALANCE.exhaustedRelicGold
    : 0;
  const rewardGold = state.rewardGold > 0
    ? state.rewardGold
    : applyRelicGoldBonus(rollGoldReward(currentNode?.type) + exhaustedRelicGold, state.relics);
  const rewardPotion = state.rewardPotion ?? rollPotionReward(currentNode?.type, potionInventorySize);
  return { rewardCards, rewardGold, rewardRelic, rewardPotion };
}

/** 미기록 런 종료 통계 반영 (기록 완료 런은 엔들리스 진행분만 갱신) */
export function recordUnfinishedRun(state: GameState): boolean {
  if (!state.map) return true;
  if (state.runRecorded) {
    return state.recordedRunAt == null
      ? true
      : updateRecordedRun(state.recordedRunAt, {
          floor: getFloorsClimbed(state.map),
          kills: state.kills,
          ascension: state.ascension,
        });
  }
  const currentNode = findCurrentNode(state.map);
  // 승리 연출 중 이탈은 보상 화면 진입과 동일 취급
  const pendingVictory = state.screen === 'combat' && state.combatState?.result === 'victory';
  const finalBossCleared = (state.screen === 'combat_reward' || pendingVictory)
    && currentNode?.type === 'boss'
    && state.map.mapIndex >= state.map.totalMaps;
  return recordRunEnd({
    won: state.screen === 'victory' || finalBossCleared,
    floor: getFloorsClimbed(state.map),
    kills: state.kills + (pendingVictory ? currentNode?.enemyIds.length ?? 0 : 0),
    ascension: state.ascension,
    runSeed: state.runSeed,
    characterClass: state.characterClass,
    isDaily: state.isDaily ?? false,
  }).saved;
}

/** 저장 게임 상태 복원 정규화 */
export function loadValidGameState(): GameState {
  const saved = loadGame();
  if (!saved) {
    resetRandomSource();
    return DEFAULT_GAME_STATE;
  }
  restoreRandomState(saved.randomState ?? null);

  const needsMap = ['map', 'combat', 'rest', 'upgrade', 'remove_card', 'shop', 'event', 'combat_reward'];
  if (needsMap.includes(saved.screen) && !saved.map) {
    clearSave();
    resetRandomSource();
    return DEFAULT_GAME_STATE;
  }

  const migratedCombatState = saved.combatState
    ? {
        ...saved.combatState,
        exhaustPile: Array.isArray(saved.combatState.exhaustPile) ? saved.combatState.exhaustPile : [],
        powers: Array.isArray(saved.combatState.powers) ? saved.combatState.powers : [],
        mapIndex: saved.combatState.mapIndex ?? saved.map?.mapIndex ?? 1,
      }
    : null;
  const baseState: GameState = {
    ...saved,
    combatState: migratedCombatState,
    runSeed: saved.runSeed ?? null,
    randomState: saved.randomState ?? null,
    relics: saved.relics ?? [],
    rewardRelic: saved.rewardRelic ?? null,
    potions: saved.potions ?? [],
    rewardPotion: saved.rewardPotion ?? null,
  };

  if (baseState.screen === 'combat') {
    if (baseState.combatState?.result === 'victory') {
      const currentNode = findCurrentNode(baseState.map);
      const rewards = rollCombatRewards(baseState);
      return {
        ...baseState,
        screen: 'combat_reward',
        playerHp: baseState.combatState.player.hp,
        ...rewards,
        kills: baseState.kills + (currentNode?.enemyIds.length ?? 0),
        combatState: null,
      };
    }
    if (baseState.combatState?.result === 'defeat') {
      return { ...baseState, screen: 'game_over', rewardCards: [], combatState: null };
    }
    if (!baseState.combatState) {
      const currentNode = findCurrentNode(baseState.map);
      if (!currentNode || currentNode.enemyIds.length === 0) {
        clearSave();
        resetRandomSource();
        return DEFAULT_GAME_STATE;
      }
      return {
        ...baseState,
        combatState: initCombat(
          baseState.deck,
          currentNode.enemyIds,
          baseState.playerHp,
          baseState.playerMaxHp,
          baseState.ascension,
          baseState.map?.mapIndex ?? 1,
          applyEquipmentCombatBonuses(getRelicCombatBonuses(baseState.relics), baseState.isDaily ?? false),
        ),
      };
    }
  }

  // 저장된 보상 유지 (재추첨 방지), 카드 보상 없는 구버전 전투 보상 저장본만 산출
  if (baseState.screen === 'combat_reward') {
    const needsRoll = baseState.rewardCards.length === 0 && findCurrentNode(baseState.map)?.type !== 'treasure';
    return {
      ...baseState,
      ...(needsRoll ? rollCombatRewards(baseState) : {}),
      combatState: null,
    };
  }
  return baseState.screen === 'event' && !baseState.eventId ? { ...baseState, screen: 'map' } : baseState;
}
