// 루트 컴포넌트: 화면 라우팅 + i18n Provider

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGame } from './hooks/use-game';
import { useBackButton } from './hooks/use-back-button';
import { useAudioLifecycle } from './hooks/use-audio-lifecycle';
import { I18nProvider, LangProvider, createT, useTranslation } from './i18n';
import { getCardName } from './i18n/card-text';
import { loadSettings } from './utils/settings';
import { loadMeta } from './utils/meta';
import { resumeAudioContext } from './utils/sound';
import { getFloorsClimbed } from '@tower-of-cardborn/game-core/game/map-generator';
import { getStarterDeck } from '@tower-of-cardborn/game-core/data/cards';
import { getDailySeed } from '@tower-of-cardborn/game-core/utils/random';
import { CombatScreen } from './components/combat/CombatScreen';
import { RewardScreen } from './components/combat/RewardScreen';
import { MapScreen } from './components/map/MapScreen';
import { RestScreen } from './components/map/RestScreen';
import { UpgradeScreen } from './components/map/UpgradeScreen';
import { RemoveScreen } from './components/map/RemoveScreen';
import { ShopScreen } from './components/map/ShopScreen';
import { EventScreen } from './components/map/EventScreen';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { PrivacyPolicy } from './components/ui/PrivacyPolicy';
import { SettingsModal } from './components/ui/SettingsModal';
import { RunHistory } from './components/ui/RunHistory';
import { HowToPlay } from './components/ui/HowToPlay';
import { DeckViewer } from './components/ui/DeckViewer';
import { RelicViewer } from './components/ui/RelicViewer';
import type { Language, Translations } from './i18n/types';
import type { CharacterClass } from '@tower-of-cardborn/game-core/types/game';
import styles from './styles/app.module.css';

// 승천 레벨별 설명 키
const ASC_DESC_KEYS: readonly (keyof Translations)[] = ['ascDesc0', 'ascDesc1', 'ascDesc2', 'ascDesc3', 'ascDesc4', 'ascDesc5'];

const CLASS_IMAGE: Record<CharacterClass, string> = {
  warrior: '/assets/classes/warrior.webp?v=5',
  archer: '/assets/classes/archer.webp?v=5',
  mage: '/assets/classes/mage.webp?v=5',
  assassin: '/assets/classes/assassin.webp?v=5',
};

// 직업별 번역 키 매핑
const CLASS_NAME_KEY = {
  warrior: 'warrior',
  archer: 'archer',
  mage: 'mage',
  assassin: 'assassin',
} as const;

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
        <AppInner lang={lang} onLangChange={setLang} />
      </I18nProvider>
    </LangProvider>
  );
}

interface AppInnerProps {
  readonly lang: Language;
  readonly onLangChange: (lang: Language) => void;
}

/** 직업 시작 덱 설명 동적 생성 (카드 이름 번역 적용) */
function buildDeckLabel(cls: CharacterClass, lang: import('./i18n/types').Language): string {
  const counts = new Map<string, number>();
  for (const id of getStarterDeck(cls)) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts]
    .map(([id, count]) => `${getCardName(id, lang)} x${count}`)
    .join(' · ');
}

