// 적 표시 + 데미지 피드백 컴포넌트

import { memo, useEffect, useRef, useState } from 'react';
import type { Enemy } from '@tower-of-cardborn/game-core/types/character';
import { COMBAT_BALANCE } from '@tower-of-cardborn/game-core/data/balance';
import { useTranslation, useLanguage } from '../../i18n';
import { getEnemyName } from '../../i18n/card-text';
import { HealthBar } from '../ui/HealthBar';
import { FloatingNumber } from '../ui/FloatingNumber';
import { StatusBadge } from '../ui/StatusBadge';
import { usePrevious } from '../../hooks/use-previous';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import styles from '../../styles/combat.module.css';

/** 사망 잔상 유지 시간 (ms) */
const DEATH_GHOST_DURATION = 600;

interface EnemyAreaProps {
  readonly enemies: readonly Enemy[];
  readonly playerVulnerable: boolean;
  readonly selectedEnemyId: string | null;
  readonly hoveredEnemyId: string | null;
  readonly lungingEnemyIds: readonly string[];
  readonly targetSelectable: boolean;
  readonly targetingActive: boolean;
  readonly onSelectEnemy: (enemyId: string) => void;
}

const ENEMY_IMAGE: Record<string, string> = {
  jaw_worm: '/assets/monsters/jaw_worm-v2.webp',
  cultist: '/assets/monsters/cultist-v2.webp',
  louse_red: '/assets/monsters/louse_red-v2.webp',
  fungi_beast: '/assets/monsters/fungi_beast-v2.webp',
  stone_sentinel: '/assets/monsters/stone_sentinel-v2.webp',
  crystal_crawler: '/assets/monsters/crystal_crawler-v2.webp',
  temple_acolyte: '/assets/monsters/temple_acolyte-v2.webp',
  void_wisp: '/assets/monsters/void_wisp-v2.webp',
  void_husk: '/assets/monsters/void_husk-v2.webp',
  abyss_watcher: '/assets/monsters/abyss_watcher-v2.webp',
  gremlin_nob: '/assets/monsters/gremlin_nob-v2.webp',
  lagavulin: '/assets/monsters/lagavulin-v2.webp',
  arcane_golem: '/assets/monsters/arcane_golem-v2.webp',
  obsidian_knight: '/assets/monsters/obsidian_knight-v2.webp',
  void_reaper: '/assets/monsters/void_reaper-v2.webp',
  plague_herald: '/assets/monsters/plague_herald-v2.webp',
  slime_boss: '/assets/monsters/slime_boss-v2.webp',
  gremlin_king: '/assets/monsters/gremlin_king-v2.webp',
  stone_guardian: '/assets/monsters/stone_guardian-v2.webp',
  crystal_hydra: '/assets/monsters/crystal_hydra-v2.webp',
  tower_heart: '/assets/monsters/tower_heart-v2.webp',
};

const BOSS_IDS = new Set([
  'slime_boss',
  'gremlin_king',
  'stone_guardian',
  'crystal_hydra',
  'tower_heart',
]);

/** 인텐트 디버프 상태별 아이콘 */
const DEBUFF_ICONS: Record<string, string> = {
  vulnerable: '💥',
  weak: '🔻',
  poison: '☠️',
  frail: '🕸️',
};

