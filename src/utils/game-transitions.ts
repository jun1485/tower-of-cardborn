// 맵과 이벤트 게임 상태 전환

import { getAvailableNodeIds } from '@tower-of-cardborn/game-core/game/map-generator';
import type { EventId } from '@tower-of-cardborn/game-core/types/event';
import type { EventOutcome } from '@tower-of-cardborn/game-core/game/event-engine';
import type { GameState } from '@tower-of-cardborn/game-core/types/game';
import type { GameMap } from '@tower-of-cardborn/game-core/types/map';
import { findCurrentNode } from './game-state';
import { canUpgrade, getCardPrice, getUpgradedId } from '@tower-of-cardborn/game-core/data/cards';
import { getAscensionModifier } from '@tower-of-cardborn/game-core/data/ascension';
import type { RelicId } from '@tower-of-cardborn/game-core/types/relic';

export const REMOVE_PRICE = 60;
export const MIN_DECK_SIZE = 1;

/** 맵 노드 선택 상태 전환 */
export function enterMapNode(
  state: GameState,
  nodeId: string,
  eventId: EventId | null,
  shopCards: readonly string[],
): GameState {
  if (state.screen !== 'map' || !state.map || !getAvailableNodeIds(state.map).includes(nodeId)) return state;
  const node = state.map.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) return state;
  if ((node.type === 'combat' || node.type === 'elite' || node.type === 'boss') && node.enemyIds.length === 0) return state;
  if (node.type === 'event' && !eventId) return state;
  const updatedMap = {
    ...state.map,
    currentNodeId: nodeId,
    visitedNodeIds: state.map.visitedNodeIds.includes(nodeId)
      ? state.map.visitedNodeIds
      : [...state.map.visitedNodeIds, nodeId],
  };

  switch (node.type) {
    case 'combat':
    case 'elite':
    case 'boss':
      return { ...state, screen: 'combat', map: updatedMap, rewardCards: [], rewardRelic: null };
    case 'rest':
      return { ...state, screen: 'rest', map: updatedMap, rewardCards: [] };
    case 'shop':
      return { ...state, screen: 'shop', map: updatedMap, rewardCards: [], shopCards };
    case 'event':
      return {
        ...state,
        screen: 'event',
        map: updatedMap,
        rewardCards: [],
        eventId,
        eventResult: null,
        seenEventIds: eventId && !state.seenEventIds.includes(eventId)
          ? [...state.seenEventIds, eventId]
          : state.seenEventIds,
      };
  }
}

/** 이벤트 결과 상태 반영 */
export function applyEventOutcome(state: GameState, eventId: EventId, outcome: EventOutcome): GameState {
  if (state.screen !== 'event' || state.eventResult || state.eventId !== eventId) return state;
  const base = {
    ...state,
    playerHp: outcome.hp,
    playerMaxHp: outcome.maxHp,
    gold: outcome.gold,
    deck: outcome.gainedCardId ? [...state.deck, outcome.gainedCardId] : state.deck,
  };
  if (outcome.followUp?.type === 'remove') {
    return { ...base, screen: 'remove_card', removeSource: 'event', pendingRemoveCount: outcome.followUp.count, eventId: null, eventResult: null };
  }
  if (outcome.followUp?.type === 'upgrade') {
    return { ...base, screen: 'upgrade', upgradeSource: 'event', pendingUpgradeCount: outcome.followUp.count, eventId: null, eventResult: null };
  }
  return outcome.result
    ? { ...base, eventResult: outcome.result }
    : { ...base, screen: 'map', eventId: null, eventResult: null };
}

/** 이벤트 결과 화면 종료 */
export function finishEventState(state: GameState): GameState {
  return state.screen === 'event' && state.eventResult
    ? { ...state, screen: 'map', eventId: null, eventResult: null }
    : state;
}

/** 휴식 회복 상태 반영 */
export function restState(state: GameState): GameState {
  if (state.screen !== 'rest') return state;
  const healAmount = Math.floor(state.playerMaxHp * getAscensionModifier(state.ascension).restHealRate);
  return { ...state, screen: 'map', playerHp: Math.min(state.playerHp + healAmount, state.playerMaxHp) };
}

/** 휴식 카드 강화 화면 진입 */
export function enterUpgradeState(state: GameState): GameState {
  return state.screen === 'rest' ? { ...state, screen: 'upgrade', upgradeSource: 'rest' } : state;
}

/** 카드 강화 상태 반영 */
export function upgradeCardState(state: GameState, deckIndex: number): GameState {
  if (state.screen !== 'upgrade') return state;
  const cardId = state.deck[deckIndex];
  if (!cardId) return state;
  const upgradedId = getUpgradedId(cardId);
  if (upgradedId === cardId) return state;
  const deck = [...state.deck];
  deck[deckIndex] = upgradedId;
  if (state.upgradeSource !== 'event') return { ...state, screen: 'map', deck, upgradeSource: null };
  const remaining = state.pendingUpgradeCount - 1;
  return remaining > 0 && deck.some((id) => canUpgrade(id))
    ? { ...state, deck, pendingUpgradeCount: remaining }
    : { ...state, screen: 'map', deck, pendingUpgradeCount: 0, upgradeSource: null };
}

