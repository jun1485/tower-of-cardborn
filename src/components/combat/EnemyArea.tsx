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
  readonly selectedEnemyId: string | null;
  readonly hoveredEnemyId: string | null;
  readonly lungingEnemyIds: readonly string[];
  readonly targetSelectable: boolean;
  readonly targetingActive: boolean;
  readonly onSelectEnemy: (enemyId: string) => void;
}

const ENEMY_IMAGE: Record<string, string> = {
  jaw_worm: '/assets/monsters/jaw_worm_hd.webp?v=7',
  cultist: '/assets/monsters/cultist_hd.webp?v=7',
  louse_red: '/assets/monsters/louse_red_hd.webp?v=7',
  fungi_beast: '/assets/monsters/fungi_beast_hd.webp?v=7',
  gremlin_nob: '/assets/monsters/gremlin_nob_hd.webp?v=7',
  lagavulin: '/assets/monsters/lagavulin_hd.webp?v=7',
  slime_boss: '/assets/monsters/slime_boss_hd.webp?v=7',
};

export function EnemyArea({
  enemies,
  selectedEnemyId,
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
          selected={selectedEnemyId === enemy.id}
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
  const strength = enemy.statusEffects.find((status) => status.type === 'strength')?.duration ?? 0;
  const isWeak = enemy.statusEffects.some((s) => s.type === 'weak' && s.duration > 0);
  const damage = enemy.intent.value + strength;
  return isWeak ? Math.floor(damage * 0.75) : damage;
}

interface EnemyCardProps {
  readonly enemy: Enemy;
  readonly selected: boolean;
  readonly hovered: boolean;
  readonly isLunging: boolean;
  readonly targetSelectable: boolean;
  readonly targetingActive: boolean;
  readonly onSelectEnemy: (enemyId: string) => void;
}

function EnemyCard({
  enemy,
  selected,
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
  const enemyImage = ENEMY_IMAGE[enemy.definitionId] ?? '/assets/monsters/jaw_worm_hd.webp?v=7';
  const localizedName = getEnemyName(enemy.definitionId, lang);
  const intentLabel = enemy.intent.type === 'attack'
    ? `${t('intentAttack')} ${getDisplayedAttack(enemy)}`
    : enemy.intent.type === 'defend'
      ? `${t('intentDefend')} ${enemy.intent.value}`
      : enemy.intent.type === 'buff'
        ? `${t('intentBuff')} ${enemy.intent.value}`
        : `${t('intentDebuff')} ${enemy.intent.statusType === 'vulnerable' ? t('vulnerable') : t('weak')} ${enemy.intent.value}`;
  const enemySpriteClassName = `${styles.characterSprite} ${styles.enemySprite}`;
  const enemyImageClassName = `${styles.characterImage} ${styles.enemyImage}`;
  const className = [
    styles.enemyCard,
    isHit ? styles.shake : '',
    isLunging ? styles.enemyLunge : '',
    targetingActive ? styles.enemyDraggable : '',
    targetingActive && hovered ? styles.enemyDropTarget : '',
    targetSelectable ? styles.enemyTargetable : '',
    targetSelectable && selected ? styles.enemySelected : '',
  ].join(' ');

  return (
    <div
      className={className}
      data-enemy-id={enemy.id}
      role={targetSelectable ? 'button' : undefined}
      tabIndex={targetSelectable ? 0 : undefined}
      aria-pressed={targetSelectable ? selected : undefined}
      aria-label={targetSelectable ? `${localizedName}, ${enemy.hp}/${enemy.maxHp}, ${intentLabel}` : undefined}
      onClick={() => targetSelectable && onSelectEnemy(enemy.id)}
      onKeyDown={(event) => {
        if (!targetSelectable || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        onSelectEnemy(enemy.id);
      }}
    >
      {/* 드래그 조준 배지 우선, 미조준 시 선택 타겟 배지 표시 */}
      {targetingActive && hovered && <div className={styles.enemyDropTargetBadge}>🎯</div>}
      {targetSelectable && selected && !(targetingActive && hovered) && (
        <div className={styles.enemyTargetBadge}>🎯</div>
      )}
      <div className={styles.enemyIntent} aria-label={intentLabel}>
        {enemy.intent.type === 'attack' && `⚔️ ${getDisplayedAttack(enemy)}`}
        {enemy.intent.type === 'defend' && `🛡 ${enemy.intent.value}`}
        {enemy.intent.type === 'buff' && `⬆️ ${enemy.intent.value}`}
        {enemy.intent.type === 'debuff' && `${enemy.intent.statusType === 'vulnerable' ? '💥' : '🔻'} ${enemy.intent.value}`}
      </div>
      <div className={enemySpriteClassName}>
        <img className={enemyImageClassName} src={enemyImage} alt={localizedName} decoding="async" />
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
