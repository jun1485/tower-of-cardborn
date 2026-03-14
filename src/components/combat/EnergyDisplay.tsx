// 에너지 표시 컴포넌트

import { useTranslation } from '../../i18n';
import styles from '../../styles/combat.module.css';

interface EnergyDisplayProps {
  readonly energy: number;
  readonly maxEnergy: number;
}

export function EnergyDisplay({ energy, maxEnergy }: EnergyDisplayProps) {
  const t = useTranslation();
  return (
    <div className={styles.energyOrb}>
      <span className={styles.energyLabel}>{t('energy')}</span>
      <div className={styles.energyValueGroup}>
        <span className={styles.energyText}>{energy}</span>
        <span className={styles.energyMax}>/{maxEnergy}</span>
      </div>
    </div>
  );
}
