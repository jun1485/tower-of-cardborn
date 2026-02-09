// HP 바 공용 컴포넌트

import styles from '../../styles/combat.module.css';

interface HealthBarProps {
  readonly hp: number;
  readonly maxHp: number;
  readonly block: number;
}

export function HealthBar({ hp, maxHp, block }: HealthBarProps) {
  const percentage = Math.max(0, (hp / maxHp) * 100);

  return (
    <div className={styles.healthBar}>
      <div className={styles.healthBarFill} style={{ width: `${percentage}%` }} />
      <span className={styles.healthBarText}>
        {hp}/{maxHp}
        {block > 0 && <span className={styles.blockBadge}> 🛡{block}</span>}
      </span>
    </div>
  );
}
