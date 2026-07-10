// 휴식 화면: HP 회복 또는 카드 강화 선택

import { useTranslation } from '../../i18n';
import { MIN_DECK_SIZE } from '../../utils/game-transitions';
import styles from '../../styles/app.module.css';

interface RestScreenProps {
  readonly playerHp: number;
  readonly playerMaxHp: number;
  readonly deckSize: number;
  readonly healAmount: number;
  readonly onRest: () => void;
  readonly onUpgrade: () => void;
  readonly onRemove: () => void;
  readonly onSkip: () => void;
}

export function RestScreen({ playerHp, playerMaxHp, deckSize, healAmount, onRest, onUpgrade, onRemove, onSkip }: RestScreenProps) {
  const t = useTranslation();
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
      <button className={styles.startBtn} disabled={deckSize <= MIN_DECK_SIZE} onClick={onRemove}>
        {t('removeOption')}
      </button>
      <button className={styles.resultBtn} onClick={onSkip}>
        {t('skip')}
      </button>
    </div>
  );
}
