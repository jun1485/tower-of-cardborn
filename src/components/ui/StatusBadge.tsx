// 상태 효과 배지 + 호버 툴팁

import type { StatusEffect } from '../../types/character';
import styles from '../../styles/combat.module.css';

interface StatusBadgeProps {
  readonly effect: StatusEffect;
}

/** 상태 효과별 아이콘/라벨/설명 */
function getStatusInfo(effect: StatusEffect): { icon: string; label: string; description: string } {
  switch (effect.type) {
    case 'vulnerable':
      return {
        icon: '💥',
        label: `취약 ${effect.duration}`,
        description: `받는 데미지 50% 증가 (${effect.duration}턴 남음)`,
      };
    case 'weak':
      return {
        icon: '🔻',
        label: `약화 ${effect.duration}`,
        description: `주는 데미지 25% 감소 (${effect.duration}턴 남음)`,
      };
    case 'strength':
      return {
        icon: '💪',
        label: `힘 ${effect.duration}`,
        description: `공격 카드 데미지 +${effect.duration} (영구)`,
      };
  }
}

export function StatusBadge({ effect }: StatusBadgeProps) {
  const info = getStatusInfo(effect);

  return (
    <span className={styles.statusBadge}>
      {info.icon} {info.label}
      <span className={styles.statusTooltip}>{info.description}</span>
    </span>
  );
}
