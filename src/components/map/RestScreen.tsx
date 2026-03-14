// 휴식 화면: HP 회복 또는 카드 강화 선택

import { useTranslation } from '../../i18n';
import styles from '../../styles/app.module.css';

interface RestScreenProps {
  readonly playerHp: number;
  readonly playerMaxHp: number;
  readonly onRest: () => void;
  readonly onUpgrade: () => void;
  readonly onSkip: () => void;
}

export function RestScreen({ playerHp, playerMaxHp, onRest, onUpgrade, onSkip }: RestScreenProps) {
  const t = useTranslation();
  const healAmount = Math.floor(playerMaxHp * 0.3);
  const actualHeal = Math.min(healAmount, playerMaxHp - playerHp);

  return (
    <div className={styles.resultScreen}>
      <h1 className={styles.resultTitle}>{t('restTitle')}</h1>
      <p className={styles.subtitle}>HP {playerHp}/{playerMaxHp}</p>
      <button className={styles.startBtn} onClick={onRest}>
        {t('restHeal', String(actualHeal))}
      </button>
      <button className={styles.startBtn} onClick={onUpgrade}>
        {t('upgradeOption')}
      </button>
      <button className={styles.resultBtn} onClick={onSkip}>
        {t('skip')}
      </button>
    </div>
  );
}
