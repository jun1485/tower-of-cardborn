// 플레이어 정보 표시 + 피격/방어 피드백 컴포넌트

import type { Player } from '@tower-of-cardborn/game-core/types/character';
import type { CharacterClass } from '@tower-of-cardborn/game-core/types/game';
import { useTranslation } from '../../i18n';
import { HealthBar } from '../ui/HealthBar';
import { FloatingNumber } from '../ui/FloatingNumber';
import { StatusBadge } from '../ui/StatusBadge';
import { usePrevious } from '../../hooks/use-previous';
import styles from '../../styles/combat.module.css';

const CLASS_IMAGE: Record<CharacterClass, string> = {
  warrior: '/assets/classes/warrior.webp?v=8',
  archer: '/assets/classes/archer.webp?v=8',
  mage: '/assets/classes/mage.webp?v=8',
  assassin: '/assets/classes/assassin.webp?v=8',
};

const CLASS_NAME_KEY: Record<CharacterClass, 'warrior' | 'archer' | 'mage' | 'assassin'> = {
  warrior: 'warrior',
  archer: 'archer',
  mage: 'mage',
  assassin: 'assassin',
};

interface PlayerAreaProps {
  readonly player: Player;
  readonly isAttacking: boolean;
  readonly characterClass: CharacterClass;
}

export function PlayerArea({ player, isAttacking, characterClass }: PlayerAreaProps) {
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
        {player.statusEffects.length > 0 && (
          <div className={styles.statusEffects}>
            {player.statusEffects.map((effect, i) => (
              <StatusBadge key={i} effect={effect} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
