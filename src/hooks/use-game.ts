// 게임 전체 상태 관리 hook (맵/이벤트/상점/승천 통합)

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CharacterClass, GameState } from '@tower-of-cardborn/game-core/types/game';
import type { CombatState } from '@tower-of-cardborn/game-core/types/combat';
import { getStarterDeck, getRewardCards, canUpgrade } from '@tower-of-cardborn/game-core/data/cards';
import { getAscensionModifier, MAX_ASCENSION } from '@tower-of-cardborn/game-core/data/ascension';
import { getEventById } from '@tower-of-cardborn/game-core/data/events';
import { isChoiceAvailable, resolveEventChoice, pickRandomEvent } from '@tower-of-cardborn/game-core/game/event-engine';
import { saveGame, clearSave } from '../utils/storage';
import { clearMeta, recordRunStart, recordRunEnd, updateRecordedRun } from '../utils/meta';
import { playSfx } from '../utils/sound';
import { DEFAULT_TOTAL_MAPS, generateMap, getAvailableNodeIds, getFloorsClimbed } from '@tower-of-cardborn/game-core/game/map-generator';
import {
  DEFAULT_GAME_STATE, findCurrentNode, loadValidGameState,
  recordUnfinishedRun, rollCombatRewards,
} from '../utils/game-state';
import {
  applyEventOutcome, buyCardState, buyPotionState, buyRelicState, enterMapNode,
  enterRemoveState, enterShopUpgradeState, enterUpgradeState,
  completeCombatRewardState, enterCombatRewardState, enterGameOverState, finishEventState,
  getShopCardPrice, getShopPotionPrice, getShopRelicPrice,
  leaveShopState, removeCardState, restState, skipRemoveState, skipRestState,
  skipUpgradeState, upgradeCardState,
} from '../utils/game-transitions';
import { useCombat } from './use-combat';
import {
  generateRandomSeed, getRandomState, resetRandomSource, setRandomSeed,
} from '@tower-of-cardborn/game-core/utils/random';
import {
  applyRelicGoldBonus, getRelicCombatBonuses, getRelicRestHealBonus,
  getRelicReward, hasUnownedRelic, rollShopRelic,
} from '@tower-of-cardborn/game-core/data/relics';
import { TREASURE_BALANCE } from '@tower-of-cardborn/game-core/data/balance';
import { applyEquipmentCombatBonuses, clearEquipment, getEquipmentBonuses } from '../utils/equipment';
import { POTION_DEFINITIONS, rollPotionReward } from '@tower-of-cardborn/game-core/data/potions';
import type { PotionId } from '@tower-of-cardborn/game-core/types/potion';
import type { RelicId } from '@tower-of-cardborn/game-core/types/relic';
import { random } from '@tower-of-cardborn/game-core/utils/random';

const SHOP_CARD_COUNT = 5;
const SHOP_POTION_COUNT = 2;

/** 상점 판매 포션 무작위 구성 */
function rollShopPotions(): PotionId[] {
  const potionIds = Object.keys(POTION_DEFINITIONS) as PotionId[];
  return Array.from({ length: SHOP_POTION_COUNT }, () => potionIds[Math.floor(random() * potionIds.length)]);
}

