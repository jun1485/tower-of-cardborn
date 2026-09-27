// 타이틀 화면 (직업 선택 + 승천 + 일일 도전 + 시드 입력)

import { useMemo, useState } from 'react';
import { useTranslation, useLanguage } from '../../i18n';
import { getCardName } from '../../i18n/card-text';
import { getUTCDateString, loadMeta } from '../../utils/meta';
import { getStarterDeck } from '@tower-of-cardborn/game-core/data/cards';
import { getDailySeed } from '@tower-of-cardborn/game-core/utils/random';
import type { CharacterClass } from '@tower-of-cardborn/game-core/types/game';
import type { Language, Translations } from '../../i18n/types';
import { playSfx } from '../../utils/sound';
import styles from '../../styles/app.module.css';

// 승천 레벨별 설명 키
const ASC_DESC_KEYS: readonly (keyof Translations)[] = ['ascDesc0', 'ascDesc1', 'ascDesc2', 'ascDesc3', 'ascDesc4', 'ascDesc5'];

const CLASS_IMAGE: Record<CharacterClass, string> = {
  warrior: '/assets/classes/warrior-v2.webp',
  archer: '/assets/classes/archer-v2.webp',
  mage: '/assets/classes/mage-v2.webp',
  assassin: '/assets/classes/assassin-v2.webp',
};

// 직업별 번역 키 매핑
const CLASS_NAME_KEY = {
  warrior: 'warrior',
  archer: 'archer',
  mage: 'mage',
  assassin: 'assassin',
} as const;

// 직업별 전투 성향 번역 키
const CLASS_DESC_KEY = {
  warrior: 'warriorDesc',
  archer: 'archerDesc',
  mage: 'mageDesc',
  assassin: 'assassinDesc',
} as const;

const CLASS_LIST = ['warrior', 'archer', 'mage', 'assassin'] as const;

/** 시드 입력 문자열 32비트 시드 변환 */
function parseSeedInput(input: string): number | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  if (/^\d+$/.test(trimmed)) return Number(trimmed) >>> 0;
  // FNV-1a 해시
  let hash = 0x811C9DC5;
  for (let i = 0; i < trimmed.length; i++) {
    hash ^= trimmed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** 직업 시작 덱 설명 동적 생성 (카드 이름 번역 적용) */
function buildDeckLabel(cls: CharacterClass, lang: Language): string {
  const counts = new Map<string, number>();
  for (const id of getStarterDeck(cls)) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts]
    .map(([id, count]) => `${getCardName(id, lang)} x${count}`)
    .join(' · ');
}

interface TitleScreenProps {
  readonly selectedAscension: number;
  readonly onAscensionChange: (level: number) => void;
  readonly onStart: (cls: CharacterClass, ascension: number, seed: number | undefined, isDaily: boolean) => void;
  readonly onOpenPrivacy: () => void;
  readonly onOpenHistory: () => void;
  readonly onOpenHelp: () => void;
  readonly onOpenRanking: () => void;
  readonly onOpenEquipment: () => void;
}

export function TitleScreen({
  selectedAscension,
  onAscensionChange,
  onStart,
  onOpenPrivacy,
  onOpenHistory,
  onOpenHelp,
  onOpenRanking,
  onOpenEquipment,
}: TitleScreenProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const [dailyChallenge, setDailyChallenge] = useState(false);
  const [seedInput, setSeedInput] = useState('');

  const meta = useMemo(() => loadMeta(), []);
  // 렌더 시점 날짜 기준 일일 시드 (자정 경과 후 재렌더 시 갱신)
  const dailySeed = getDailySeed();
  // 일일 도전 직업·난이도는 날짜 시드로 고정
  const dailyClass = CLASS_LIST[dailySeed % CLASS_LIST.length];
  const dailyCompleted = meta.lastDaily?.date === getUTCDateString();
  const deckLabels = useMemo(
    () => new Map(CLASS_LIST.map((cls) => [cls, buildDeckLabel(cls, lang)])),
    [lang],
  );

  const winRate = meta.totalRuns > 0 ? Math.round((meta.totalWins / meta.totalRuns) * 100) : 0;

  /** 직업 선택 런 시작 */
  const handleStart = (cls: CharacterClass) => {
    if (dailyChallenge) {
      onStart(dailyClass, 0, dailySeed, true);
      return;
    }
    onStart(cls, selectedAscension, parseSeedInput(seedInput), false);
  };

  return (
    <div className={styles.titleScreen}>
      <h1 className={styles.title}>{t('gameTitle')}</h1>
      <p className={styles.subtitle}>{t('selectClass')}</p>
      {meta.totalRuns > 0 && (
        <p className={styles.statsLine}>
          {t('metaStats', meta.totalRuns, meta.totalWins, winRate, meta.bestFloor, meta.totalKills)}
        </p>
      )}
      {meta.ascensionUnlocked >= 1 && !dailyChallenge && (
        <div className={styles.ascensionGroup}>
          <div className={styles.ascensionRow}>
            <button
              className={styles.ascensionStepBtn}
              disabled={selectedAscension <= 0}
              aria-label={t('ascensionDecrease')}
              onClick={() => {
                playSfx('button_click');
                onAscensionChange(Math.max(0, selectedAscension - 1));
              }}
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
              onClick={() => {
                playSfx('button_click');
                onAscensionChange(Math.min(meta.ascensionUnlocked, selectedAscension + 1));
              }}
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
        onClick={() => {
          playSfx('button_click');
          setDailyChallenge((enabled) => !enabled);
        }}
      >
        <strong>
          {t('dailyChallenge')}
          {dailyCompleted && <span className={styles.dailyDoneBadge}>✓ {t('dailyCompleted')}</span>}
        </strong>
        <span>{dailyCompleted ? t('dailyRetryUnranked') : t('dailyChallengeDesc')}</span>
      </button>
      {!dailyChallenge && (
        <label className={styles.seedRow}>
          <span>{t('seedInputLabel')}</span>
          <input
            className={styles.seedInput}
            value={seedInput}
            placeholder={t('seedInputPlaceholder')}
            maxLength={32}
            onChange={(event) => setSeedInput(event.target.value)}
          />
        </label>
      )}
      <div className={styles.classSelection}>
        {CLASS_LIST.map((cls) => (
          <button
            key={cls}
            className={styles.classCard}
            disabled={dailyChallenge && cls !== dailyClass}
            onClick={() => handleStart(cls)}
          >
            <img className={styles.classIcon} src={CLASS_IMAGE[cls]} alt="" decoding="async" />
            <span className={styles.className}>{t(CLASS_NAME_KEY[cls])}</span>
            <span className={styles.classDeck}>
              <strong className={styles.classTrait}>{t(CLASS_DESC_KEY[cls])}</strong>
              <span>{deckLabels.get(cls)}</span>
            </span>
          </button>
        ))}
      </div>
      <div className={styles.titleLinks}>
        <button className={styles.privacyLink} onClick={onOpenEquipment}>
          {t('equipment')}
        </button>
        <button className={styles.privacyLink} onClick={onOpenRanking}>
          {t('ranking')}
        </button>
        <button className={styles.privacyLink} onClick={onOpenPrivacy}>
          {t('privacyPolicy')}
        </button>
        <button className={styles.privacyLink} onClick={onOpenHistory}>
          {t('runHistory')}
        </button>
        <button className={styles.privacyLink} onClick={onOpenHelp}>
          {t('howToPlay')}
        </button>
      </div>
    </div>
  );
}