/** 카드 강화 화면 종료 */
export function skipUpgradeState(state: GameState): GameState {
  return state.screen === 'upgrade'
    ? { ...state, screen: state.upgradeSource === 'event' ? 'map' : 'rest', pendingUpgradeCount: 0, upgradeSource: null }
    : state;
}

/** 휴식 화면 종료 */
export function skipRestState(state: GameState): GameState {
  return state.screen === 'rest' ? { ...state, screen: 'map' } : state;
}

/** 카드 제거 화면 진입 */
export function enterRemoveState(state: GameState): GameState {
  if ((state.screen !== 'rest' && state.screen !== 'shop') || state.deck.length <= MIN_DECK_SIZE) return state;
  return state.screen === 'shop' && state.gold < REMOVE_PRICE
    ? state
    : { ...state, screen: 'remove_card', removeSource: state.screen };
}

/** 카드 제거 상태 반영 */
export function removeCardState(state: GameState, deckIndex: number): GameState {
  if (state.screen !== 'remove_card' || !state.removeSource || state.deck.length <= MIN_DECK_SIZE || !state.deck[deckIndex]) return state;
  const fromShop = state.removeSource === 'shop';
  if (fromShop && state.gold < REMOVE_PRICE) return state;
  const deck = state.deck.filter((_, index) => index !== deckIndex);
  if (state.removeSource === 'event') {
    const remaining = state.pendingRemoveCount - 1;
    return remaining > 0 && deck.length > MIN_DECK_SIZE
      ? { ...state, deck, pendingRemoveCount: remaining }
      : { ...state, screen: 'map', deck, pendingRemoveCount: 0, removeSource: null };
  }
  return {
    ...state,
    screen: fromShop ? 'shop' : 'map',
    deck,
    gold: fromShop ? state.gold - REMOVE_PRICE : state.gold,
    removeSource: null,
  };
}

/** 카드 제거 화면 종료 */
export function skipRemoveState(state: GameState): GameState {
  if (state.screen !== 'remove_card') return state;
  const screen = state.removeSource === 'shop' ? 'shop' : state.removeSource === 'event' ? 'map' : 'rest';
  return { ...state, screen, pendingRemoveCount: 0, removeSource: null };
}

/** 상점 카드 구매 상태 반영 */
export function buyCardState(state: GameState, cardId: string): GameState {
  const price = getCardPrice(cardId);
  return state.screen === 'shop' && state.shopCards.includes(cardId) && state.gold >= price
    ? { ...state, gold: state.gold - price, deck: [...state.deck, cardId], shopCards: state.shopCards.filter((id) => id !== cardId) }
    : state;
}

/** 상점 화면 종료 */
export function leaveShopState(state: GameState): GameState {
  return state.screen === 'shop' ? { ...state, screen: 'map', shopCards: [] } : state;
}

/** 전투 승리 보상 화면 전환 */
export function enterCombatRewardState(
  state: GameState,
  playerHp: number,
  rewardCards: readonly string[],
  rewardGold: number,
  rewardRelic: RelicId | null,
): GameState {
  const currentNode = findCurrentNode(state.map);
  return {
    ...state,
    screen: 'combat_reward',
    playerHp,
    rewardCards,
    rewardGold,
    rewardRelic,
    kills: state.kills + (currentNode?.enemyIds.length ?? 0),
  };
}

/** 전투 패배 화면과 처치 수 반영 */
export function enterGameOverState(state: GameState, defeatedEnemyCount = 0): GameState {
  return {
    ...state,
    screen: 'game_over',
    rewardCards: [],
    rewardRelic: null,
    kills: state.kills + Math.max(0, defeatedEnemyCount),
    runRecorded: true,
  };
}

/** 전투 보상 완료 상태 전환 */
export function completeCombatRewardState(
  state: GameState,
  nextMap: GameMap | null,
  newlyUnlocked: number | null,
): GameState {
  const currentNode = findCurrentNode(state.map);
  const awardedRelic = state.rewardRelic && !state.relics.includes(state.rewardRelic)
    ? state.rewardRelic
    : null;
  const maxHpGain = awardedRelic === 'iron_heart' ? 8 : 0;
  const base = {
    ...state,
    gold: state.gold + state.rewardGold,
    playerMaxHp: state.playerMaxHp + maxHpGain,
    playerHp: Math.min(state.playerMaxHp + maxHpGain, state.playerHp + maxHpGain),
    relics: awardedRelic ? [...state.relics, awardedRelic] : state.relics,
    rewardGold: 0,
    rewardRelic: null,
    combatState: null,
    rewardCards: [],
  };
  if (!state.map) return base;
  if (currentNode?.type === 'boss' && nextMap) return { ...base, screen: 'map', map: nextMap };
  return currentNode?.type === 'boss'
    ? { ...base, screen: 'victory', runRecorded: true, unlockedAscension: newlyUnlocked }
    : { ...base, screen: 'map' };
}
