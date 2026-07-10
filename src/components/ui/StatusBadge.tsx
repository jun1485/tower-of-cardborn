// 상태 효과 배지 + 호버/탭 툴팁

import { useState } from 'react';
import type { StatusEffect } from '@tower-of-cardborn/game-core/types/character';
import { useTranslation } from '../../i18n';
import type { TFunction } from '../../i18n';
import styles from '../../styles/combat.module.css';

interface StatusBadgeProps {
  readonly effect: StatusEffect;
}

/** 상태 효과별 아이콘/라벨/설명 조합 */
function getStatusInfo(effect: StatusEffect, t: TFunction): { icon: string; label: string; description: string } {
  switch (effect.type) {
    case 'vulnerable':
      return {
        icon: '💥',
        label: `${t('vulnerable')} ${effect.duration}`,
        description: `${t('vulnerableDesc')} (${effect.duration} ${t('turnsLeft')})`,
      };
    case 'weak':
      return {
        icon: '🔻',
        label: `${t('weak')} ${effect.duration}`,
        description: `${t('weakDesc')} (${effect.duration} ${t('turnsLeft')})`,
      };
    case 'strength':
      return {
        icon: '💪',
        label: `${t('strength')} ${effect.duration}`,
        description: `${t('strengthDesc')} +${effect.duration} (${t('permanent')})`,
      };
  }
}

export function StatusBadge({ effect }: StatusBadgeProps) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const info = getStatusInfo(effect, t);

  return (
    <button
      type="button"
      className={`${styles.statusBadge} ${open ? styles.statusBadgeOpen : ''}`}
      onClick={() => setOpen((prev) => !prev)}
      onBlur={() => setOpen(false)}
    >
      {info.icon} {info.label}
      <span className={styles.statusTooltip}>{info.description}</span>
    </button>
  );
}
