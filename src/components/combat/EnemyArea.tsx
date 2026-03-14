// 적 표시 + 데미지 피드백 컴포넌트

import type { Enemy } from '@tower-of-cardborn/game-core/types/character';
import { useTranslation, useLanguage } from '../../i18n';
import { getEnemyName } from '../../i18n/card-text';
import { HealthBar } from '../ui/HealthBar';
import { FloatingNumber } from '../ui/FloatingNumber';
import { StatusBadge } from '../ui/StatusBadge';
import { usePrevious } from '../../hooks/use-previous';
import styles from '../../styles/combat.module.css';

interface EnemyAreaProps {
  readonly enemies: readonly Enemy[];
  readonly hoveredEnemyId: string | null;
  readonly lungingEnemyIds: readonly string[];
  readonly targetSelectable: boolean;
  readonly targetingActive: boolean;
  readonly onSelectEnemy: (enemyId: string) => void;
}

const ENEMY_IMAGE: Record<string, string> = {
  jaw_worm: '/assets/monsters/jaw_worm_hd.png?v=6',
  cultist: '/assets/monsters/cultist_hd.png?v=6',
  louse_red: '/assets/monsters/louse_red_hd.png?v=6',
  fungi_beast: '/assets/monsters/fungi_beast_hd.png?v=6',
  gremlin_nob: '/assets/monsters/gremlin_nob_hd.png?v=6',
  lagavulin: '/assets/monsters/lagavulin_hd.png?v=6',
  slime_boss: '/assets/monsters/slime_boss_hd.png?v=6',
};

export function EnemyArea({
  enemies,
  hoveredEnemyId,
  lungingEnemyIds,
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
          hovered={hoveredEnemyId === enemy.id}
          isLunging={lungingEnemyIds.includes(enemy.id)}
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
  readonly hovered: boolean;
  readonly isLunging: boolean;
  readonly targetSelectable: boolean;
  readonly targetingActive: boolean;
  readonly onSelectEnemy: (enemyId: string) => void;
}

function EnemyCard({
  enemy,
  hovered,
  isLunging,
  targetSelectable,
  targetingActive,
  onSelectEnemy,
}: EnemyCardProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const prevHp = usePrevious(enemy.hp);
  const isHit = prevHp > enemy.hp;
  const enemyImage = ENEMY_IMAGE[enemy.definitionId] ?? '/assets/monsters/jaw_worm_hd.png?v=6';
  const localizedName = getEnemyName(enemy.definitionId, lang);
  const enemySpriteClassName = `${styles.characterSprite} ${styles.enemySprite}`;
  const enemyImageClassName = `${styles.characterImage} ${styles.enemyImage}`;
  const className = [
    styles.enemyCard,
    isHit ? styles.shake : '',
    isLunging ? styles.enemyLunge : '',
    targetingActive ? styles.enemyDraggable : '',
    targetingActive && hovered ? styles.enemyDropTarget : '',
    targetSelectable ? styles.enemyTargetable : '',
  ].join(' ');

  return (
    <div
      className={className}
      data-enemy-id={enemy.id}
      onClick={() => targetSelectable && onSelectEnemy(enemy.id)}
    >
      {targetingActive && hovered && <div className={styles.enemyDropTargetBadge}>🎯</div>}
      <div className={styles.enemyIntent}>
        {enemy.intent.type === 'attack' && `⚔️ ${getDisplayedAttack(enemy)}`}
        {enemy.intent.type === 'defend' && `🛡 ${enemy.intent.value}`}
        {enemy.intent.type === 'buff' && `⬆️`}
      </div>
      <div className={enemySpriteClassName}>
        <img className={enemyImageClassName} src={enemyImage} alt={localizedName} />
        <FloatingNumber currentValue={enemy.hp} previousValue={prevHp} mode="damage" />
      </div>
      <div className={`${styles.combatantPanel} ${styles.enemyPanel}`}>
        <div className={styles.combatantHeader}>
          <span className={styles.combatantLabel}>{t('enemy')}</span>
          <strong className={`${styles.combatantName} ${styles.enemyName}`}>{localizedName}</strong>
        </div>
        <HealthBar hp={enemy.hp} maxHp={enemy.maxHp} block={enemy.block} />
        {enemy.statusEffects.length > 0 && (
          <div className={styles.statusEffects}>
            {enemy.statusEffects.map((effect, i) => (
              <StatusBadge key={i} effect={effect} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
