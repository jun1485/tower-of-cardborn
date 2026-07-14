// 인게임 점수 순위표 모달

import { useMemo, useState } from 'react';
import { useLanguage, useTranslation } from '../../i18n';
import type { Language } from '../../i18n';
import { useModalKeyboard } from '../../hooks/use-modal-keyboard';
import { getRankedRuns, loadMeta } from '../../utils/meta';
import { playSfx } from '../../utils/sound';
import styles from '../../styles/app.module.css';

/** 순위표 필터 종류 */
type RankingFilter = 'all' | 'daily';

interface RankingBoardProps {
  readonly onClose: () => void;
}

const CLASS_KEY = {
  warrior: 'warrior',
  archer: 'archer',
  mage: 'mage',
  assassin: 'assassin',
} as const;

/** 런 종료 일시 표시 */
function formatFinishedAt(finishedAt: number, lang: Language): string {
  const locale = lang === 'ko' ? 'ko-KR' : lang === 'zh' ? 'zh-CN' : 'en-US';
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' })
    .format(new Date(finishedAt));
}

export function RankingBoard({ onClose }: RankingBoardProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const modalRef = useModalKeyboard(onClose);
  const [filter, setFilter] = useState<RankingFilter>('all');
  const allRuns = useMemo(() => loadMeta().bestRuns, []);
  const bestRuns = getRankedRuns(allRuns, filter === 'daily');

  return (
    <div className={styles.policyOverlay} onClick={onClose}>
      <div
        className={styles.policyModal}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ranking-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.policyHeader}>
          <h2 id="ranking-title">{t('ranking')}</h2>
          <button className={styles.policyCloseBtn} aria-label={t('close')} onClick={onClose}>×</button>
        </div>
        <div className={styles.policyContent}>
          <div className={styles.rankTabs} role="tablist">
            <button
              className={`${styles.rankTabBtn} ${filter === 'all' ? styles.rankTabActive : ''}`}
              role="tab"
              aria-selected={filter === 'all'}
              onClick={() => {
                playSfx('button_click');
                setFilter('all');
              }}
            >
              {t('rankingAll')}
            </button>
            <button
              className={`${styles.rankTabBtn} ${filter === 'daily' ? styles.rankTabActive : ''}`}
              role="tab"
              aria-selected={filter === 'daily'}
              onClick={() => {
                playSfx('button_click');
                setFilter('daily');
              }}
            >
              {t('rankDaily')}
            </button>
          </div>
          {bestRuns.length === 0 ? <p>{t('noRanking')}</p> : (
            <ol className={styles.rankList}>
              {bestRuns.map((run, index) => (
                <li key={`${run.finishedAt}-${run.score}`} className={styles.rankItem}>
                  <span className={styles.rankPosition}>#{index + 1}</span>
                  <span className={styles.rankScore}>{t('rankingScore', run.score.toLocaleString())}</span>
                  <span className={styles.rankDetail}>
                    {run.won ? t('runWon') : t('runLost')}
                    {run.characterClass && ` · ${t(CLASS_KEY[run.characterClass])}`}
                    {` · ${run.floor}${t('floor')}`}
                    {run.ascension > 0 && ` · ${t('ascensionLabel', run.ascension)}`}
                    {run.isDaily && <span className={styles.dailyTag}>{t('rankDaily')}</span>}
                    {` · ${formatFinishedAt(run.finishedAt, lang)}`}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
