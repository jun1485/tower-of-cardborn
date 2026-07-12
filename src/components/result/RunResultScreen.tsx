// 런 종료 결과 화면 (승리/패배 공용)

import { useMemo, useState } from 'react';
import { useTranslation } from '../../i18n';
import { calculateRunScore, loadMeta } from '../../utils/meta';
import { calculateShardReward } from '../../utils/equipment';
import styles from '../../styles/app.module.css';

interface RunResultScreenProps {
  readonly variant: 'victory' | 'defeat';
  readonly deckSize: number;
  readonly playerHp: number;
  readonly playerMaxHp: number;
  readonly unlockedAscension: number | null;
  readonly floorsClimbed: number;
  readonly kills: number;
  readonly gold: number;
  readonly ascension: number;
  readonly runSeed: number | null;
  readonly isDaily: boolean;
  readonly onRestart: () => void;
  readonly onTitle: () => void;
  /** 승리 화면 전용: 엔들리스 등반 계속 */
  readonly onContinueEndless?: () => void;
}

export function RunResultScreen({
  variant,
  deckSize,
  playerHp,
  playerMaxHp,
  unlockedAscension,
  floorsClimbed,
  kills,
  gold,
  ascension,
  runSeed,
  isDaily,
  onRestart,
  onTitle,
  onContinueEndless,
}: RunResultScreenProps) {
  const t = useTranslation();
  const [copied, setCopied] = useState(false);
  const isVictory = variant === 'victory';
  const score = calculateRunScore({ floor: floorsClimbed, kills, won: isVictory, ascension });
  const shardsEarned = calculateShardReward(floorsClimbed, isVictory);
  // 이번 런이 순위표 1위 점수와 같으면 신기록 표시
  const isNewRecord = useMemo(() => (loadMeta().bestRuns[0]?.score ?? -1) === score, [score]);

  /** 런 결과 텍스트 공유 (미지원 시 클립보드 복사) */
  const handleShare = async () => {
    const parts = [
      'Tower of Cardborn',
      isDaily ? t('dailyChallenge') : null,
      isVictory ? t('runWon') : t('runLost'),
      t('runScoreLabel', score.toLocaleString()),
      t('runStats', floorsClimbed, kills, gold),
      runSeed !== null ? t('runSeedLabel', runSeed) : null,
    ];
    const text = parts.filter(Boolean).join(' · ');
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // 공유 취소 시 무시
    }
  };

  return (
    <div className={styles.resultScreen}>
      <h1 className={`${styles.resultTitle} ${isVictory ? styles.victoryTitle : styles.defeatTitle}`}>
        {isVictory ? t('victoryTitle') : t('defeatTitle')}
      </h1>
      {isVictory && unlockedAscension !== null && (
        <span className={styles.goldBadge}>{t('ascensionUnlockedMsg', unlockedAscension)}</span>
      )}
      {isVictory && <p className={styles.subtitle}>{t('deckStat', deckSize, playerHp, playerMaxHp)}</p>}
      <p className={styles.statsLine}>{t('runStats', floorsClimbed, kills, gold)}</p>
      <p className={styles.statsLine}>
        {t('runScoreLabel', score.toLocaleString())} · {t('shardsEarnedLabel', shardsEarned)}
        {isNewRecord && <span className={styles.newRecordBadge}>🏆 {t('newRecord')}</span>}
      </p>
      {runSeed !== null && <p className={styles.statsLine}>{t('runSeedLabel', runSeed)}</p>}
      {isVictory && onContinueEndless && (
        <button className={styles.resultBtn} onClick={onContinueEndless}>
          {t('continueEndless')}
        </button>
      )}
      <button className={styles.resultBtn} onClick={onRestart}>
        {isVictory ? t('newGame') : t('retry')}
      </button>
      <button className={styles.resultBtn} onClick={handleShare}>
        {copied ? t('shareCopied') : t('shareResult')}
      </button>
      <button className={styles.resultBtn} onClick={onTitle}>
        {t('titleBack')}
      </button>
    </div>
  );
}
