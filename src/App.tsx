// 루트 컴포넌트: 화면 라우팅 + i18n Provider

import { useEffect, useMemo, useState } from 'react';
import { useGame } from './hooks/use-game';
import { useBackButton } from './hooks/use-back-button';
import { I18nProvider, LangProvider, createT, useTranslation } from './i18n';
import { getCardName } from './i18n/card-text';
import { loadSettings } from './utils/settings';
import { resumeAudioContext } from './utils/sound';
import { CombatScreen } from './components/combat/CombatScreen';
import { RewardScreen } from './components/combat/RewardScreen';
import { MapScreen } from './components/map/MapScreen';
import { RestScreen } from './components/map/RestScreen';
import { UpgradeScreen } from './components/map/UpgradeScreen';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { PrivacyPolicy } from './components/ui/PrivacyPolicy';
import { SettingsModal } from './components/ui/SettingsModal';
import type { Language } from './i18n/types';
import type { CharacterClass } from '@tower-of-cardborn/game-core/types/game';
import styles from './styles/app.module.css';

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
    startNewGame, selectMapNode, handlePlayCard, handleEndTurn,
    pickRewardCard, skipReward, rest, goToUpgrade, upgradeCard, skipUpgrade, skipRest, goToTitle,
  } = useGame();

  const { showConfirm, confirmBack, cancelBack } = useBackButton({ screen, goToTitle });

  // 첫 사용자 제스처 시 AudioContext 활성화
  useEffect(() => {
    const handler = () => { resumeAudioContext(); window.removeEventListener('pointerdown', handler); };
    window.addEventListener('pointerdown', handler);
    return () => window.removeEventListener('pointerdown', handler);
  }, []);

  const confirmMessage = screen === 'title' ? t('exitConfirm') : t('backToTitleConfirm');
  const confirmLabel = screen === 'title' ? t('exit') : t('titleBack');

  const renderScreen = () => {
    switch (screen) {
      case 'title':
        return (
          <div className={styles.titleScreen}>
            <h1 className={styles.title}>{t('gameTitle')}</h1>
            <p className={styles.subtitle}>{t('selectClass')}</p>
            <div className={styles.classSelection}>
              {(['warrior', 'archer', 'mage', 'assassin'] as const).map((cls) => (
                <button key={cls} className={styles.classCard} onClick={() => startNewGame(cls)}>
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

      case 'map':
        if (!map) return null;
        return (
          <MapScreen
            map={map}
            playerHp={playerHp}
            playerMaxHp={playerMaxHp}
            deckSize={deck.length}
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
            onPick={pickRewardCard}
            onSkip={skipReward}
          />
        );

      case 'rest':
        return (
          <RestScreen
            playerHp={playerHp}
            playerMaxHp={playerMaxHp}
            onRest={rest}
            onUpgrade={goToUpgrade}
            onSkip={skipRest}
          />
        );

      case 'upgrade':
        return (
          <UpgradeScreen
            deck={deck}
            onUpgrade={upgradeCard}
            onSkip={skipUpgrade}
          />
        );

      case 'victory':
        return (
          <div className={styles.resultScreen}>
            <h1 className={`${styles.resultTitle} ${styles.victoryTitle}`}>{t('victoryTitle')}</h1>
            <p className={styles.subtitle}>{t('deckStat', deck.length, playerHp, playerMaxHp)}</p>
            <button className={styles.resultBtn} onClick={() => startNewGame(characterClass)}>
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
            <button className={styles.resultBtn} onClick={() => startNewGame(characterClass)}>
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
