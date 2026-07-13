// 상태 효과 배지 + 호버/탭 툴팁

import { useState } from 'react';
import type { StatusEffect } from '@tower-of-cardborn/game-core/types/character';
import { useTranslation } from '../../i18n';
import type { TFunction } from '../../i18n';
import { playSfx } from '../../utils/sound';
import styles from '../../styles/combat.module.css';

type StatusBadgeProps =
  | { readonly effect: StatusEffect; readonly label?: never; readonly description?: never }
  | { readonly effect?: never; readonly label: string; readonly description: string };

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
    case 'poison':
      return {
        icon: '☠️',
        label: `${t('poison')} ${effect.duration}`,
        description: `${t('poisonDesc')} (${effect.duration})`,
      };
    case 'frail':
      return {
        icon: '🕸️',
        label: `${t('frail')} ${effect.duration}`,
        description: `${t('frailDesc')} (${effect.duration} ${t('turnsLeft')})`,
      };
    case 'dexterity':
      return {
        icon: '🍃',
        label: `${t('dexterity')} ${effect.duration}`,
        description: `${t('dexterityDesc')} +${effect.duration} (${t('permanent')})`,
      };
  }
}

export function StatusBadge(props: StatusBadgeProps) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const info = props.effect
    ? getStatusInfo(props.effect, t)
    : { icon: '', label: props.label, description: props.description };

  return (
    <button
      type="button"
      className={`${styles.statusBadge} ${open ? styles.statusBadgeOpen : ''}`}
      aria-expanded={open}
      aria-label={info.description}
      onClick={() => {
        playSfx('button_click');
        setOpen((prev) => !prev);
      }}
      onBlur={() => setOpen(false)}
    >
      <span className={styles.statusBadgeVisual} aria-hidden="true">
        {info.icon && `${info.icon} `}{info.label}
      </span>
      <span className={styles.statusTooltip}>{info.description}</span>
    </button>
  );
}
