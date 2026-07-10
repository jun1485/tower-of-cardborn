// 게임 전체 상태 관리 hook (맵/이벤트/상점/승천 통합)

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CharacterClass, GameState } from '@tower-of-cardborn/game-core/types/game';
import type { CombatState } from '@tower-of-cardborn/game-core/types/combat';
import { getStarterDeck, getRewardCards, getCardPrice, canUpgrade } from '@tower-of-cardborn/game-core/data/cards';
import { getAscensionModifier } from '@tower-of-cardborn/game-core/data/ascension';
import { getEventById } from '@tower-of-cardborn/game-core/data/events';
import { isChoiceAvailable, resolveEventChoice, pickRandomEvent } from '@tower-of-cardborn/game-core/game/event-engine';
import { saveGame, clearSave } from '../utils/storage';
import { clearMeta, recordRunStart, recordRunEnd } from '../utils/meta';
import { playSfx } from '../utils/sound';
import { generateMap, getAvailableNodeIds, getFloorsClimbed } from '@tower-of-cardborn/game-core/game/map-generator';
import { DEFAULT_GAME_STATE, findCurrentNode, loadValidGameState, recordUnfinishedRun, rollGoldReward } from '../utils/game-state';
import {
  applyEventOutcome, buyCardState, enterMapNode, enterRemoveState, enterUpgradeState,
  completeCombatRewardState, enterCombatRewardState, enterGameOverState, finishEventState,
  leaveShopState, removeCardState, restState, skipRemoveState, skipRestState,
  skipUpgradeState, upgradeCardState,
} from '../utils/game-transitions';
import { useCombat } from './use-combat';
import {
  generateRandomSeed, getRandomState, resetRandomSource, setRandomSeed,
} from '@tower-of-cardborn/game-core/utils/random';
import { applyRelicGoldBonus, getRelicCombatBonuses, getRelicReward } from '@tower-of-cardborn/game-core/data/relics';

const SHOP_CARD_COUNT = 5;

