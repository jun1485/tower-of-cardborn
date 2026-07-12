// 최근 런 기록 모달

import { useLanguage, useTranslation } from '../../i18n';
import type { Language } from '../../i18n';
import { useModalKeyboard } from '../../hooks/use-modal-keyboard';
import { loadMeta } from '../../utils/meta';
import { getAchievementProgress } from '../../utils/achievements';
import type { AchievementId } from '../../utils/achievements';
import styles from '../../styles/app.module.css';

interface RunHistoryProps {
  readonly onClose: () => void;
}

const ACHIEVEMENT_KEY: Record<AchievementId,
  'achievementFirstWin' | 'achievementSlayer' | 'achievementTowerClear' | 'achievementAscensionMaster'
  | 'achievementDailyChampion' | 'achievementVeteran' | 'achievementHighScorer'> = {
  first_win: 'achievementFirstWin',
  slayer: 'achievementSlayer',
  tower_clear: 'achievementTowerClear',
  ascension_master: 'achievementAscensionMaster',
  daily_champion: 'achievementDailyChampion',
  veteran: 'achievementVeteran',
  high_scorer: 'achievementHighScorer',
};

const CLASS_KEY = {
  warrior: 'warrior',
  archer: 'archer',
  mage: 'mage',
  assassin: 'assassin',
} as const;

/** 런 종료 일시 표시 */
function formatFinishedAt(finishedAt: number, lang: Language): string {
  const locale = lang === 'ko' ? 'ko-KR' : lang === 'zh' ? 'zh-CN' : 'en-US';
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    .format(new Date(finishedAt));
}

export function RunHistory({ onClose }: RunHistoryProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const modalRef = useModalKeyboard(onClose);
  const meta = loadMeta();
  const runs = meta.recentRuns;
  const achievements = getAchievementProgress(meta);

  return (
    <div className={styles.policyOverlay} onClick={onClose}>
      <div
        className={styles.policyModal}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="run-history-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.policyHeader}>
          <h2 id="run-history-title">{t('runHistory')}</h2>
          <button className={styles.policyCloseBtn} aria-label={t('close')} onClick={onClose}>×</button>
        </div>
        <div className={styles.policyContent}>
          <h3>{t('achievements', achievements.filter((achievement) => achievement.unlocked).length, achievements.length)}</h3>
          <ul className={styles.achievementList}>
            {achievements.map((achievement) => (
              <li key={achievement.id} className={achievement.unlocked ? styles.achievementUnlocked : styles.achievementLocked}>
                <span aria-hidden="true">{achievement.unlocked ? '★' : '☆'}</span>
                {t(ACHIEVEMENT_KEY[achievement.id])}
              </li>
            ))}
          </ul>
          <h3>{t('runHistory')}</h3>
          {runs.length === 0 ? <p>{t('noRunHistory')}</p> : (
            <ol className={styles.runHistoryList}>
              {runs.map((run) => (
                <li key={`${run.finishedAt}-${run.floor}-${run.kills}`} className={styles.runHistoryItem}>
                  {t(
                    'runHistoryItem',
                    formatFinishedAt(run.finishedAt, lang),
                    run.won ? t('runWon') : t('runLost'),
                    run.floor,
                    run.kills,
                    run.ascension,
                  )}
                  {run.characterClass && ` · ${t(CLASS_KEY[run.characterClass])}`}
                  {` · ${t('runScoreLabel', run.score.toLocaleString())}`}
                  {run.isDaily && <span className={styles.dailyTag}>{t('rankDaily')}</span>}
                  {run.runSeed !== null && ` · ${t('runSeedLabel', run.runSeed)}`}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
