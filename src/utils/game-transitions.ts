// 맵과 이벤트 게임 상태 전환

import { getAvailableNodeIds } from '@tower-of-cardborn/game-core/game/map-generator';
import type { EventId } from '@tower-of-cardborn/game-core/types/event';
import type { EventOutcome } from '@tower-of-cardborn/game-core/game/event-engine';
import type { GameState } from '@tower-of-cardborn/game-core/types/game';
import type { GameMap } from '@tower-of-cardborn/game-core/types/map';
import { findCurrentNode } from './game-state';
import { canUpgrade, getCardPrice, getUpgradedId } from '@tower-of-cardborn/game-core/data/cards';
import { getAscensionModifier } from '@tower-of-cardborn/game-core/data/ascension';
import { SHOP_BALANCE } from '@tower-of-cardborn/game-core/data/balance';
import type { RelicId } from '@tower-of-cardborn/game-core/types/relic';
import {
  applyShopDiscount, getRelicMaxHpBonus, getRelicRestHealBonus,
} from '@tower-of-cardborn/game-core/data/relics';
import { MAX_POTION_SLOTS } from '@tower-of-cardborn/game-core/data/potions';
import type { PotionId } from '@tower-of-cardborn/game-core/types/potion';

export const REMOVE_PRICE = SHOP_BALANCE.removePrice;
export const UPGRADE_PRICE = SHOP_BALANCE.upgradePrice;
export const MIN_DECK_SIZE = 1;

/** 상점 가격 보정 */
function getAdjustedShopPrice(basePrice: number, relics: readonly RelicId[], ascension: number): number {
  return Math.floor(applyShopDiscount(basePrice, relics) * getAscensionModifier(ascension).shopPriceMul);
}

/** 유물 할인·승천 배율 반영 상점 카드 가격 산정 */
export function getShopCardPrice(cardId: string, relics: readonly RelicId[], ascension = 0): number {
  return getAdjustedShopPrice(getCardPrice(cardId), relics, ascension);
}

/** 유물 할인·승천 배율 반영 상점 유물 가격 산정 */
export function getShopRelicPrice(relics: readonly RelicId[], ascension = 0): number {
  return getAdjustedShopPrice(SHOP_BALANCE.relicPrice, relics, ascension);
}

/** 유물 할인·승천 배율 반영 상점 포션 가격 산정 */
export function getShopPotionPrice(relics: readonly RelicId[], ascension = 0): number {
  return getAdjustedShopPrice(SHOP_BALANCE.potionPrice, relics, ascension);
}

/** 유물 할인·승천 배율 반영 카드 제거 가격 산정 */
export function getShopRemovePrice(relics: readonly RelicId[], ascension = 0): number {
  return getAdjustedShopPrice(REMOVE_PRICE, relics, ascension);
}

/** 유물 할인·승천 배율 반영 카드 강화 가격 산정 */
export function getShopUpgradePrice(relics: readonly RelicId[], ascension = 0): number {
  return getAdjustedShopPrice(UPGRADE_PRICE, relics, ascension);
}

/** 보물 상자 보상 묶음 */
export interface TreasureRewards {
  readonly gold: number;
  readonly relic: RelicId | null;
  readonly potion: PotionId | null;
}

/** 맵 노드 선택 상태 전환 */
export function enterMapNode(
  state: GameState,
  nodeId: string,
  eventId: EventId | null,
  shopCards: readonly string[],
  shopRelics: readonly RelicId[] = [],
  shopPotions: readonly PotionId[] = [],
  treasure: TreasureRewards | null = null,
): GameState {
  if (state.screen !== 'map' || !state.map || !getAvailableNodeIds(state.map).includes(nodeId)) return state;
  const node = state.map.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) return state;
  if ((node.type === 'combat' || node.type === 'elite' || node.type === 'boss') && node.enemyIds.length === 0) return state;
  if (node.type === 'event' && !eventId) return state;
  if (node.type === 'treasure' && !treasure) return state;
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
      return { ...state, screen: 'combat', map: updatedMap, rewardCards: [], rewardRelic: null, rewardPotion: null };
    case 'rest':
      return { ...state, screen: 'rest', map: updatedMap, rewardCards: [] };
    case 'shop':
      return { ...state, screen: 'shop', map: updatedMap, rewardCards: [], shopCards, shopRelics, shopPotions };
    case 'treasure':
      // 전투 없이 보상 화면으로 직행
      return {
        ...state,
        screen: 'combat_reward',
        map: updatedMap,
        rewardCards: [],
        rewardGold: treasure?.gold ?? 0,
        rewardRelic: treasure?.relic ?? null,
        rewardPotion: treasure?.potion ?? null,
      };
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

