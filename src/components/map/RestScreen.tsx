// 휴식 화면: HP 회복 또는 카드 강화 선택

import styles from '../../styles/app.module.css';

interface RestScreenProps {
  readonly playerHp: number;
  readonly playerMaxHp: number;
  readonly onRest: () => void;
  readonly onUpgrade: () => void;
  readonly onSkip: () => void;
}

export function RestScreen({ playerHp, playerMaxHp, onRest, onUpgrade, onSkip }: RestScreenProps) {
  const healAmount = Math.floor(playerMaxHp * 0.3);
  const actualHeal = Math.min(healAmount, playerMaxHp - playerHp);

  return (
    <div className={styles.resultScreen}>
      <h1 className={styles.resultTitle}>휴식</h1>
      <p className={styles.subtitle}>HP {playerHp}/{playerMaxHp}</p>
      <button className={styles.startBtn} onClick={onRest}>
        휴식 (HP +{actualHeal})
      </button>
      <button className={styles.startBtn} onClick={onUpgrade}>
        강화 (카드 1장 업그레이드)
      </button>
      <button className={styles.resultBtn} onClick={onSkip}>
        건너뛰기
      </button>
    </div>
  );
}
