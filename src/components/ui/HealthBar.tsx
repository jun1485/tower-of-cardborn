// HP 바 공용 컴포넌트

import { useTranslation } from '../../i18n';
import styles from "../../styles/combat.module.css";

interface HealthBarProps {
  readonly hp: number;
  readonly maxHp: number;
  readonly block: number;
}

export function HealthBar({ hp, maxHp, block }: HealthBarProps) {
  const t = useTranslation();
  const percentage = Math.max(0, (hp / maxHp) * 100);

  return (
    <div
      className={styles.healthBar}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={maxHp}
      aria-valuenow={Math.min(maxHp, Math.max(0, hp))}
      aria-label={`${hp}/${maxHp}${block > 0 ? ` ${t('block')} ${block}` : ''}`}
    >
      <div
        className={styles.healthBarFill}
        style={{ width: `${percentage}%` }}
      />
      <span className={styles.healthBarText}>
        {hp}/{maxHp}
        {block > 0 && <span className={styles.blockBadge}>{t('block')} {block}</span>}
      </span>
    </div>
  );
}
