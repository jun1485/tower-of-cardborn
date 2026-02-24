// 플레이어 정보 표시 + 피격/방어 피드백 컴포넌트

import type { Player } from '@tower-of-cardborn/game-core/types/character';
import type { CharacterClass } from '@tower-of-cardborn/game-core/types/game';
import { HealthBar } from '../ui/HealthBar';
import { FloatingNumber } from '../ui/FloatingNumber';
import { StatusBadge } from '../ui/StatusBadge';
import { usePrevious } from '../../hooks/use-previous';
import styles from '../../styles/combat.module.css';

const CLASS_IMAGE: Record<CharacterClass, string> = {
  warrior: '/assets/classes/warrior.png?v=4',
  archer: '/assets/classes/archer.png?v=4',
  mage: '/assets/classes/mage.png?v=4',
  assassin: '/assets/classes/assassin.png?v=4',
};

const CLASS_ALT: Record<CharacterClass, string> = {
  warrior: '전사',
  archer: '궁수',
  mage: '마법사',
  assassin: '암살자',
};

interface PlayerAreaProps {
  readonly player: Player;
  readonly isAttacking: boolean;
  readonly characterClass: CharacterClass;
}

export function PlayerArea({ player, isAttacking, characterClass }: PlayerAreaProps) {
  const prevHp = usePrevious(player.hp);
  const prevBlock = usePrevious(player.block);
  const isHit = prevHp > player.hp;
  const gainedBlock = player.block > prevBlock;

  return (
    <div className={`${styles.playerArea} ${isHit ? styles.shake : ''} ${isAttacking ? styles.playerLunge : ''}`}>
      <div className={styles.characterSprite}>
        <img className={styles.characterImage} src={CLASS_IMAGE[characterClass]} alt={CLASS_ALT[characterClass]} />
        <FloatingNumber currentValue={player.hp} previousValue={prevHp} mode="hp" />
        {gainedBlock && (
          <span className={`${styles.floatingNumber} ${styles.floatingBlock} ${styles.floatingOnce}`}>
            +{player.block - prevBlock}
          </span>
        )}
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
  );
}