export function useGame() {
  const [gameState, setGameState] = useState<GameState>(loadValidGameState);
  const [saveError, setSaveError] = useState(false);
  const stateRef = useRef(gameState);
  const rewardSelectionLockRef = useRef(false);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  // 보상 화면 진입 시 선택 잠금 초기화
  useEffect(() => {
    if (gameState.screen === 'combat_reward') rewardSelectionLockRef.current = false;
  }, [gameState.screen]);

  // 전투 종료 결과 처리 (승리 보상 골드/처치 수 반영, 패배 시 메타 기록)
  const handleCombatResult = useCallback((finished: CombatState) => {
    if (finished.result === 'victory') {
      playSfx('victory');
      const current = stateRef.current;
      const currentNode = findCurrentNode(current.map);
      const rewardCards = current.rewardCards.length > 0 ? current.rewardCards : getRewardCards(3, current.characterClass);
      const rewardGold = current.rewardGold > 0
        ? current.rewardGold
        : applyRelicGoldBonus(rollGoldReward(currentNode?.type), current.relics);
      const rewardRelic = current.rewardRelic
        ?? (currentNode?.type === 'elite' || currentNode?.type === 'boss' ? getRelicReward(current.relics) : null);
      setGameState((prev) => enterCombatRewardState(prev, finished.player.hp, rewardCards, rewardGold, rewardRelic));
    } else if (finished.result === 'defeat') {
      playSfx('defeat');
      const current = stateRef.current;
      const encounterEnemyCount = findCurrentNode(current.map)?.enemyIds.length ?? finished.enemies.length;
      const defeatedEnemyCount = Math.max(0, encounterEnemyCount - finished.enemies.length);
      const totalKills = current.kills + defeatedEnemyCount;
      if (!current.runRecorded) {
        recordRunEnd({
          won: false,
          floor: getFloorsClimbed(current.map),
          kills: totalKills,
          ascension: current.ascension,
          runSeed: current.runSeed,
        });
      }
      setGameState((prev) => enterGameOverState(prev, defeatedEnemyCount));
    }
  }, []);

  const { combat, startCombat, handlePlayCard, handleEndTurn, clearCombat } = useCombat(gameState.combatState, handleCombatResult);

  // #region 자동 저장
  useEffect(() => {
    if (gameState.screen === 'title') {
      if (!clearSave()) setSaveError(true);
      return;
    }
    if (!saveGame({ ...gameState, combatState: combat, randomState: getRandomState() })) setSaveError(true);
  }, [gameState, combat]);
  // #endregion

  // #region 새 게임 시작 (직업/승천 선택)
  const startNewGame = useCallback((characterClass: CharacterClass, ascension = 0, seed = generateRandomSeed()) => {
    // 미기록 이전 런 종료 반영 (복원된 결과 화면 경유 포함)
    recordUnfinishedRun(stateRef.current);
    if (!clearSave()) setSaveError(true);
    clearCombat();
    recordRunStart(ascension);
    setRandomSeed(seed);
    const modifier = getAscensionModifier(ascension);
    setGameState({
      ...DEFAULT_GAME_STATE,
      screen: 'map',
      deck: [...getStarterDeck(characterClass)],
      playerHp: modifier.startHp,
      map: generateMap(),
      characterClass,
      gold: modifier.startGold,
      ascension,
      runSeed: seed,
      randomState: getRandomState(),
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

    setGameState((prev) => enterMapNode(prev, nodeId, pickedEvent?.id ?? null, pickedShopCards ?? []));
  }, []);

  // combat 화면 진입 시 전투 시작
  useEffect(() => {
    if (gameState.screen !== 'combat' || combat) return;
    if (!gameState.map?.currentNodeId) return;

    const node = gameState.map.nodes.find((n) => n.id === gameState.map!.currentNodeId);
    if (!node || node.enemyIds.length === 0) return;

    startCombat(
      gameState.deck,
      node.enemyIds,
      gameState.playerHp,
      gameState.playerMaxHp,
      gameState.ascension,
      gameState.map.mapIndex,
      getRelicCombatBonuses(gameState.relics),
    );
  }, [gameState.screen, combat, gameState.map, gameState.deck, gameState.playerHp, gameState.playerMaxHp, gameState.ascension, gameState.relics, startCombat]);
  // #endregion

  // #region 이벤트 진행
  const chooseEventOption = useCallback((choiceIndex: number) => {
    const current = stateRef.current;
    if (current.screen !== 'event' || current.eventResult || !current.eventId) return;
    const eventId = current.eventId;
    const event = getEventById(eventId);
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

    setGameState((prev) => applyEventOutcome(prev, eventId, outcome));
  }, []);

  const finishEvent = useCallback(() => {
    setGameState(finishEventState);
  }, []);
  // #endregion

  // #region 보상 선택/건너뛰기 후 맵 복귀, 10층 보스 클리어 시 다음 맵 생성 전환
  const afterCombatEnd = useCallback(() => {
    clearCombat();
    // 최종 보스 클리어 시 메타 기록 (다음 승천 레벨 해금)
    const current = stateRef.current;
    const endedNode = findCurrentNode(current.map);
    const isFinalClear = endedNode?.type === 'boss' && current.map != null && current.map.mapIndex >= current.map.totalMaps;
    const nextMap = endedNode?.type === 'boss' && current.map && current.map.mapIndex < current.map.totalMaps
      ? generateMap(current.map.mapIndex + 1, current.map.totalMaps)
      : null;
    let newlyUnlocked: number | null = null;
    if (isFinalClear && !current.runRecorded) {
      newlyUnlocked = recordRunEnd({
        won: true,
        floor: getFloorsClimbed(current.map),
        kills: current.kills,
        ascension: current.ascension,
        runSeed: current.runSeed,
      }).newlyUnlocked;
    }
    setGameState((prev) => completeCombatRewardState(prev, nextMap, newlyUnlocked));
  }, [clearCombat]);

  const pickRewardCard = useCallback((cardId: string) => {
    if (gameState.screen !== 'combat_reward' || rewardSelectionLockRef.current) return;
    if (!gameState.rewardCards.includes(cardId)) return;
    rewardSelectionLockRef.current = true;
    playSfx('reward_pick');
    setGameState((prev) => ({ ...prev, deck: [...prev.deck, cardId] }));
    afterCombatEnd();
  }, [afterCombatEnd, gameState.screen, gameState.rewardCards]);

  const skipReward = useCallback(() => {
    if (gameState.screen !== 'combat_reward' || rewardSelectionLockRef.current) return;
    rewardSelectionLockRef.current = true;
    if (gameState.rewardRelic) playSfx('reward_pick');
    afterCombatEnd();
  }, [afterCombatEnd, gameState.rewardRelic, gameState.screen]);
  // #endregion

  // #region 휴식 / 강화 / 카드 제거
  const rest = useCallback(() => {
    playSfx('heal');
    setGameState(restState);
  }, []);

  const goToUpgrade = useCallback(() => {
    setGameState(enterUpgradeState);
  }, []);

  const upgradeCard = useCallback((deckIndex: number) => {
    playSfx('upgrade');
    setGameState((prev) => upgradeCardState(prev, deckIndex));
  }, []);

  const skipUpgrade = useCallback(() => {
    setGameState(skipUpgradeState);
  }, []);

  const skipRest = useCallback(() => {
    setGameState(skipRestState);
  }, []);

  // 카드 제거 화면 진입 (휴식: 무료 / 상점: 골드 소모)
  const goToRemove = useCallback(() => {
    setGameState(enterRemoveState);
  }, []);

  // 덱에서 카드 제거 후 출처 화면 복귀
  const removeCard = useCallback((deckIndex: number) => {
    playSfx('button_click');
    setGameState((prev) => removeCardState(prev, deckIndex));
  }, []);

  const skipRemove = useCallback(() => {
    setGameState(skipRemoveState);
  }, []);
  // #endregion

  // #region 상점
  const buyCard = useCallback((cardId: string) => {
    const current = stateRef.current;
    if (current.screen !== 'shop' || !current.shopCards.includes(cardId)) return;
    const price = getCardPrice(cardId);
    if (current.gold < price) return;
    playSfx('reward_pick');
    setGameState((prev) => buyCardState(prev, cardId));
  }, []);

  const leaveShop = useCallback(() => {
    setGameState(leaveShopState);
  }, []);
  // #endregion

  const goToTitle = useCallback(() => {
    // 미기록 런 포기 기록
    recordUnfinishedRun(stateRef.current);
    clearCombat();
    if (!clearSave()) setSaveError(true);
    resetRandomSource();
    setGameState(DEFAULT_GAME_STATE);
  }, [clearCombat]);

  /** 런·통계·해금 진행도 초기화 */
  const resetProgress = useCallback(() => {
    clearCombat();
    const saveCleared = clearSave();
    const metaCleared = clearMeta();
    if (!saveCleared || !metaCleared) setSaveError(true);
    resetRandomSource();
    setGameState(DEFAULT_GAME_STATE);
  }, [clearCombat]);

  /** 저장 오류 안내 닫기 */
  const dismissSaveError = useCallback(() => {
    setSaveError(false);
  }, []);

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
    rewardRelic: gameState.rewardRelic,
    relics: gameState.relics,
    shopCards: gameState.shopCards,
    removeSource: gameState.removeSource,
    upgradeSource: gameState.upgradeSource,
    kills: gameState.kills,
    ascension: gameState.ascension,
    eventId: gameState.eventId,
    eventResult: gameState.eventResult,
    unlockedAscension: gameState.unlockedAscension,
    runSeed: gameState.runSeed,
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
    resetProgress,
    saveError,
    dismissSaveError,
  };
}
