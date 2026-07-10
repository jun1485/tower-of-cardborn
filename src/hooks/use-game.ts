// 게임 전체 상태 관리 hook (맵/이벤트/상점/승천 통합)

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CharacterClass, GameScreen, GameState } from '@tower-of-cardborn/game-core/types/game';
import type { CombatState } from '@tower-of-cardborn/game-core/types/combat';
import type { GameMap, NodeType } from '@tower-of-cardborn/game-core/types/map';
import { STARTER_DECK, getStarterDeck, getRewardCards, getUpgradedId, getCardPrice, canUpgrade } from '@tower-of-cardborn/game-core/data/cards';
import { getAscensionModifier } from '@tower-of-cardborn/game-core/data/ascension';
import { getEventById } from '@tower-of-cardborn/game-core/data/events';
import { isChoiceAvailable, resolveEventChoice, pickRandomEvent } from '@tower-of-cardborn/game-core/game/event-engine';
import { loadGame, saveGame, clearSave } from '../utils/storage';
import { recordRunStart, recordRunEnd } from '../utils/meta';
import { playSfx } from '../utils/sound';
import { generateMap, getAvailableNodeIds, getFloorsClimbed } from '@tower-of-cardborn/game-core/game/map-generator';
import { initCombat } from '@tower-of-cardborn/game-core/game/combat-engine';
import { useCombat } from './use-combat';

const SHOP_CARD_COUNT = 5;

/** 상점 카드 제거 서비스 비용 */
export const REMOVE_PRICE = 60;

const DEFAULT_STATE: GameState = {
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
};

/** 노드 타입별 승리 보상 골드 산정 */
function rollGoldReward(nodeType: NodeType | undefined): number {
  switch (nodeType) {
    case 'elite': return 30 + Math.floor(Math.random() * 11);
    case 'boss': return 60 + Math.floor(Math.random() * 16);
    default: return 12 + Math.floor(Math.random() * 7);
  }
}

/** 현재 노드 조회 */
function findCurrentNode(map: GameMap | null) {
  if (!map?.currentNodeId) return undefined;
  return map.nodes.find((node) => node.id === map.currentNodeId);
}

function loadValidState(): GameState {
  const saved = loadGame();
  if (!saved) return DEFAULT_STATE;

  // map 필수 화면에서 map 누락 → 초기화
  const needsMap = ['map', 'combat', 'rest', 'upgrade', 'remove_card', 'shop', 'event', 'combat_reward'];
  if (needsMap.includes(saved.screen) && !saved.map) {
    clearSave();
    return DEFAULT_STATE;
  }

  const savedRewardCards = Array.isArray(saved.rewardCards) ? saved.rewardCards : [];
  const migratedCombatState = saved.combatState && !Array.isArray(saved.combatState.exhaustPile)
    ? { ...saved.combatState, exhaustPile: [] }
    : saved.combatState;

  const baseState: GameState = {
    ...saved,
    combatState: migratedCombatState,
    rewardCards: savedRewardCards,
  };

  // 전투 저장 복원 정규화: 결과 전환/누락 전투 재생성
  if (baseState.screen === 'combat') {
    if (baseState.combatState?.result === 'victory') {
      const currentNode = findCurrentNode(baseState.map);
      return {
        ...baseState,
        screen: 'combat_reward',
        playerHp: baseState.combatState.player.hp,
        rewardCards: baseState.rewardCards.length > 0
          ? baseState.rewardCards
          : getRewardCards(3, baseState.characterClass),
        rewardGold: baseState.rewardGold > 0 ? baseState.rewardGold : rollGoldReward(currentNode?.type),
        kills: baseState.kills + (currentNode?.enemyIds.length ?? 0),
        combatState: null,
      };
    }

    if (baseState.combatState?.result === 'defeat') {
      return {
        ...baseState,
        screen: 'game_over',
        rewardCards: [],
        combatState: null,
      };
    }

    if (!baseState.combatState) {
      const currentNode = findCurrentNode(baseState.map);
      if (!currentNode || currentNode.enemyIds.length === 0) {
        clearSave();
        return DEFAULT_STATE;
      }

      return {
        ...baseState,
        combatState: initCombat(baseState.deck, currentNode.enemyIds, baseState.playerHp, baseState.playerMaxHp, baseState.ascension),
      };
    }
  }

  // combat_reward 저장 복원 정규화: 보상 후보 보전/전투 상태 제거
  if (baseState.screen === 'combat_reward') {
    return {
      ...baseState,
      rewardCards: baseState.rewardCards.length > 0
        ? baseState.rewardCards
        : getRewardCards(3, baseState.characterClass),
      combatState: null,
    };
  }

  // 이벤트 저장 복원 정규화: 이벤트 ID 누락 시 맵 복귀
  if (baseState.screen === 'event' && !baseState.eventId) {
    return { ...baseState, screen: 'map' };
  }

  return baseState;
}

