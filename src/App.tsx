// 루트 컴포넌트: 화면 라우팅 + i18n Provider

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGame } from './hooks/use-game';
import { useBackButton } from './hooks/use-back-button';
import { useAudioLifecycle } from './hooks/use-audio-lifecycle';
import { I18nProvider, LangProvider, createT, useTranslation } from './i18n';
import { loadSettings } from './utils/settings';
import { loadMeta } from './utils/meta';
import { playSfx, resumeAudioContext, setMusicScene } from './utils/sound';
import { preloadCardArt } from './utils/card-art';
import { getFloorsClimbed } from '@tower-of-cardborn/game-core/game/map-generator';
import { canUpgrade } from '@tower-of-cardborn/game-core/data/cards';
import { CombatScreen } from './components/combat/CombatScreen';
import { RewardScreen } from './components/combat/RewardScreen';
import { MapScreen } from './components/map/MapScreen';
import { RestScreen } from './components/map/RestScreen';
import { UpgradeScreen } from './components/map/UpgradeScreen';
import { RemoveScreen } from './components/map/RemoveScreen';
import { ShopScreen } from './components/map/ShopScreen';
import { EventScreen } from './components/map/EventScreen';
import { TitleScreen } from './components/title/TitleScreen';
import { RunResultScreen } from './components/result/RunResultScreen';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { PrivacyPolicy } from './components/ui/PrivacyPolicy';
import { SettingsModal } from './components/ui/SettingsModal';
import { RunHistory } from './components/ui/RunHistory';
import { HowToPlay } from './components/ui/HowToPlay';
import { DeckViewer } from './components/ui/DeckViewer';
import { RelicViewer } from './components/ui/RelicViewer';
import { PotionViewer } from './components/ui/PotionViewer';
import { RankingBoard } from './components/ui/RankingBoard';
import { EquipmentModal } from './components/ui/EquipmentModal';
import type { Language } from './i18n/types';
import styles from './styles/app.module.css';

/** 전역 오버레이 모달 식별자 */
type ModalId = 'settings' | 'privacy' | 'history' | 'help' | 'deck' | 'relics' | 'potions' | 'ranking' | 'equipment';

function App() {
  const [lang, setLang] = useState<Language>(() => loadSettings().language);
  const tFn = useMemo(() => createT(lang), [lang]);

  // 문서 언어 정보 갱신
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
    document.title = tFn('gameTitle');
    document.querySelector('meta[name="description"]')?.setAttribute('content', tFn('appDescription'));
  }, [lang, tFn]);

  return (
    <LangProvider value={lang}>
      <I18nProvider value={tFn}>
        <AppInner onLangChange={setLang} />
      </I18nProvider>
    </LangProvider>
  );
}

interface AppInnerProps {
  readonly onLangChange: (lang: Language) => void;
}

