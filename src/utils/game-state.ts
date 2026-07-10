// 게임 기본 상태와 저장 복원 정규화

import { getAscensionModifier } from '@tower-of-cardborn/game-core/data/ascension';
import { STARTER_DECK, getRewardCards } from '@tower-of-cardborn/game-core/data/cards';
import { initCombat } from '@tower-of-cardborn/game-core/game/combat-engine';
import { getFloorsClimbed } from '@tower-of-cardborn/game-core/game/map-generator';
import type { GameState } from '@tower-of-cardborn/game-core/types/game';
import type { GameMap, NodeType } from '@tower-of-cardborn/game-core/types/map';
import { random, resetRandomSource, restoreRandomState } from '@tower-of-cardborn/game-core/utils/random';
import { recordRunEnd } from './meta';
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
};

/** 노드 타입별 승리 보상 골드 산정 */
export function rollGoldReward(nodeType: NodeType | undefined): number {
  switch (nodeType) {
    case 'elite': return 30 + Math.floor(random() * 11);
    case 'boss': return 60 + Math.floor(random() * 16);
    default: return 12 + Math.floor(random() * 7);
  }
}

/** 현재 맵 노드 조회 */
export function findCurrentNode(map: GameMap | null) {
  if (!map?.currentNodeId) return undefined;
  return map.nodes.find((node) => node.id === map.currentNodeId);
}

/** 미기록 런 종료 통계 반영 */
export function recordUnfinishedRun(state: GameState): void {
  if (!state.map || state.runRecorded) return;
  const currentNode = findCurrentNode(state.map);
  const finalBossCleared = state.screen === 'combat_reward'
    && currentNode?.type === 'boss'
    && state.map.mapIndex >= state.map.totalMaps;
  recordRunEnd({
    won: state.screen === 'victory' || finalBossCleared,
    floor: getFloorsClimbed(state.map),
    kills: state.kills,
    ascension: state.ascension,
    runSeed: state.runSeed,
  });
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
    return DEFAULT_GAME_STATE;
  }

  const migratedCombatState = saved.combatState
    ? {
        ...saved.combatState,
        exhaustPile: Array.isArray(saved.combatState.exhaustPile) ? saved.combatState.exhaustPile : [],
        mapIndex: saved.combatState.mapIndex ?? saved.map?.mapIndex ?? 1,
      }
    : null;
  const baseState: GameState = {
    ...saved,
    combatState: migratedCombatState,
    runSeed: saved.runSeed ?? null,
    randomState: saved.randomState ?? null,
  };

  if (baseState.screen === 'combat') {
    if (baseState.combatState?.result === 'victory') {
      const currentNode = findCurrentNode(baseState.map);
      return {
        ...baseState,
        screen: 'combat_reward',
        playerHp: baseState.combatState.player.hp,
        rewardCards: baseState.rewardCards.length > 0 ? baseState.rewardCards : getRewardCards(3, baseState.characterClass),
        rewardGold: baseState.rewardGold > 0 ? baseState.rewardGold : rollGoldReward(currentNode?.type),
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
        ),
      };
    }
  }

  if (baseState.screen === 'combat_reward') {
    return {
      ...baseState,
      rewardCards: baseState.rewardCards.length > 0 ? baseState.rewardCards : getRewardCards(3, baseState.characterClass),
      combatState: null,
    };
  }
  return baseState.screen === 'event' && !baseState.eventId ? { ...baseState, screen: 'map' } : baseState;
}
