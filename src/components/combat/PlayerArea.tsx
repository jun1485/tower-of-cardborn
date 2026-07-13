// 플레이어 정보 표시 + 피격/방어 피드백 컴포넌트

import { memo } from 'react';
import type { Player } from '@tower-of-cardborn/game-core/types/character';
import type { PlayerPower } from '@tower-of-cardborn/game-core/types/combat';
import type { CharacterClass } from '@tower-of-cardborn/game-core/types/game';
import { useTranslation } from '../../i18n';
import { HealthBar } from '../ui/HealthBar';
import { FloatingNumber } from '../ui/FloatingNumber';
import { StatusBadge } from '../ui/StatusBadge';
import { usePrevious } from '../../hooks/use-previous';
import styles from '../../styles/combat.module.css';

const CLASS_IMAGE: Record<CharacterClass, string> = {
  warrior: '/assets/classes/warrior-v2.webp',
  archer: '/assets/classes/archer-v2.webp',
  mage: '/assets/classes/mage-v2.webp',
  assassin: '/assets/classes/assassin-v2.webp',
};

const CLASS_NAME_KEY: Record<CharacterClass, 'warrior' | 'archer' | 'mage' | 'assassin'> = {
  warrior: 'warrior',
  archer: 'archer',
  mage: 'mage',
  assassin: 'assassin',
};

/** 지속 파워 아이콘 */
const POWER_ICONS: Record<PlayerPower['type'], string> = {
  turn_start_block: '🛡️',
  turn_start_strength: '⚡',
  turn_start_draw: '🃏',
  turn_start_heal: '💗',
};

/** 지속 파워 설명 번역 키 */
const POWER_TEXT_KEY = {
  turn_start_block: 'cdPowerBlock',
  turn_start_strength: 'cdPowerStrength',
  turn_start_draw: 'cdPowerDraw',
  turn_start_heal: 'cdPowerHeal',
} as const;

interface PlayerAreaProps {
  readonly player: Player;
  readonly powers: readonly PlayerPower[];
  readonly isAttacking: boolean;
  readonly characterClass: CharacterClass;
}

export const PlayerArea = memo(function PlayerArea({ player, powers, isAttacking, characterClass }: PlayerAreaProps) {
  const t = useTranslation();
  const prevHp = usePrevious(player.hp);
  const prevBlock = usePrevious(player.block);
  const isHit = prevHp > player.hp;
  const gainedBlock = player.block > prevBlock;

  return (
    <div className={`${styles.playerArea} ${isHit ? styles.shake : ''} ${isAttacking ? styles.playerLunge : ''}`}>
      <div className={styles.characterSprite}>
        <img className={styles.characterImage} src={CLASS_IMAGE[characterClass]} alt={t(CLASS_NAME_KEY[characterClass])} decoding="async" />
        <FloatingNumber currentValue={player.hp} previousValue={prevHp} mode="hp" />
        {gainedBlock && (
          <span className={`${styles.floatingNumber} ${styles.floatingBlock} ${styles.floatingOnce}`}>
            +{player.block - prevBlock}
          </span>
        )}
      </div>
      <div className={`${styles.combatantPanel} ${styles.playerPanel}`}>
        <div className={styles.combatantHeader}>
          <span className={styles.combatantLabel}>{t('player')}</span>
          <strong className={styles.combatantName}>{t(CLASS_NAME_KEY[characterClass])}</strong>
        </div>
        <HealthBar hp={player.hp} maxHp={player.maxHp} block={player.block} />
        {(player.statusEffects.length > 0 || powers.length > 0) && (
          <div className={styles.statusEffects}>
            {player.statusEffects.map((effect, i) => (
              <StatusBadge key={i} effect={effect} />
            ))}
            {powers.map((power) => (
              <StatusBadge
                key={power.type}
                label={`${POWER_ICONS[power.type]} ${power.value}`}
                description={t(POWER_TEXT_KEY[power.type], String(power.value))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
