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
    <div className={styles.energyOrb} role="status" aria-label={`${t('energy')} ${energy}/${maxEnergy}`}>
      <span className={styles.energyLabel}>{t('energy')}</span>
      {/* 수치 변경 시 리마운트로 팝 재생 */}
      <div key={energy} className={`${styles.energyValueGroup} ${styles.energyPop}`}>
        <span className={styles.energyText}>{energy}</span>
        <span className={styles.energyMax}>/{maxEnergy}</span>
      </div>
    </div>
  );
}