export function EnemyArea({
  enemies,
  playerVulnerable,
  selectedEnemyId,
  hoveredEnemyId,
  lungingEnemyIds,
  targetSelectable,
  targetingActive,
  onSelectEnemy,
}: EnemyAreaProps) {
  const reducedMotion = useReducedMotion();
  const previousEnemiesRef = useRef(enemies);
  const ghostTimersRef = useRef(new Set<number>());
  const ghostFramesRef = useRef(new Set<number>());
  const [dyingEnemies, setDyingEnemies] = useState<readonly Enemy[]>([]);

  // 처치된 적 잔상 유지 (사망 연출 후 제거)
  useEffect(() => {
    const previous = previousEnemiesRef.current;
    previousEnemiesRef.current = enemies;
    if (reducedMotion) return;
    const aliveIds = new Set(enemies.map((enemy) => enemy.id));
    const killed = previous.filter((enemy) => !aliveIds.has(enemy.id));
    if (killed.length === 0) return;
    const killedIds = new Set(killed.map((enemy) => enemy.id));
    const frame = window.requestAnimationFrame(() => {
      ghostFramesRef.current.delete(frame);
      setDyingEnemies((current) => [
        ...current.filter((enemy) => !killedIds.has(enemy.id)),
        ...killed.map((enemy) => ({ ...enemy, hp: 0 })),
      ]);
    });
    ghostFramesRef.current.add(frame);
    // 완료 타이머는 목록에서 제거 (전투 중 누적 방지)
    const timer = window.setTimeout(() => {
      ghostTimersRef.current.delete(timer);
      setDyingEnemies((current) => current.filter((enemy) => !killedIds.has(enemy.id)));
    }, DEATH_GHOST_DURATION);
    ghostTimersRef.current.add(timer);
  }, [enemies, reducedMotion]);

  // 잔상 프레임·타이머 일괄 정리
  useEffect(() => {
    const timers = ghostTimersRef.current;
    const frames = ghostFramesRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      frames.forEach((frame) => window.cancelAnimationFrame(frame));
    };
  }, []);

  return (
    <div className={styles.enemyArea}>
      {enemies.map((enemy) => (
        <EnemyCard
          key={enemy.id}
          enemy={enemy}
          playerVulnerable={playerVulnerable}
          selected={selectedEnemyId === enemy.id}
          hovered={hoveredEnemyId === enemy.id}
          isLunging={lungingEnemyIds.includes(enemy.id)}
          targetSelectable={targetSelectable}
          targetingActive={targetingActive}
          onSelectEnemy={onSelectEnemy}
        />
      ))}
      {dyingEnemies.map((enemy) => (
        <EnemyCard
          key={`dying-${enemy.id}`}
          enemy={enemy}
          playerVulnerable={playerVulnerable}
          selected={false}
          hovered={false}
          isLunging={false}
          targetSelectable={false}
          targetingActive={false}
          isDying
          onSelectEnemy={onSelectEnemy}
        />
      ))}
    </div>
  );
}

/** 공격 예고 데미지 계산 */
function getDisplayedAttack(enemy: Enemy, playerVulnerable: boolean): number {
  const strength = enemy.statusEffects.find((status) => status.type === 'strength')?.duration ?? 0;
  const isWeak = enemy.statusEffects.some((s) => s.type === 'weak' && s.duration > 0);
  const weakenedDamage = isWeak
    ? Math.floor((enemy.intent.value + strength) * COMBAT_BALANCE.weakMultiplier)
    : enemy.intent.value + strength;
  return playerVulnerable
    ? Math.floor(weakenedDamage * COMBAT_BALANCE.vulnerableMultiplier)
    : weakenedDamage;
}

interface EnemyCardProps {
  readonly enemy: Enemy;
  readonly playerVulnerable: boolean;
  readonly selected: boolean;
  readonly hovered: boolean;
  readonly isLunging: boolean;
  readonly targetSelectable: boolean;
  readonly targetingActive: boolean;
  /** 사망 잔상 표시 여부 */
  readonly isDying?: boolean;
  readonly onSelectEnemy: (enemyId: string) => void;
}

const EnemyCard = memo(function EnemyCard({
  enemy,
  playerVulnerable,
  selected,
  hovered,
  isLunging,
  targetSelectable,
  targetingActive,
  isDying = false,
  onSelectEnemy,
}: EnemyCardProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const prevHp = usePrevious(enemy.hp);
  const isHit = prevHp > enemy.hp;
  const enemyImage = ENEMY_IMAGE[enemy.definitionId] ?? '/assets/monsters/jaw_worm-v2.webp';
  const localizedName = getEnemyName(enemy.definitionId, lang);
  const debuffStatusType = enemy.intent.statusType ?? 'weak';
  const intentLabel = enemy.intent.type === 'attack'
    ? `${t('intentAttack')} ${getDisplayedAttack(enemy, playerVulnerable)}`
    : enemy.intent.type === 'defend'
      ? `${t('intentDefend')} ${enemy.intent.value}`
      : enemy.intent.type === 'buff'
        ? `${t('intentBuff')} ${enemy.intent.value}`
        : `${t('intentDebuff')} ${t(debuffStatusType)} ${enemy.intent.value}`;
  const enemySpriteClassName = `${styles.characterSprite} ${styles.enemySprite}`;
  const enemyImageClassName = [
    styles.characterImage,
    styles.enemyImage,
    BOSS_IDS.has(enemy.definitionId) ? styles.bossImage : '',
  ].join(' ');
  const className = [
    styles.enemyCard,
    isDying ? styles.enemyDying : '',
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
      data-enemy-id={isDying ? undefined : enemy.id}
      aria-hidden={isDying || undefined}
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
        {enemy.intent.type === 'attack' && `⚔️ ${getDisplayedAttack(enemy, playerVulnerable)}`}
        {enemy.intent.type === 'defend' && `🛡 ${enemy.intent.value}`}
        {enemy.intent.type === 'buff' && `⬆️ ${enemy.intent.value}`}
        {enemy.intent.type === 'debuff' && `${DEBUFF_ICONS[debuffStatusType] ?? '🔻'} ${enemy.intent.value}`}
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
});
