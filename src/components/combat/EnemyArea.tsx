// 적 표시 + 데미지 피드백 컴포넌트

import type { Enemy } from '../../types/character';
import { HealthBar } from '../ui/HealthBar';
import { FloatingNumber } from '../ui/FloatingNumber';
import { StatusBadge } from '../ui/StatusBadge';
import { usePrevious } from '../../hooks/use-previous';
import styles from '../../styles/combat.module.css';

interface EnemyAreaProps {
  readonly enemies: readonly Enemy[];
  readonly selectedEnemyId: string | null;
  readonly hoveredEnemyId: string | null;
  readonly targetSelectable: boolean;
  readonly targetingActive: boolean;
  readonly onSelectEnemy: (enemyId: string) => void;
}

const ENEMY_IMAGE: Record<string, string> = {
  jaw_worm: '/assets/monsters/jaw_worm.png',
  cultist: '/assets/monsters/cultist.png',
  louse_red: '/assets/monsters/louse_red.png',
  fungi_beast: '/assets/monsters/fungi_beast.png',
  gremlin_nob: '/assets/monsters/gremlin_nob.png',
  lagavulin: '/assets/monsters/lagavulin.png',
  slime_boss: '/assets/monsters/slime_boss.png',
};

export function EnemyArea({
  enemies,
  selectedEnemyId,
  hoveredEnemyId,
  targetSelectable,
  targetingActive,
  onSelectEnemy,
}: EnemyAreaProps) {
  return (
    <div className={styles.enemyArea}>
      {enemies.map((enemy) => (
        <EnemyCard
          key={enemy.id}
          enemy={enemy}
          selected={selectedEnemyId === enemy.id}
          hovered={hoveredEnemyId === enemy.id}
          targetSelectable={targetSelectable}
          targetingActive={targetingActive}
          onSelectEnemy={onSelectEnemy}
        />
      ))}
    </div>
  );
}

/** 약화 반영된 실제 공격 데미지 계산 */
function getDisplayedAttack(enemy: Enemy): number {
  const isWeak = enemy.statusEffects.some((s) => s.type === 'weak' && s.duration > 0);
  return isWeak ? Math.floor(enemy.intent.value * 0.75) : enemy.intent.value;
}

interface EnemyCardProps {
  readonly enemy: Enemy;
  readonly selected: boolean;
  readonly hovered: boolean;
  readonly targetSelectable: boolean;
  readonly targetingActive: boolean;
  readonly onSelectEnemy: (enemyId: string) => void;
}

function EnemyCard({
  enemy,
  selected,
  hovered,
  targetSelectable,
  targetingActive,
  onSelectEnemy,
}: EnemyCardProps) {
  const prevHp = usePrevious(enemy.hp);
  const isHit = prevHp > enemy.hp;
  const enemyImage = ENEMY_IMAGE[enemy.definitionId] ?? '/assets/monsters/jaw_worm.png';
  const className = [
    styles.enemyCard,
    isHit ? styles.shake : '',
    targetingActive ? styles.enemyDraggable : '',
    targetingActive && hovered ? styles.enemyDropTarget : '',
    targetSelectable && selected ? styles.enemySelected : '',
    targetSelectable ? styles.enemyTargetable : '',
  ].join(' ');

  return (
    <div
      className={className}
      data-enemy-id={enemy.id}
      onClick={() => targetSelectable && onSelectEnemy(enemy.id)}
    >
      <div className={styles.enemyIntent}>
        {enemy.intent.type === 'attack' && `⚔️ ${getDisplayedAttack(enemy)}`}
        {enemy.intent.type === 'defend' && `🛡 ${enemy.intent.value}`}
        {enemy.intent.type === 'buff' && `⬆️`}
      </div>
      <div className={styles.characterSprite}>
        <img className={styles.characterImage} src={enemyImage} alt={enemy.name} />
        <FloatingNumber currentValue={enemy.hp} previousValue={prevHp} mode="damage" />
      </div>
      <div className={styles.enemyName}>{enemy.name}</div>
      <HealthBar hp={enemy.hp} maxHp={enemy.maxHp} block={enemy.block} />
      {enemy.statusEffects.length > 0 && (
        <div className={styles.statusEffects}>
          {enemy.statusEffects.map((effect, i) => (
            <StatusBadge key={i} effect={effect} />
          ))}
        </div>
      )}
    </div>
  );
}