/** 이벤트 결과 상태 반영 (유물 획득 시 최대 HP 보너스 포함) */
export function applyEventOutcome(state: GameState, eventId: EventId, outcome: EventOutcome): GameState {
  if (state.screen !== 'event' || state.eventResult || state.eventId !== eventId) return state;
  const gainedRelic = outcome.gainedRelicId && !state.relics.includes(outcome.gainedRelicId)
    ? outcome.gainedRelicId
    : null;
  const relicMaxHpGain = gainedRelic ? getRelicMaxHpBonus(gainedRelic) : 0;
  const base = {
    ...state,
    playerHp: Math.min(outcome.maxHp + relicMaxHpGain, outcome.hp + relicMaxHpGain),
    playerMaxHp: outcome.maxHp + relicMaxHpGain,
    gold: outcome.gold,
    deck: outcome.gainedCardId ? [...state.deck, outcome.gainedCardId] : state.deck,
    relics: gainedRelic ? [...state.relics, gainedRelic] : state.relics,
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

/** 휴식 회복 상태 반영 (유물 회복률 가산 포함) */
export function restState(state: GameState): GameState {
  if (state.screen !== 'rest' || state.playerHp >= state.playerMaxHp) return state;
  const healRate = getAscensionModifier(state.ascension).restHealRate + getRelicRestHealBonus(state.relics);
  const healAmount = Math.floor(state.playerMaxHp * healRate);
  return { ...state, screen: 'map', playerHp: Math.min(state.playerHp + healAmount, state.playerMaxHp) };
}

/** 휴식 카드 강화 화면 진입 */
export function enterUpgradeState(state: GameState): GameState {
  return state.screen === 'rest' && state.deck.some((id) => canUpgrade(id))
    ? { ...state, screen: 'upgrade', upgradeSource: 'rest' }
    : state;
}

/** 상점 카드 강화 화면 진입 (골드는 강화 확정 시 차감) */
export function enterShopUpgradeState(state: GameState): GameState {
  if (state.screen !== 'shop'
    || state.gold < getShopUpgradePrice(state.relics, state.ascension)
    || !state.deck.some((id) => canUpgrade(id))) return state;
  return { ...state, screen: 'upgrade', upgradeSource: 'shop' };
}

/** 카드 강화 상태 반영 (상점 출처는 골드 차감) */
export function upgradeCardState(state: GameState, deckIndex: number): GameState {
  if (state.screen !== 'upgrade') return state;
  const cardId = state.deck[deckIndex];
  if (!cardId) return state;
  const upgradedId = getUpgradedId(cardId);
  if (upgradedId === cardId) return state;
  const fromShop = state.upgradeSource === 'shop';
  const shopPrice = getShopUpgradePrice(state.relics, state.ascension);
  if (fromShop && state.gold < shopPrice) return state;
  const deck = [...state.deck];
  deck[deckIndex] = upgradedId;
  if (fromShop) {
    return { ...state, screen: 'shop', deck, gold: state.gold - shopPrice, upgradeSource: null };
  }
  if (state.upgradeSource !== 'event') return { ...state, screen: 'map', deck, upgradeSource: null };
  const remaining = state.pendingUpgradeCount - 1;
  return remaining > 0 && deck.some((id) => canUpgrade(id))
    ? { ...state, deck, pendingUpgradeCount: remaining }
    : { ...state, screen: 'map', deck, pendingUpgradeCount: 0, upgradeSource: null };
}

/** 카드 강화 화면 종료 */
export function skipUpgradeState(state: GameState): GameState {
  if (state.screen !== 'upgrade') return state;
  const screen = state.upgradeSource === 'event' ? 'map' : state.upgradeSource === 'shop' ? 'shop' : 'rest';
  return { ...state, screen, pendingUpgradeCount: 0, upgradeSource: null };
}

/** 휴식 화면 종료 */
export function skipRestState(state: GameState): GameState {
  return state.screen === 'rest' ? { ...state, screen: 'map' } : state;
}

/** 카드 제거 화면 진입 */
export function enterRemoveState(state: GameState): GameState {
  if ((state.screen !== 'rest' && state.screen !== 'shop') || state.deck.length <= MIN_DECK_SIZE) return state;
  return state.screen === 'shop' && state.gold < getShopRemovePrice(state.relics, state.ascension)
    ? state
    : { ...state, screen: 'remove_card', removeSource: state.screen };
}

/** 카드 제거 상태 반영 */
export function removeCardState(state: GameState, deckIndex: number): GameState {
  if (state.screen !== 'remove_card' || !state.removeSource || state.deck.length <= MIN_DECK_SIZE || !state.deck[deckIndex]) return state;
  const fromShop = state.removeSource === 'shop';
  const shopPrice = getShopRemovePrice(state.relics, state.ascension);
  if (fromShop && state.gold < shopPrice) return state;
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
    gold: fromShop ? state.gold - shopPrice : state.gold,
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
  const price = getShopCardPrice(cardId, state.relics, state.ascension);
  return state.screen === 'shop' && state.shopCards.includes(cardId) && state.gold >= price
    ? { ...state, gold: state.gold - price, deck: [...state.deck, cardId], shopCards: state.shopCards.filter((id) => id !== cardId) }
    : state;
}

/** 상점 유물 구매 상태 반영 (획득 즉시 최대 HP 보너스 적용) */
export function buyRelicState(state: GameState, relicId: RelicId): GameState {
  const price = getShopRelicPrice(state.relics, state.ascension);
  if (state.screen !== 'shop'
    || !(state.shopRelics ?? []).includes(relicId)
    || state.relics.includes(relicId)
    || state.gold < price) return state;
  const maxHpGain = getRelicMaxHpBonus(relicId);
  return {
    ...state,
    gold: state.gold - price,
    relics: [...state.relics, relicId],
    playerMaxHp: state.playerMaxHp + maxHpGain,
    playerHp: Math.min(state.playerMaxHp + maxHpGain, state.playerHp + maxHpGain),
    shopRelics: (state.shopRelics ?? []).filter((id) => id !== relicId),
  };
}

/** 상점 포션 구매 상태 반영 */
export function buyPotionState(state: GameState, potionId: PotionId): GameState {
  const price = getShopPotionPrice(state.relics, state.ascension);
  if (state.screen !== 'shop'
    || !(state.shopPotions ?? []).includes(potionId)
    || state.potions.length >= MAX_POTION_SLOTS
    || state.gold < price) return state;
  const remaining = [...(state.shopPotions ?? [])];
  remaining.splice(remaining.indexOf(potionId), 1);
  return {
    ...state,
    gold: state.gold - price,
    potions: [...state.potions, potionId],
    shopPotions: remaining,
  };
}

/** 상점 화면 종료 */
export function leaveShopState(state: GameState): GameState {
  return state.screen === 'shop' ? { ...state, screen: 'map', shopCards: [], shopRelics: [], shopPotions: [] } : state;
}

/** 전투 승리 보상 화면 전환 */
export function enterCombatRewardState(
  state: GameState,
  playerHp: number,
  rewardCards: readonly string[],
  rewardGold: number,
  rewardRelic: RelicId | null,
  rewardPotion: PotionId | null,
): GameState {
  const currentNode = findCurrentNode(state.map);
  return {
    ...state,
    screen: 'combat_reward',
    playerHp,
    rewardCards,
    rewardGold,
    rewardRelic,
    rewardPotion,
    kills: state.kills + (currentNode?.enemyIds.length ?? 0),
  };
}

/** 전투 패배 화면과 종료 기록 반영 */
export function enterGameOverState(
  state: GameState,
  defeatedEnemyCount = 0,
  recordedRunAt = state.recordedRunAt ?? null,
): GameState {
  return {
    ...state,
    screen: 'game_over',
    rewardCards: [],
    rewardRelic: null,
    rewardPotion: null,
    kills: state.kills + Math.max(0, defeatedEnemyCount),
    runRecorded: true,
    recordedRunAt,
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
  const maxHpGain = awardedRelic ? getRelicMaxHpBonus(awardedRelic) : 0;
  const awardedPotion = state.rewardPotion && state.potions.length < MAX_POTION_SLOTS
    ? state.rewardPotion
    : null;
  const base = {
    ...state,
    gold: state.gold + state.rewardGold,
    playerMaxHp: state.playerMaxHp + maxHpGain,
    playerHp: Math.min(state.playerMaxHp + maxHpGain, state.playerHp + maxHpGain),
    relics: awardedRelic ? [...state.relics, awardedRelic] : state.relics,
    potions: awardedPotion ? [...state.potions, awardedPotion] : state.potions,
    rewardGold: 0,
    rewardRelic: null,
    rewardPotion: null,
    combatState: null,
    rewardCards: [],
  };
  if (!state.map) return base;
  if (currentNode?.type === 'boss' && nextMap) {
    return { ...base, screen: 'map', map: nextMap, playerHp: base.playerMaxHp };
  }
  return currentNode?.type === 'boss'
    ? { ...base, screen: 'victory', runRecorded: true, unlockedAscension: newlyUnlocked }
    : { ...base, screen: 'map' };
}