export function useGame() {
  const [gameState, setGameState] = useState<GameState>(loadValidGameState);
  const [saveError, setSaveError] = useState(false);
  const stateRef = useRef(gameState);
  const rewardSelectionLockRef = useRef(false);
  const pendingPotionUseRef = useRef(false);
  const potionUseLockRef = useRef(false);
  const mapSelectionLockRef = useRef(false);
  const eventChoiceLockRef = useRef(false);
  const runStartLockRef = useRef(false);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  // 포션 인벤토리 반영 후 사용 잠금 해제
  useEffect(() => {
    potionUseLockRef.current = false;
  }, [gameState.potions]);

  // 보상 화면 진입 시 선택 잠금 초기화
  useEffect(() => {
    if (gameState.screen === 'combat_reward') rewardSelectionLockRef.current = false;
    if (gameState.screen === 'map') mapSelectionLockRef.current = false;
    if (gameState.screen === 'event') eventChoiceLockRef.current = false;
    if (gameState.screen === 'title' || gameState.screen === 'game_over' || gameState.screen === 'victory') {
      runStartLockRef.current = false;
    }
  }, [gameState.screen]);

  // 전투 종료 결과 처리 (승리 보상 골드/처치 수 반영, 패배 시 메타 기록)
  const handleCombatResult = useCallback((finished: CombatState) => {
    if (finished.result === 'victory') {
      playSfx('victory');
      const current = stateRef.current;
      const potionInventorySize = Math.max(0, current.potions.length - (pendingPotionUseRef.current ? 1 : 0));
      const { rewardCards, rewardGold, rewardRelic, rewardPotion } = rollCombatRewards(current, potionInventorySize);
      setGameState((prev) => enterCombatRewardState(
        prev,
        finished.player.hp,
        rewardCards,
        rewardGold,
        rewardRelic,
        rewardPotion,
      ));
    } else if (finished.result === 'defeat') {
      playSfx('defeat');
      const current = stateRef.current;
      const encounterEnemyCount = findCurrentNode(current.map)?.enemyIds.length ?? finished.enemies.length;
      const defeatedEnemyCount = Math.max(0, encounterEnemyCount - finished.enemies.length);
      const totalKills = current.kills + defeatedEnemyCount;
      if (!current.runRecorded) {
        const recordResult = recordRunEnd({
          won: false,
          floor: getFloorsClimbed(current.map),
          kills: totalKills,
          ascension: current.ascension,
          runSeed: current.runSeed,
          characterClass: current.characterClass,
          isDaily: current.isDaily ?? false,
        });
        if (!recordResult.saved) setSaveError(true);
      } else if (current.recordedRunAt != null) {
        // 엔들리스 사망: 승리 기록의 층·점수 상향
        const updated = updateRecordedRun(current.recordedRunAt, {
          floor: getFloorsClimbed(current.map),
          kills: totalKills,
          ascension: current.ascension,
        });
        if (!updated) setSaveError(true);
      }
      setGameState((prev) => enterGameOverState(prev, defeatedEnemyCount));
    }
  }, []);

  const {
    combat, startCombat, handlePlayCard, handleEndTurn,
    handleUsePotion: applyCombatPotion, clearCombat,
  } = useCombat(gameState.combatState, handleCombatResult);

  // #region 자동 저장 (연속 액션 디바운스 + 화면 이탈 시 즉시 기록)
  const pendingSaveRef = useRef<GameState | null>(null);

  useEffect(() => {
    if (gameState.screen === 'title') {
      pendingSaveRef.current = null;
      // 렌더 연쇄 방지 위해 실패 통지 지연
      if (!clearSave()) queueMicrotask(() => setSaveError(true));
      return;
    }
    pendingSaveRef.current = { ...gameState, combatState: combat, randomState: getRandomState() };
    const timer = window.setTimeout(() => {
      if (pendingSaveRef.current && !saveGame(pendingSaveRef.current)) setSaveError(true);
      pendingSaveRef.current = null;
    }, 400);
    return () => window.clearTimeout(timer);
  }, [gameState, combat]);

  // 백그라운드 전환/종료 시 대기 저장 즉시 기록
  useEffect(() => {
    const flushPendingSave = () => {
      if (pendingSaveRef.current && !saveGame(pendingSaveRef.current)) setSaveError(true);
      pendingSaveRef.current = null;
    };
    document.addEventListener('visibilitychange', flushPendingSave);
    window.addEventListener('pagehide', flushPendingSave);
    return () => {
      document.removeEventListener('visibilitychange', flushPendingSave);
      window.removeEventListener('pagehide', flushPendingSave);
    };
  }, []);
  // #endregion

  // #region 포션 사용
  const usePotion = useCallback((potionIndex: number, targetEnemyId?: string) => {
    const current = stateRef.current;
    const potionId = current.potions[potionIndex];
    if (current.screen !== 'combat' || !potionId || potionUseLockRef.current) return;
    potionUseLockRef.current = true;
    pendingPotionUseRef.current = true;
    const used = applyCombatPotion(potionId, targetEnemyId);
    pendingPotionUseRef.current = false;
    if (!used) {
      potionUseLockRef.current = false;
      return;
    }
    setGameState((prev) => ({
      ...prev,
      potions: prev.potions.filter((_, index) => index !== potionIndex),
    }));
  }, [applyCombatPotion]);
  // #endregion

  // #region 새 게임 시작 (직업/승천 선택)
  const startNewGame = useCallback((characterClass: CharacterClass, ascension = 0, seed = generateRandomSeed(), isDaily = false) => {
    if (runStartLockRef.current) return;
    runStartLockRef.current = true;
    const normalizedAscension = Number.isFinite(ascension)
      ? Math.max(0, Math.min(MAX_ASCENSION, Math.floor(ascension)))
      : 0;
    const normalizedSeed = seed >>> 0;
    // 미기록 이전 런 종료 반영 (복원된 결과 화면 경유 포함)
    if (!recordUnfinishedRun(stateRef.current)) setSaveError(true);
    if (!clearSave()) setSaveError(true);
    clearCombat();
    if (!recordRunStart(normalizedAscension).saved) setSaveError(true);
    setRandomSeed(normalizedSeed);
    const modifier = getAscensionModifier(normalizedAscension);
    // 영구 장비 보너스 적용 (일일 도전은 공정성 위해 제외)
    const equipment = isDaily ? { strength: 0, maxHp: 0, gold: 0 } : getEquipmentBonuses();
    setGameState({
      ...DEFAULT_GAME_STATE,
      screen: 'map',
      deck: [...getStarterDeck(characterClass), ...(modifier.startWithCurse ? ['curse_wound'] : [])],
      playerHp: modifier.startHp + equipment.maxHp,
      playerMaxHp: DEFAULT_GAME_STATE.playerMaxHp + equipment.maxHp,
      map: generateMap(1, DEFAULT_TOTAL_MAPS, normalizedAscension),
      characterClass,
      gold: modifier.startGold + equipment.gold,
      ascension: normalizedAscension,
      runSeed: normalizedSeed,
      randomState: getRandomState(),
      isDaily,
    });
  }, [clearCombat]);
  // #endregion

  // #region 맵 노드 선택
  const selectMapNode = useCallback((nodeId: string) => {
    const current = stateRef.current;
    if (!current.map || mapSelectionLockRef.current) return;
    if (!getAvailableNodeIds(current.map).includes(nodeId)) return;
    const node = current.map.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    mapSelectionLockRef.current = true;

    playSfx('map_select');
    // 랜덤 의존 값은 updater 밖에서 확정
    const pickedEvent = node.type === 'event' ? pickRandomEvent(current.seenEventIds, current.map.mapIndex) : null;
    const pickedShopCards = node.type === 'shop' ? getRewardCards(SHOP_CARD_COUNT, current.characterClass) : null;
    const pickedShopRelic = node.type === 'shop' ? rollShopRelic(current.relics) : null;
    const pickedShopPotions = node.type === 'shop' ? rollShopPotions() : [];
    const pickedTreasure = node.type === 'treasure'
      ? {
          gold: applyRelicGoldBonus(
            TREASURE_BALANCE.goldBase + Math.floor(random() * (TREASURE_BALANCE.goldVariance + 1)),
            current.relics,
          ),
          relic: random() < TREASURE_BALANCE.relicChance ? getRelicReward(current.relics) : null,
          potion: random() < TREASURE_BALANCE.potionChance
            ? rollPotionReward('combat', current.potions.length)
            : null,
        }
      : null;

    setGameState((prev) => enterMapNode(
      prev,
      nodeId,
      pickedEvent?.id ?? null,
      pickedShopCards ?? [],
      pickedShopRelic ? [pickedShopRelic] : [],
      pickedShopPotions,
      pickedTreasure,
    ));
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
      applyEquipmentCombatBonuses(getRelicCombatBonuses(gameState.relics), gameState.isDaily ?? false),
    );
  }, [gameState.screen, combat, gameState.map, gameState.deck, gameState.playerHp, gameState.playerMaxHp, gameState.ascension, gameState.relics, gameState.isDaily, startCombat]);
  // #endregion

  // #region 이벤트 진행
  const chooseEventOption = useCallback((choiceIndex: number) => {
    const current = stateRef.current;
    if (current.screen !== 'event' || current.eventResult || !current.eventId || eventChoiceLockRef.current) return;
    const eventId = current.eventId;
    const event = getEventById(eventId);
    const choice = event?.choices[choiceIndex];
    if (!event || !choice) return;

    // 떠나기 선택지: 즉시 맵 복귀
    if (choice.effects.length === 0) {
      eventChoiceLockRef.current = true;
      playSfx('button_click');
      setGameState((prev) => ({ ...prev, screen: 'map', eventId: null, eventResult: null }));
      return;
    }

    const available = isChoiceAvailable(choice, {
      hp: current.playerHp,
      maxHp: current.playerMaxHp,
      gold: current.gold,
      deckSize: current.deck.length,
      upgradableCount: current.deck.filter((id) => canUpgrade(id)).length,
      relicCandidateAvailable: hasUnownedRelic(current.relics),
    });
    if (!available) return;
    eventChoiceLockRef.current = true;
    playSfx('button_click');

    // 랜덤 의존 결과는 updater 밖에서 확정
    const outcome = resolveEventChoice(event, choice, {
      hp: current.playerHp,
      maxHp: current.playerMaxHp,
      gold: current.gold,
      characterClass: current.characterClass,
      relics: current.relics,
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
      ? generateMap(current.map.mapIndex + 1, current.map.totalMaps, current.ascension)
      : null;
    let newlyUnlocked: number | null = null;
    let recordedAt: number | null = null;
    if (isFinalClear && !current.runRecorded) {
      const recordResult = recordRunEnd({
        won: true,
        floor: getFloorsClimbed(current.map),
        kills: current.kills,
        ascension: current.ascension,
        runSeed: current.runSeed,
        characterClass: current.characterClass,
        isDaily: current.isDaily ?? false,
      });
      newlyUnlocked = recordResult.newlyUnlocked;
      recordedAt = recordResult.recordedAt;
      if (!recordResult.saved) setSaveError(true);
    } else if (isFinalClear && current.recordedRunAt != null) {
      // 엔들리스 액트 클리어: 승리 기록의 층·점수 상향
      const updated = updateRecordedRun(current.recordedRunAt, {
        floor: getFloorsClimbed(current.map),
        kills: current.kills,
        ascension: current.ascension,
      });
      if (!updated) setSaveError(true);
    }
    setGameState((prev) => ({
      ...completeCombatRewardState(prev, nextMap, newlyUnlocked),
      ...(recordedAt !== null ? { recordedRunAt: recordedAt } : {}),
    }));
  }, [clearCombat]);

  // #region 엔들리스 등반 계속 (클리어 후 다음 액트 생성)
  const continueEndless = useCallback(() => {
    const current = stateRef.current;
    if (current.screen !== 'victory' || !current.map) return;
    playSfx('map_select');
    const nextIndex = current.map.mapIndex + 1;
    const nextMap = generateMap(nextIndex, nextIndex, current.ascension);
    setGameState((prev) => prev.screen === 'victory' && prev.map
      ? { ...prev, screen: 'map', map: nextMap, playerHp: prev.playerMaxHp, combatState: null }
      : prev);
  }, []);
  // #endregion

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
    if (gameState.rewardRelic || gameState.rewardPotion) playSfx('reward_pick');
    afterCombatEnd();
  }, [afterCombatEnd, gameState.rewardPotion, gameState.rewardRelic, gameState.screen]);
  // #endregion

  // #region 휴식 / 강화 / 카드 제거
  const rest = useCallback(() => {
    playSfx('heal');
    setGameState(restState);
  }, []);

  const goToUpgrade = useCallback(() => {
    setGameState(enterUpgradeState);
  }, []);

  // 상점 카드 강화 진입 (골드는 강화 확정 시 차감)
  const goToShopUpgrade = useCallback(() => {
    setGameState(enterShopUpgradeState);
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
    const price = getShopCardPrice(cardId, current.relics, current.ascension);
    if (current.gold < price) return;
    playSfx('reward_pick');
    setGameState((prev) => buyCardState(prev, cardId));
  }, []);

  const buyRelic = useCallback((relicId: RelicId) => {
    const current = stateRef.current;
    if (current.screen !== 'shop' || !(current.shopRelics ?? []).includes(relicId)) return;
    if (current.gold < getShopRelicPrice(current.relics, current.ascension)) return;
    playSfx('reward_pick');
    setGameState((prev) => buyRelicState(prev, relicId));
  }, []);

  const buyPotion = useCallback((potionId: PotionId) => {
    const current = stateRef.current;
    if (current.screen !== 'shop' || !(current.shopPotions ?? []).includes(potionId)) return;
    if (current.gold < getShopPotionPrice(current.relics, current.ascension)) return;
    playSfx('reward_pick');
    setGameState((prev) => buyPotionState(prev, potionId));
  }, []);

  const leaveShop = useCallback(() => {
    setGameState(leaveShopState);
  }, []);
  // #endregion

  const goToTitle = useCallback(() => {
    // 미기록 런 포기 기록
    if (!recordUnfinishedRun(stateRef.current)) setSaveError(true);
    clearCombat();
    if (!clearSave()) setSaveError(true);
    resetRandomSource();
    setGameState(DEFAULT_GAME_STATE);
  }, [clearCombat]);

  /** 런·통계·해금·장비 진행도 초기화 */
  const resetProgress = useCallback(() => {
    clearCombat();
    const saveCleared = clearSave();
    const metaCleared = clearMeta();
    const equipmentCleared = clearEquipment();
    if (!saveCleared || !metaCleared || !equipmentCleared) setSaveError(true);
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
    rewardPotion: gameState.rewardPotion,
    potions: gameState.potions,
    shopCards: gameState.shopCards,
    shopRelics: gameState.shopRelics ?? [],
    shopPotions: gameState.shopPotions ?? [],
    shopRelicPrice: getShopRelicPrice(gameState.relics, gameState.ascension),
    shopPotionPrice: getShopPotionPrice(gameState.relics, gameState.ascension),
    removeSource: gameState.removeSource,
    upgradeSource: gameState.upgradeSource,
    kills: gameState.kills,
    ascension: gameState.ascension,
    eventId: gameState.eventId,
    eventResult: gameState.eventResult,
    unlockedAscension: gameState.unlockedAscension,
    runSeed: gameState.runSeed,
    isDaily: gameState.isDaily ?? false,
    restHealAmount: Math.floor(gameState.playerMaxHp
      * (getAscensionModifier(gameState.ascension).restHealRate + getRelicRestHealBonus(gameState.relics))),
    startNewGame,
    selectMapNode,
    handlePlayCard,
    handleEndTurn,
    usePotion,
    pickRewardCard,
    skipReward,
    rest,
    goToUpgrade,
    goToShopUpgrade,
    upgradeCard,
    skipUpgrade,
    skipRest,
    goToRemove,
    removeCard,
    skipRemove,
    chooseEventOption,
    finishEvent,
    continueEndless,
    buyCard,
    buyRelic,
    buyPotion,
    leaveShop,
    goToTitle,
    resetProgress,
    saveError,
    dismissSaveError,
  };
}
