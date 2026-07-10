// 루트 컴포넌트: 화면 라우팅 + i18n Provider

import { useEffect, useMemo, useState } from 'react';
import { useGame } from './hooks/use-game';
import { useBackButton } from './hooks/use-back-button';
import { I18nProvider, LangProvider, createT, useTranslation } from './i18n';
import { getCardName } from './i18n/card-text';
import { loadSettings } from './utils/settings';
import { loadMeta } from './utils/meta';
import { resumeAudioContext } from './utils/sound';
import { getFloorsClimbed } from '@tower-of-cardborn/game-core/game/map-generator';
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
import type { Language, Translations } from './i18n/types';
import type { CharacterClass } from '@tower-of-cardborn/game-core/types/game';
import styles from './styles/app.module.css';

// 승천 레벨별 설명 키
const ASC_DESC_KEYS: readonly (keyof Translations)[] = ['ascDesc0', 'ascDesc1', 'ascDesc2', 'ascDesc3', 'ascDesc4', 'ascDesc5'];

const CLASS_IMAGE: Record<CharacterClass, string> = {
  warrior: '/assets/classes/warrior.png?v=4',
  archer: '/assets/classes/archer.png?v=4',
  mage: '/assets/classes/mage.png?v=4',
  assassin: '/assets/classes/assassin.png?v=4',
};

// 직업별 번역 키 매핑
const CLASS_NAME_KEY = {
  warrior: 'warrior',
  archer: 'archer',
  mage: 'mage',
  assassin: 'assassin',
} as const;

// 직업별 시작 덱 구성 (카드ID + 수량)
const CLASS_STARTER_DECK: Record<CharacterClass, readonly { id: string; count: number }[]> = {
  warrior: [{ id: 'strike', count: 5 }, { id: 'defend', count: 4 }, { id: 'bash', count: 1 }],
  archer: [{ id: 'quick_shot', count: 5 }, { id: 'dodge', count: 4 }, { id: 'aimed_shot', count: 1 }],
  mage: [{ id: 'magic_bolt', count: 5 }, { id: 'arcane_barrier', count: 4 }, { id: 'mana_blast', count: 1 }],
  assassin: [{ id: 'shadow_strike', count: 5 }, { id: 'evasive_step', count: 4 }, { id: 'blood_drain', count: 1 }],
};

function App() {
  const [lang, setLang] = useState<Language>(() => loadSettings().language);
  const tFn = useMemo(() => createT(lang), [lang]);

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
  return CLASS_STARTER_DECK[cls]
    .map(({ id, count }) => `${getCardName(id, lang)} x${count}`)
    .join(' · ');
}

// 실제 라우팅 렌더링 (I18nProvider 하위)
function AppInner({ lang, onLangChange }: AppInnerProps) {
  const t = useTranslation();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const {
    screen, combat, deck, playerHp, playerMaxHp, map, characterClass, rewardCards,
    gold, rewardGold, shopCards, kills, ascension, removeSource, upgradeSource,
    eventId, eventResult, unlockedAscension, restHealAmount,
    startNewGame, selectMapNode, handlePlayCard, handleEndTurn,
    pickRewardCard, skipReward, rest, goToUpgrade, upgradeCard, skipUpgrade, skipRest,
    goToRemove, removeCard, skipRemove, chooseEventOption, finishEvent,
    buyCard, leaveShop, goToTitle,
  } = useGame();

  // 타이틀 승천 레벨 선택값 (해금 범위 클램프)
  const [selectedAscension, setSelectedAscension] = useState(() => {
    const meta = loadMeta();
    return Math.min(meta.lastAscension, meta.ascensionUnlocked);
  });

  const { showConfirm, confirmBack, cancelBack } = useBackButton({ screen, goToTitle });

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
                    onClick={() => setSelectedAscension((prev) => Math.min(meta.ascensionUnlocked, prev + 1))}
                  >
                    ▶
                  </button>
                </div>
                <span className={styles.ascensionDesc}>{t(ASC_DESC_KEYS[selectedAscension])}</span>
              </div>
            )}
            <div className={styles.classSelection}>
              {(['warrior', 'archer', 'mage', 'assassin'] as const).map((cls) => (
                <button key={cls} className={styles.classCard} onClick={() => startNewGame(cls, selectedAscension)}>
                  <img className={styles.classIcon} src={CLASS_IMAGE[cls]} alt={t(CLASS_NAME_KEY[cls])} />
                  <span className={styles.className}>{t(CLASS_NAME_KEY[cls])}</span>
                  <span className={styles.classDeck}>{buildDeckLabel(cls, lang)}</span>
                </button>
              ))}
            </div>
            <button className={styles.privacyLink} onClick={() => setShowPrivacy(true)}>
              Privacy Policy
            </button>
            {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
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
            deckSize={deck.length}
            gold={gold}
            ascension={ascension}
            onSelectNode={selectMapNode}
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
          />
        );

      case 'combat_reward':
        return (
          <RewardScreen
            rewardCards={rewardCards}
            rewardGold={rewardGold}
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
            <button className={styles.resultBtn} onClick={() => startNewGame(characterClass, ascension)}>
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
      <button className={styles.globalSettingsBtn} onClick={() => setShowSettings(true)}>⚙</button>
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onLangChange={onLangChange}
        />
      )}
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