export function useGame() {
  const [gameState, setGameState] = useState<GameState>(loadValidState);
  const stateRef = useRef(gameState);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  // 전투 종료 결과 처리 (승리 보상 골드/처치 수 반영, 패배 시 메타 기록)
  const handleCombatResult = useCallback((finished: CombatState) => {
    if (finished.result === 'victory') {
      playSfx('victory');
      setGameState((prev) => {
        const currentNode = findCurrentNode(prev.map);
        return {
          ...prev,
          screen: 'combat_reward',
          playerHp: finished.player.hp,
          rewardCards: prev.rewardCards.length > 0
            ? prev.rewardCards
            : getRewardCards(3, prev.characterClass),
          rewardGold: prev.rewardGold > 0 ? prev.rewardGold : rollGoldReward(currentNode?.type),
          kills: prev.kills + (currentNode?.enemyIds.length ?? 0),
        };
      });
    } else if (finished.result === 'defeat') {
      playSfx('defeat');
      const current = stateRef.current;
      if (!current.runRecorded) {
        recordRunEnd({
          won: false,
          floor: getFloorsClimbed(current.map),
          kills: current.kills,
          ascension: current.ascension,
        });
      }
      setGameState((prev) => ({ ...prev, screen: 'game_over', rewardCards: [], runRecorded: true }));
    }
  }, []);

  const { combat, startCombat, handlePlayCard, handleEndTurn, clearCombat } = useCombat(gameState.combatState, handleCombatResult);

  // #region 자동 저장
  useEffect(() => {
    saveGame({ ...gameState, combatState: combat });
  }, [gameState, combat]);
  // #endregion

  // #region 새 게임 시작 (직업/승천 선택)
  const startNewGame = useCallback((characterClass: CharacterClass, ascension = 0) => {
    // 미기록 이전 런 종료 반영 (복원된 결과 화면 경유 포함)
    const current = stateRef.current;
    if (current.map && !current.runRecorded) {
      recordRunEnd({
        won: current.screen === 'victory',
        floor: getFloorsClimbed(current.map),
        kills: current.kills,
        ascension: current.ascension,
      });
    }
    clearSave();
    clearCombat();
    recordRunStart(ascension);
    const modifier = getAscensionModifier(ascension);
    setGameState({
      ...DEFAULT_STATE,
      screen: 'map',
      deck: [...getStarterDeck(characterClass)],
      playerHp: modifier.startHp,
      map: generateMap(),
      characterClass,
      gold: modifier.startGold,
      ascension,
    });
  }, [clearCombat]);
  // #endregion

  // #region 맵 노드 선택
  const selectMapNode = useCallback((nodeId: string) => {
    const current = stateRef.current;
    if (!current.map) return;
    if (!getAvailableNodeIds(current.map).includes(nodeId)) return;
    const node = current.map.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    playSfx('map_select');
    // 랜덤 의존 값은 updater 밖에서 확정
    const pickedEvent = node.type === 'event' ? pickRandomEvent(current.seenEventIds) : null;
    const pickedShopCards = node.type === 'shop' ? getRewardCards(SHOP_CARD_COUNT, current.characterClass) : null;

    setGameState((prev) => {
      if (!prev.map) return prev;
      const visitedNodeIds = prev.map.visitedNodeIds.includes(nodeId)
        ? prev.map.visitedNodeIds
        : [...prev.map.visitedNodeIds, nodeId];

      const updatedMap: GameMap = {
        ...prev.map,
        currentNodeId: nodeId,
        visitedNodeIds,
      };

      switch (node.type) {
        case 'combat':
        case 'elite':
        case 'boss':
          return { ...prev, screen: 'combat' as GameScreen, map: updatedMap, rewardCards: [] };
        case 'rest':
          return { ...prev, screen: 'rest' as GameScreen, map: updatedMap, rewardCards: [] };
        case 'shop':
          return {
            ...prev,
            screen: 'shop' as GameScreen,
            map: updatedMap,
            rewardCards: [],
            shopCards: pickedShopCards ?? [],
          };
        case 'event':
          return {
            ...prev,
            screen: 'event' as GameScreen,
            map: updatedMap,
            rewardCards: [],
            eventId: pickedEvent?.id ?? null,
            eventResult: null,
            seenEventIds: pickedEvent ? [...prev.seenEventIds, pickedEvent.id] : prev.seenEventIds,
          };
      }
    });
  }, []);

  // combat 화면 진입 시 전투 시작
  useEffect(() => {
    if (gameState.screen !== 'combat' || combat) return;
    if (!gameState.map?.currentNodeId) return;

    const node = gameState.map.nodes.find((n) => n.id === gameState.map!.currentNodeId);
    if (!node || node.enemyIds.length === 0) return;

    startCombat(gameState.deck, node.enemyIds, gameState.playerHp, gameState.playerMaxHp, gameState.ascension);
  }, [gameState.screen, combat, gameState.map, gameState.deck, gameState.playerHp, gameState.playerMaxHp, gameState.ascension, startCombat]);
  // #endregion

  // #region 이벤트 진행
  const chooseEventOption = useCallback((choiceIndex: number) => {
    const current = stateRef.current;
    if (current.screen !== 'event' || current.eventResult || !current.eventId) return;
    const event = getEventById(current.eventId);
    const choice = event?.choices[choiceIndex];
    if (!event || !choice) return;

    playSfx('button_click');

    // 떠나기 선택지: 즉시 맵 복귀
    if (choice.effects.length === 0) {
      setGameState((prev) => ({ ...prev, screen: 'map', eventId: null, eventResult: null }));
      return;
    }

    const available = isChoiceAvailable(choice, {
      hp: current.playerHp,
      gold: current.gold,
      deckSize: current.deck.length,
      upgradableCount: current.deck.filter((id) => canUpgrade(id)).length,
    });
    if (!available) return;

    // 랜덤 의존 결과는 updater 밖에서 확정
    const outcome = resolveEventChoice(event, choice, {
      hp: current.playerHp,
      maxHp: current.playerMaxHp,
      gold: current.gold,
      characterClass: current.characterClass,
    });

    setGameState((prev) => {
      const base = {
        ...prev,
        playerHp: outcome.hp,
        playerMaxHp: outcome.maxHp,
        gold: outcome.gold,
        deck: outcome.gainedCardId ? [...prev.deck, outcome.gainedCardId] : prev.deck,
      };
      // 카드 제거/강화 후속 화면 전환
      if (outcome.followUp?.type === 'remove') {
        return { ...base, screen: 'remove_card', removeSource: 'event', pendingRemoveCount: outcome.followUp.count, eventId: null, eventResult: null };
      }
      if (outcome.followUp?.type === 'upgrade') {
        return { ...base, screen: 'upgrade', upgradeSource: 'event', pendingUpgradeCount: outcome.followUp.count, eventId: null, eventResult: null };
      }
      if (outcome.result) {
        return { ...base, eventResult: outcome.result };
      }
      return { ...base, screen: 'map', eventId: null, eventResult: null };
    });
  }, []);

  const finishEvent = useCallback(() => {
    setGameState((prev) => {
      if (prev.screen !== 'event' || !prev.eventResult) return prev;
      return { ...prev, screen: 'map', eventId: null, eventResult: null };
    });
  }, []);
  // #endregion

  // #region 보상 선택/건너뛰기 후 맵 복귀, 10층 보스 클리어 시 다음 맵 생성 전환
  const afterCombatEnd = useCallback(() => {
    clearCombat();
    // 최종 보스 클리어 시 메타 기록 (다음 승천 레벨 해금)
    const current = stateRef.current;
    const endedNode = findCurrentNode(current.map);
    const isFinalClear = endedNode?.type === 'boss' && current.map != null && current.map.mapIndex >= current.map.totalMaps;
    let newlyUnlocked: number | null = null;
    if (isFinalClear && !current.runRecorded) {
      newlyUnlocked = recordRunEnd({
        won: true,
        floor: getFloorsClimbed(current.map),
        kills: current.kills,
        ascension: current.ascension,
      }).newlyUnlocked;
    }
    setGameState((prev) => {
      const currentNode = findCurrentNode(prev.map);
      const goldApplied = {
        ...prev,
        gold: prev.gold + prev.rewardGold,
        rewardGold: 0,
        combatState: null,
        rewardCards: [] as readonly string[],
      };
      if (!prev.map) return goldApplied;
      const isBossClear = currentNode?.type === 'boss';
      if (isBossClear && prev.map.mapIndex < prev.map.totalMaps) {
        return {
          ...goldApplied,
          screen: 'map',
          map: generateMap(prev.map.mapIndex + 1, prev.map.totalMaps),
        };
      }
      if (isBossClear) {
        return { ...goldApplied, screen: 'victory', runRecorded: true, unlockedAscension: newlyUnlocked };
      }
      return { ...goldApplied, screen: 'map' };
    });
  }, [clearCombat]);

  const pickRewardCard = useCallback((cardId: string) => {
    if (gameState.screen !== 'combat_reward') return;
    if (!gameState.rewardCards.includes(cardId)) return;
    playSfx('reward_pick');
    setGameState((prev) => ({ ...prev, deck: [...prev.deck, cardId] }));
    afterCombatEnd();
  }, [afterCombatEnd, gameState.screen, gameState.rewardCards]);

  const skipReward = useCallback(() => {
    if (gameState.screen !== 'combat_reward') return;
    afterCombatEnd();
  }, [afterCombatEnd, gameState.screen]);
  // #endregion

  // #region 휴식 / 강화 / 카드 제거
  const rest = useCallback(() => {
    playSfx('heal');
    setGameState((prev) => {
      if (prev.screen !== 'rest') return prev;
      const healAmount = Math.floor(prev.playerMaxHp * getAscensionModifier(prev.ascension).restHealRate);
      const newHp = Math.min(prev.playerHp + healAmount, prev.playerMaxHp);
      return { ...prev, screen: 'map', playerHp: newHp };
    });
  }, []);

  const goToUpgrade = useCallback(() => {
    setGameState((prev) => (
      prev.screen === 'rest'
        ? { ...prev, screen: 'upgrade' as GameScreen, upgradeSource: 'rest' }
        : prev
    ));
  }, []);

  const upgradeCard = useCallback((deckIndex: number) => {
    playSfx('upgrade');
    setGameState((prev) => {
      if (prev.screen !== 'upgrade') return prev;
      const cardId = prev.deck[deckIndex];
      if (!cardId) return prev;
      const upgradedId = getUpgradedId(cardId);
      if (upgradedId === cardId) return prev;
      const newDeck = [...prev.deck];
      newDeck[deckIndex] = upgradedId;
      // 이벤트발 다중 강화: 잔여 횟수/강화 가능 카드 존재 시 화면 유지
      if (prev.upgradeSource === 'event') {
        const remaining = prev.pendingUpgradeCount - 1;
        const hasUpgradable = newDeck.some((id) => canUpgrade(id));
        if (remaining > 0 && hasUpgradable) {
          return { ...prev, deck: newDeck, pendingUpgradeCount: remaining };
        }
        return { ...prev, screen: 'map', deck: newDeck, pendingUpgradeCount: 0, upgradeSource: null };
      }
      return { ...prev, screen: 'map', deck: newDeck, upgradeSource: null };
    });
  }, []);

  const skipUpgrade = useCallback(() => {
    setGameState((prev) => {
      if (prev.screen !== 'upgrade') return prev;
      return {
        ...prev,
        screen: prev.upgradeSource === 'event' ? 'map' : 'rest',
        pendingUpgradeCount: 0,
        upgradeSource: null,
      };
    });
  }, []);

  const skipRest = useCallback(() => {
    setGameState((prev) => (prev.screen === 'rest' ? { ...prev, screen: 'map' } : prev));
  }, []);

  // 카드 제거 화면 진입 (휴식: 무료 / 상점: 골드 소모)
  const goToRemove = useCallback(() => {
    setGameState((prev) => {
      if (prev.screen !== 'rest' && prev.screen !== 'shop') return prev;
      if (prev.screen === 'shop' && prev.gold < REMOVE_PRICE) return prev;
      return { ...prev, screen: 'remove_card' as GameScreen, removeSource: prev.screen };
    });
  }, []);

  // 덱에서 카드 제거 후 출처 화면 복귀
  const removeCard = useCallback((deckIndex: number) => {
    playSfx('button_click');
    setGameState((prev) => {
      if (prev.screen !== 'remove_card' || !prev.removeSource) return prev;
      if (!prev.deck[deckIndex]) return prev;
      const fromShop = prev.removeSource === 'shop';
      if (fromShop && prev.gold < REMOVE_PRICE) return prev;
      const newDeck = prev.deck.filter((_, i) => i !== deckIndex);
      // 이벤트발 다중 제거: 잔여 횟수/덱 잔량 존재 시 화면 유지
      if (prev.removeSource === 'event') {
        const remaining = prev.pendingRemoveCount - 1;
        if (remaining > 0 && newDeck.length > 0) {
          return { ...prev, deck: newDeck, pendingRemoveCount: remaining };
        }
        return { ...prev, screen: 'map', deck: newDeck, pendingRemoveCount: 0, removeSource: null };
      }
      return {
        ...prev,
        screen: fromShop ? 'shop' : 'map',
        deck: newDeck,
        gold: fromShop ? prev.gold - REMOVE_PRICE : prev.gold,
        removeSource: null,
      };
    });
  }, []);

  const skipRemove = useCallback(() => {
    setGameState((prev) => {
      if (prev.screen !== 'remove_card') return prev;
      const returnScreen: GameScreen = prev.removeSource === 'shop'
        ? 'shop'
        : prev.removeSource === 'event' ? 'map' : 'rest';
      return { ...prev, screen: returnScreen, pendingRemoveCount: 0, removeSource: null };
    });
  }, []);
  // #endregion

  // #region 상점
  const buyCard = useCallback((cardId: string) => {
    const current = stateRef.current;
    if (current.screen !== 'shop' || !current.shopCards.includes(cardId)) return;
    const price = getCardPrice(cardId);
    if (current.gold < price) return;
    playSfx('reward_pick');
    setGameState((prev) => ({
      ...prev,
      gold: prev.gold - price,
      deck: [...prev.deck, cardId],
      shopCards: prev.shopCards.filter((id) => id !== cardId),
    }));
  }, []);

  const leaveShop = useCallback(() => {
    setGameState((prev) => (prev.screen === 'shop' ? { ...prev, screen: 'map', shopCards: [] } : prev));
  }, []);
  // #endregion

  const goToTitle = useCallback(() => {
    // 미기록 런 포기 기록
    const current = stateRef.current;
    if (current.map && !current.runRecorded) {
      recordRunEnd({
        won: current.screen === 'victory',
        floor: getFloorsClimbed(current.map),
        kills: current.kills,
        ascension: current.ascension,
      });
    }
    clearCombat();
    clearSave();
    setGameState(DEFAULT_STATE);
  }, [clearCombat]);

  return {
    screen: gameState.screen,
    combat,
    deck: gameState.deck,
    playerHp: gameState.playerHp,
    playerMaxHp: gameState.playerMaxHp,
    map: gameState.map,
    characterClass: gameState.characterClass,
    rewardCards: gameState.rewardCards,
    gold: gameState.gold,
    rewardGold: gameState.rewardGold,
    shopCards: gameState.shopCards,
    removeSource: gameState.removeSource,
    upgradeSource: gameState.upgradeSource,
    kills: gameState.kills,
    ascension: gameState.ascension,
    eventId: gameState.eventId,
    eventResult: gameState.eventResult,
    unlockedAscension: gameState.unlockedAscension,
    restHealAmount: Math.floor(gameState.playerMaxHp * getAscensionModifier(gameState.ascension).restHealRate),
    startNewGame,
    selectMapNode,
    handlePlayCard,
    handleEndTurn,
    pickRewardCard,
    skipReward,
    rest,
    goToUpgrade,
    upgradeCard,
    skipUpgrade,
    skipRest,
    goToRemove,
    removeCard,
    skipRemove,
    chooseEventOption,
    finishEvent,
    buyCard,
    leaveShop,
    goToTitle,
  };
}
