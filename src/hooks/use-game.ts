// 게임 전체 상태 관리 hook (맵 시스템 통합)

import { useCallback, useEffect, useState } from 'react';
import type { CharacterClass, GameScreen, GameState } from '../types/game';
import type { GameMap } from '../types/map';
import { STARTER_DECK, getStarterDeck, getRewardCards, getUpgradedId } from '../data/cards';
import { loadGame, saveGame, clearSave } from '../utils/storage';
import { generateMap, getAvailableNodeIds } from '../game/map-generator';
import { initCombat } from '../game/combat-engine';
import { useCombat } from './use-combat';

const PLAYER_MAX_HP = 80;

const DEFAULT_STATE: GameState = {
  screen: 'title',
  combatState: null,
  deck: STARTER_DECK,
  playerHp: PLAYER_MAX_HP,
  playerMaxHp: PLAYER_MAX_HP,
  map: null,
  characterClass: 'warrior',
  rewardCards: [],
};

function loadValidState(): GameState {
  const saved = loadGame();
  if (!saved) return DEFAULT_STATE;

  // map 필수 화면에서 map 누락 → 초기화
  const needsMap = ['map', 'combat', 'rest', 'upgrade', 'combat_reward'];
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
      return {
        ...baseState,
        screen: 'combat_reward',
        playerHp: baseState.combatState.player.hp,
        rewardCards: baseState.rewardCards.length > 0
          ? baseState.rewardCards
          : getRewardCards(3, baseState.characterClass),
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
      const currentNodeId = baseState.map?.currentNodeId;
      const currentNode = currentNodeId
        ? baseState.map?.nodes.find((node) => node.id === currentNodeId)
        : null;
      if (!currentNode || currentNode.enemyIds.length === 0) {
        clearSave();
        return DEFAULT_STATE;
      }

      return {
        ...baseState,
        combatState: initCombat(baseState.deck, currentNode.enemyIds, baseState.playerHp, baseState.playerMaxHp),
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

  return baseState;
}

export function useGame() {
  const [gameState, setGameState] = useState<GameState>(loadValidState);

  const { combat, startCombat, handlePlayCard, handleEndTurn, clearCombat } = useCombat(gameState.combatState);

  // #region 자동 저장
  useEffect(() => {
    saveGame({ ...gameState, combatState: combat });
  }, [gameState, combat]);
  // #endregion

  // #region 전투 결과 감지 → 화면 전환
  useEffect(() => {
    if (!combat) return;
    if (combat.result === 'victory') {
      clearCombat();
      setGameState((prev) => ({
        ...prev,
        screen: 'combat_reward',
        playerHp: combat.player.hp,
        rewardCards: prev.rewardCards.length > 0
          ? prev.rewardCards
          : getRewardCards(3, prev.characterClass),
      }));
    } else if (combat.result === 'defeat') {
      clearCombat();
      setGameState((prev) => ({ ...prev, screen: 'game_over', rewardCards: [] }));
    }
  }, [combat, clearCombat]);
  // #endregion

  // #region 새 게임 시작 (직업 선택)
  const startNewGame = useCallback((characterClass: CharacterClass) => {
    clearSave();
    clearCombat();
    const map = generateMap();
    setGameState({
      screen: 'map',
      combatState: null,
      deck: [...getStarterDeck(characterClass)],
      playerHp: PLAYER_MAX_HP,
      playerMaxHp: PLAYER_MAX_HP,
      map,
      characterClass,
      rewardCards: [],
    });
  }, [clearCombat]);
  // #endregion

  // #region 맵 노드 선택
  const selectMapNode = useCallback((nodeId: string) => {
    setGameState((prev) => {
      if (!prev.map) return prev;
      const availableIds = getAvailableNodeIds(prev.map);
      if (!availableIds.includes(nodeId)) return prev;
      const node = prev.map.nodes.find((n) => n.id === nodeId);
      if (!node) return prev;
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
      }
    });
  }, []);

  // combat 화면 진입 시 전투 시작
  useEffect(() => {
    if (gameState.screen !== 'combat' || combat) return;
    if (!gameState.map?.currentNodeId) return;

    const node = gameState.map.nodes.find((n) => n.id === gameState.map!.currentNodeId);
    if (!node || node.enemyIds.length === 0) return;

    startCombat(gameState.deck, node.enemyIds, gameState.playerHp, gameState.playerMaxHp);
  }, [gameState.screen, combat, gameState.map, gameState.deck, gameState.playerHp, gameState.playerMaxHp, startCombat]);
  // #endregion

  // #region 보상 선택 / 건너뛰기 → 맵 복귀 (보스 승리 시 게임 클리어)
  const afterCombatEnd = useCallback(() => {
    clearCombat();
    setGameState((prev) => {
      if (!prev.map) return prev;
      const currentNode = prev.map.nodes.find((n) => n.id === prev.map!.currentNodeId);
      if (currentNode?.type === 'boss') {
        return { ...prev, screen: 'victory', rewardCards: [] };
      }
      return { ...prev, screen: 'map', combatState: null, rewardCards: [] };
    });
  }, [clearCombat]);

  const pickRewardCard = useCallback((cardId: string) => {
    if (gameState.screen !== 'combat_reward') return;
    if (!gameState.rewardCards.includes(cardId)) return;
    setGameState((prev) => ({ ...prev, deck: [...prev.deck, cardId] }));
    afterCombatEnd();
  }, [afterCombatEnd, gameState.screen, gameState.rewardCards]);

  const skipReward = useCallback(() => {
    if (gameState.screen !== 'combat_reward') return;
    afterCombatEnd();
  }, [afterCombatEnd, gameState.screen]);
  // #endregion

  // #region 휴식 / 강화
  const rest = useCallback(() => {
    setGameState((prev) => {
      if (prev.screen !== 'rest') return prev;
      const healAmount = Math.floor(prev.playerMaxHp * 0.3);
      const newHp = Math.min(prev.playerHp + healAmount, prev.playerMaxHp);
      return { ...prev, screen: 'map', playerHp: newHp };
    });
  }, []);

  const goToUpgrade = useCallback(() => {
    setGameState((prev) => (prev.screen === 'rest' ? { ...prev, screen: 'upgrade' as GameScreen } : prev));
  }, []);

  const upgradeCard = useCallback((deckIndex: number) => {
    setGameState((prev) => {
      if (prev.screen !== 'upgrade') return prev;
      const cardId = prev.deck[deckIndex];
      if (!cardId) return prev;
      const upgradedId = getUpgradedId(cardId);
      if (upgradedId === cardId) return prev;
      const newDeck = [...prev.deck];
      newDeck[deckIndex] = upgradedId;
      return { ...prev, screen: 'map', deck: newDeck };
    });
  }, []);

  const skipUpgrade = useCallback(() => {
    setGameState((prev) => (prev.screen === 'upgrade' ? { ...prev, screen: 'map' } : prev));
  }, []);

  const skipRest = useCallback(() => {
    setGameState((prev) => (prev.screen === 'rest' ? { ...prev, screen: 'map' } : prev));
  }, []);
  // #endregion

  const goToTitle = useCallback(() => {
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
    goToTitle,
  };
}