// 실제 라우팅 렌더링 (I18nProvider 하위)
function AppInner({ lang, onLangChange }: AppInnerProps) {
  const t = useTranslation();
  useAudioLifecycle();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [dailyChallenge, setDailyChallenge] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showDeck, setShowDeck] = useState(false);
  const [showRelics, setShowRelics] = useState(false);
  const [combatOverlayOpen, setCombatOverlayOpen] = useState(false);
  const {
    screen, combat, deck, playerHp, playerMaxHp, map, characterClass, rewardCards,
    gold, rewardGold, rewardRelic, relics, shopCards, kills, ascension, removeSource, upgradeSource,
    eventId, eventResult, unlockedAscension, restHealAmount, runSeed,
    startNewGame, selectMapNode, handlePlayCard, handleEndTurn,
    pickRewardCard, skipReward, rest, goToUpgrade, upgradeCard, skipUpgrade, skipRest,
    goToRemove, removeCard, skipRemove, chooseEventOption, finishEvent,
    buyCard, leaveShop, goToTitle,
    resetProgress,
    saveError, dismissSaveError,
  } = useGame();

  // 타이틀 승천 레벨 선택값 (해금 범위 클램프)
  const [selectedAscension, setSelectedAscension] = useState(() => {
    const meta = loadMeta();
    return Math.min(meta.lastAscension, meta.ascensionUnlocked);
  });

  /** 활성 모달 닫기 */
  const closeOverlay = useCallback(() => {
    if (!showSettings && !showPrivacy && !showHistory && !showHelp && !showDeck && !showRelics) return false;
    setShowSettings(false);
    setShowPrivacy(false);
    setShowHistory(false);
    setShowHelp(false);
    setShowDeck(false);
    setShowRelics(false);
    return true;
  }, [showDeck, showHelp, showHistory, showPrivacy, showRelics, showSettings]);

  const { showConfirm, confirmBack, cancelBack } = useBackButton({ screen, goToTitle, closeOverlay });

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
      case 'title': {
        const meta = loadMeta();
        const winRate = meta.totalRuns > 0 ? Math.round((meta.totalWins / meta.totalRuns) * 100) : 0;
        return (
          <div className={styles.titleScreen}>
            <h1 className={styles.title}>{t('gameTitle')}</h1>
            <p className={styles.subtitle}>{t('selectClass')}</p>
            {meta.totalRuns > 0 && (
              <p className={styles.statsLine}>
                {t('metaStats', meta.totalRuns, meta.totalWins, winRate, meta.bestFloor, meta.totalKills)}
              </p>
            )}
            {meta.ascensionUnlocked >= 1 && (
              <div className={styles.ascensionGroup}>
                <div className={styles.ascensionRow}>
                  <button
                    className={styles.ascensionStepBtn}
                    disabled={selectedAscension <= 0}
                    aria-label={t('ascensionDecrease')}
                    onClick={() => setSelectedAscension((prev) => Math.max(0, prev - 1))}
                  >
                    ◀
                  </button>
                  <span className={styles.ascensionValue}>
                    {selectedAscension === 0 ? t('ascensionNormal') : t('ascensionLabel', selectedAscension)}
                  </span>
                  <button
                    className={styles.ascensionStepBtn}
                    disabled={selectedAscension >= meta.ascensionUnlocked}
                    aria-label={t('ascensionIncrease')}
                    onClick={() => setSelectedAscension((prev) => Math.min(meta.ascensionUnlocked, prev + 1))}
                  >
                    ▶
                  </button>
                </div>
                <span className={styles.ascensionDesc}>{t(ASC_DESC_KEYS[selectedAscension])}</span>
              </div>
            )}
            <button
              className={`${styles.dailyChallengeBtn} ${dailyChallenge ? styles.dailyChallengeBtnActive : ''}`}
              aria-pressed={dailyChallenge}
              onClick={() => setDailyChallenge((enabled) => !enabled)}
            >
              <strong>{t('dailyChallenge')}</strong>
              <span>{t('dailyChallengeDesc')}</span>
            </button>
            <div className={styles.classSelection}>
              {(['warrior', 'archer', 'mage', 'assassin'] as const).map((cls) => (
                <button
                  key={cls}
                  className={styles.classCard}
                  onClick={() => startNewGame(cls, selectedAscension, dailyChallenge ? getDailySeed() : undefined)}
                >
                  <img className={styles.classIcon} src={CLASS_IMAGE[cls]} alt="" decoding="async" />
                  <span className={styles.className}>{t(CLASS_NAME_KEY[cls])}</span>
                  <span className={styles.classDeck}>{buildDeckLabel(cls, lang)}</span>
                </button>
              ))}
            </div>
            <button className={styles.privacyLink} onClick={() => setShowPrivacy(true)}>
              {t('privacyPolicy')}
            </button>
            <button className={styles.privacyLink} onClick={() => setShowHistory(true)}>
              {t('runHistory')}
            </button>
            <button className={styles.privacyLink} onClick={() => setShowHelp(true)}>
              {t('howToPlay')}
            </button>
            {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
            {showHistory && <RunHistory onClose={() => setShowHistory(false)} />}
            {showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}
          </div>
        );
      }

      case 'map':
        if (!map) return null;
        return (
          <MapScreen
            map={map}
            playerHp={playerHp}
            playerMaxHp={playerMaxHp}
            deck={deck}
            relics={relics}
            gold={gold}
            ascension={ascension}
            onSelectNode={selectMapNode}
            onOpenDeck={() => setShowDeck(true)}
            onOpenRelics={() => setShowRelics(true)}
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
            onOverlayChange={setCombatOverlayOpen}
          />
        );

      case 'combat_reward':
        return (
          <RewardScreen
            rewardCards={rewardCards}
            rewardGold={rewardGold}
            rewardRelic={rewardRelic}
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
            onChoose={chooseEventOption}
            onFinish={finishEvent}
          />
        );

      case 'shop':
        return (
          <ShopScreen
            shopCards={shopCards}
            gold={gold}
            deckSize={deck.length}
            onBuy={buyCard}
            onRemoveService={goToRemove}
            onLeave={leaveShop}
          />
        );

      case 'victory':
        return (
          <div className={styles.resultScreen}>
            <h1 className={`${styles.resultTitle} ${styles.victoryTitle}`}>{t('victoryTitle')}</h1>
            {unlockedAscension !== null && (
              <span className={styles.goldBadge}>{t('ascensionUnlockedMsg', unlockedAscension)}</span>
            )}
            <p className={styles.subtitle}>{t('deckStat', deck.length, playerHp, playerMaxHp)}</p>
            <p className={styles.statsLine}>{t('runStats', floorsClimbed, kills, gold)}</p>
            {runSeed !== null && <p className={styles.statsLine}>{t('runSeedLabel', runSeed)}</p>}
            <button className={styles.resultBtn} onClick={() => startNewGame(characterClass, ascension)}>
              {t('newGame')}
            </button>
            <button className={styles.resultBtn} onClick={goToTitle}>
              {t('titleBack')}
            </button>
          </div>
        );

      case 'game_over':
        return (
          <div className={styles.resultScreen}>
            <h1 className={`${styles.resultTitle} ${styles.defeatTitle}`}>{t('defeatTitle')}</h1>
            <p className={styles.statsLine}>{t('runStats', floorsClimbed, kills, gold)}</p>
            {runSeed !== null && <p className={styles.statsLine}>{t('runSeedLabel', runSeed)}</p>}
            <button className={styles.resultBtn} onClick={() => startNewGame(characterClass, ascension, runSeed ?? undefined)}>
              {t('retry')}
            </button>
            <button className={styles.resultBtn} onClick={goToTitle}>
              {t('titleBack')}
            </button>
          </div>
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
        <button className={styles.globalSettingsBtn} aria-label={t('settings')} onClick={() => setShowSettings(true)}>⚙</button>
      )}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onLangChange={onLangChange}
          onResetSave={handleResetProgress}
          onQuitRun={screen === 'title' ? undefined : goToTitle}
          onOpenDeck={screen === 'title' ? undefined : () => setShowDeck(true)}
          onOpenRelics={screen === 'title' || relics.length === 0 ? undefined : () => setShowRelics(true)}
        />
      )}
      {showDeck && <DeckViewer deck={deck} onClose={() => setShowDeck(false)} />}
      {showRelics && <RelicViewer relics={relics} onClose={() => setShowRelics(false)} />}
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
