// 에너지 표시 컴포넌트

import styles from '../../styles/combat.module.css';

interface EnergyDisplayProps {
  readonly energy: number;
  readonly maxEnergy: number;
}

export function EnergyDisplay({ energy, maxEnergy }: EnergyDisplayProps) {
  return (
    <div className={styles.energyOrb}>
      <span className={styles.energyText}>{energy}/{maxEnergy}</span>
    </div>
  );
}