// 실제 라우팅 렌더링 (I18nProvider 하위)
function AppInner({ onLangChange }: AppInnerProps) {
  const t = useTranslation();
  useAudioLifecycle();
  const [activeModal, setActiveModal] = useState<ModalId | null>(null);
  const [combatOverlayOpen, setCombatOverlayOpen] = useState(false);
  const {
    screen, combat, deck, playerHp, playerMaxHp, map, characterClass, rewardCards,
    gold, rewardGold, rewardRelic, relics, rewardPotion, potions,
    shopCards, shopRelics, shopPotions, shopRelicPrice, shopPotionPrice, shopRemovePrice, shopUpgradePrice,
    kills, ascension, removeSource, upgradeSource,
    eventId, eventResult, unlockedAscension, restHealAmount, runSeed, isDaily,
    startNewGame, selectMapNode, handlePlayCard, handleEndTurn,
    pickRewardCard, skipReward, rest, goToUpgrade, goToShopUpgrade, upgradeCard, skipUpgrade, skipRest,
    goToRemove, removeCard, skipRemove, chooseEventOption, finishEvent, continueEndless,
    buyCard, buyRelic, buyPotion, leaveShop, usePotion, goToTitle,
    resetProgress,
    saveError, dismissSaveError,
  } = useGame();

  // 타이틀 승천 레벨 선택값 (해금 범위 클램프)
  const [selectedAscension, setSelectedAscension] = useState(() => {
    const meta = loadMeta();
    return Math.min(meta.lastAscension, meta.ascensionUnlocked);
  });

  const closeModal = useCallback(() => {
    playSfx('button_click');
    setActiveModal(null);
  }, []);

  /** 전역 모달 열기 */
  const openModal = useCallback((modalId: ModalId) => {
    playSfx('button_click');
    setActiveModal(modalId);
  }, []);

  /** 활성 모달 닫기 */
  const closeOverlay = useCallback(() => {
    if (activeModal === null) return false;
    setActiveModal(null);
    return true;
  }, [activeModal]);

  const { showConfirm, confirmBack, cancelBack } = useBackButton({ screen, goToTitle, closeOverlay });

  // 화면 분위기별 배경음악 전환
  useEffect(() => {
    setMusicScene(
      screen === 'combat'
        ? 'combat'
        : screen === 'title'
          ? 'title'
          : screen === 'victory' || screen === 'game_over'
            ? 'result'
            : 'map',
    );
  }, [screen]);

  // 현재 런 카드 이미지 선로딩
  useEffect(() => {
    preloadCardArt([...deck, ...rewardCards, ...shopCards]);
  }, [deck, rewardCards, shopCards]);

  /** 진행도와 승천 선택값 초기화 */
  const handleResetProgress = () => {
    resetProgress();
    setSelectedAscension(0);
  };

  // 첫 사용자 제스처 시 AudioContext 활성화
  useEffect(() => {
    const handler = () => { resumeAudioContext(); window.removeEventListener('pointerdown', handler); };
    window.addEventListener('pointerdown', handler);
    return () => window.removeEventListener('pointerdown', handler);
  }, []);

  const confirmMessage = screen === 'title' ? t('exitConfirm') : t('backToTitleConfirm');
  const confirmLabel = screen === 'title' ? t('exit') : t('titleBack');

  const floorsClimbed = getFloorsClimbed(map);

  const renderScreen = () => {
    switch (screen) {
      case 'title':
        return (
          <TitleScreen
            selectedAscension={selectedAscension}
            onAscensionChange={setSelectedAscension}
            onStart={startNewGame}
            onOpenPrivacy={() => openModal('privacy')}
            onOpenHistory={() => openModal('history')}
            onOpenHelp={() => openModal('help')}
            onOpenRanking={() => openModal('ranking')}
            onOpenEquipment={() => openModal('equipment')}
          />
        );

      case 'map':
        if (!map) return null;
        return (
          <MapScreen
            map={map}
            playerHp={playerHp}
            playerMaxHp={playerMaxHp}
            deck={deck}
            relics={relics}
            potions={potions}
            gold={gold}
            ascension={ascension}
            runSeed={runSeed}
            onSelectNode={selectMapNode}
            onOpenDeck={() => openModal('deck')}
            onOpenRelics={() => openModal('relics')}
            onOpenPotions={() => openModal('potions')}
          />
        );

      case 'combat':
        if (!combat) return null;
        return (
          <CombatScreen
            combat={combat}
            characterClass={characterClass}
            onPlayCard={handlePlayCard}
            onEndTurn={handleEndTurn}
            potions={potions}
            onUsePotion={usePotion}
            onOverlayChange={setCombatOverlayOpen}
          />
        );

      case 'combat_reward':
        return (
          <RewardScreen
            variant={map?.nodes.find((node) => node.id === map.currentNodeId)?.type === 'treasure' ? 'treasure' : 'combat'}
            rewardCards={rewardCards}
            rewardGold={rewardGold}
            rewardRelic={rewardRelic}
            rewardPotion={rewardPotion}
            onPick={pickRewardCard}
            onSkip={skipReward}
          />
        );

      case 'rest':
        return (
          <RestScreen
            playerHp={playerHp}
            playerMaxHp={playerMaxHp}
            deckSize={deck.length}
            upgradableCount={deck.filter((cardId) => canUpgrade(cardId)).length}
            healAmount={restHealAmount}
            onRest={rest}
            onUpgrade={goToUpgrade}
            onRemove={goToRemove}
            onSkip={skipRest}
          />
        );

      case 'upgrade':
        return (
          <UpgradeScreen
            deck={deck}
            canSkip={upgradeSource !== 'event'}
            onUpgrade={upgradeCard}
            onSkip={skipUpgrade}
          />
        );

      case 'remove_card':
        return (
          <RemoveScreen
            deck={deck}
            canSkip={removeSource !== 'event'}
            onRemove={removeCard}
            onSkip={skipRemove}
          />
        );

      case 'event':
        if (!eventId) return null;
        return (
          <EventScreen
            eventId={eventId}
            eventResult={eventResult}
            playerHp={playerHp}
            playerMaxHp={playerMaxHp}
            gold={gold}
            deck={deck}
            relics={relics}
            onChoose={chooseEventOption}
            onFinish={finishEvent}
          />
        );

      case 'shop':
        return (
          <ShopScreen
            shopCards={shopCards}
            shopRelics={shopRelics}
            shopPotions={shopPotions}
            relicPrice={shopRelicPrice}
            potionPrice={shopPotionPrice}
            removePrice={shopRemovePrice}
            upgradePrice={shopUpgradePrice}
            relics={relics}
            ascension={ascension}
            potionCount={potions.length}
            gold={gold}
            deckSize={deck.length}
            upgradableCount={deck.filter((cardId) => canUpgrade(cardId)).length}
            onBuy={buyCard}
            onBuyRelic={buyRelic}
            onBuyPotion={buyPotion}
            onRemoveService={goToRemove}
            onUpgradeService={goToShopUpgrade}
            onLeave={leaveShop}
          />
        );

      case 'victory':
      case 'game_over':
        return (
          <RunResultScreen
            variant={screen === 'victory' ? 'victory' : 'defeat'}
            deckSize={deck.length}
            playerHp={playerHp}
            playerMaxHp={playerMaxHp}
            unlockedAscension={unlockedAscension}
            floorsClimbed={floorsClimbed}
            kills={kills}
            gold={gold}
            ascension={ascension}
            runSeed={runSeed}
            isDaily={isDaily}
            onRestart={() => startNewGame(
              characterClass,
              ascension,
              screen === 'game_over' ? runSeed ?? undefined : undefined,
            )}
            onTitle={goToTitle}
            onContinueEndless={screen === 'victory' ? continueEndless : undefined}
          />
        );
    }
  };

  return (
    <>
      {renderScreen()}
      {saveError && (
        <div className={styles.saveError} role="alert">
          <span>{t('saveError')}</span>
          <button type="button" aria-label={t('close')} onClick={dismissSaveError}>×</button>
        </div>
      )}
      {!combatOverlayOpen && (
        <button className={styles.globalSettingsBtn} aria-label={t('settings')} onClick={() => openModal('settings')}>⚙</button>
      )}
      {activeModal === 'settings' && (
        <SettingsModal
          onClose={closeModal}
          onLangChange={onLangChange}
          onResetSave={handleResetProgress}
          onQuitRun={screen === 'title' ? undefined : goToTitle}
          onOpenDeck={screen === 'title' ? undefined : () => setActiveModal('deck')}
          onOpenRelics={screen === 'title' || relics.length === 0 ? undefined : () => setActiveModal('relics')}
          onOpenPotions={screen === 'title' || potions.length === 0 ? undefined : () => setActiveModal('potions')}
        />
      )}
      {activeModal === 'privacy' && <PrivacyPolicy onClose={closeModal} />}
      {activeModal === 'history' && <RunHistory onClose={closeModal} />}
      {activeModal === 'help' && <HowToPlay onClose={closeModal} />}
      {activeModal === 'deck' && <DeckViewer deck={deck} onClose={closeModal} />}
      {activeModal === 'relics' && <RelicViewer relics={relics} onClose={closeModal} />}
      {activeModal === 'potions' && <PotionViewer potions={potions} onClose={closeModal} />}
      {activeModal === 'ranking' && <RankingBoard onClose={closeModal} />}
      {activeModal === 'equipment' && <EquipmentModal onClose={closeModal} />}
      {showConfirm && (
        <ConfirmDialog
          message={confirmMessage}
          confirmText={confirmLabel}
          onConfirm={confirmBack}
          onCancel={cancelBack}
        />
      )}
    </>
  );
}

export default App;
