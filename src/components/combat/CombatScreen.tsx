// 전투 화면 컨테이너 (드래그 카드 사용 + 공격 연출 + 파일 뷰어)

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CombatState } from '../../types/combat';
import type { CardDefinition, CardInstance } from '../../types/card';
import type { CharacterClass } from '../../types/game';
import { CARD_DEFINITIONS } from '../../data/cards';
import { getPreviewDescription } from '../../game/damage-preview';
import { PlayerArea } from './PlayerArea';
import { EnemyArea } from './EnemyArea';
import { HandArea } from './HandArea';
import { EnergyDisplay } from './EnergyDisplay';
import { PileViewer } from './PileViewer';
import styles from '../../styles/combat.module.css';
import cardStyles from '../../styles/card.module.css';
import { CardArtwork } from '../card/CardArtwork';

interface CombatScreenProps {
  readonly combat: CombatState;
  readonly characterClass: CharacterClass;
  readonly onPlayCard: (cardInstanceId: string, targetEnemyId?: string) => void;
  readonly onEndTurn: () => void;
}

interface DragState {
  readonly instanceId: string;
  readonly x: number;
  readonly y: number;
  readonly startX: number;
  readonly startY: number;
}

type PileType = 'draw' | 'discard' | 'exhaust' | null;

function isInsideBottomArea(y: number, bottomAreaEl: HTMLElement | null): boolean {
  if (!bottomAreaEl) return false;
  const rect = bottomAreaEl.getBoundingClientRect();
  return y >= rect.top;
}

function hasSingleTargetEffect(definition: CardDefinition | null): boolean {
  if (!definition) return false;
  return definition.effects.some((effect) => effect.target === 'single');
}

function resolveEnemyIdFromPoint(x: number, y: number): string | null {
  const hoveredElement = document.elementFromPoint(x, y);
  if (!hoveredElement) return null;
  const enemyElement = hoveredElement.closest('[data-enemy-id]');
  if (!(enemyElement instanceof HTMLElement)) return null;
  const enemyId = enemyElement.dataset.enemyId;
  return enemyId ?? null;
}

/** 드로우 파일 카드 이름별 그룹핑 (툴팁 표시용) */
function groupDrawPile(drawPile: readonly CardInstance[]): string[] {
  const counts = new Map<string, number>();
  for (const card of drawPile) {
    const def = CARD_DEFINITIONS[card.definitionId];
    const name = def?.name ?? card.definitionId;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([name, count]) => `${name} x${count}`);
}

export function CombatScreen({ combat, characterClass, onPlayCard, onEndTurn }: CombatScreenProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [attacking, setAttacking] = useState(false);
  const [selectedEnemyId, setSelectedEnemyId] = useState<string | null>(combat.enemies[0]?.id ?? null);
  const [hoveredEnemyId, setHoveredEnemyId] = useState<string | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const bottomAreaRef = useRef<HTMLDivElement>(null);
  const [viewingPile, setViewingPile] = useState<PileType>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA') return;
      e.preventDefault();
      onEndTurn();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onEndTurn]);

  // #region 적 타겟 선택 동기화
  useEffect(() => {
    if (combat.enemies.length === 0) {
      setSelectedEnemyId(null);
      setHoveredEnemyId(null);
      return;
    }

    const selectedAlive = selectedEnemyId && combat.enemies.some((enemy) => enemy.id === selectedEnemyId);
    if (!selectedAlive) {
      setSelectedEnemyId(combat.enemies[0].id);
    }

    const hoveredAlive = hoveredEnemyId && combat.enemies.some((enemy) => enemy.id === hoveredEnemyId);
    if (!hoveredAlive) {
      setHoveredEnemyId(null);
    }
  }, [combat.enemies, selectedEnemyId, hoveredEnemyId]);
  // #endregion

  // #region 드래그 시작/이동/종료
  const handleDragStart = useCallback((instanceId: string, x: number, y: number) => {
    const state: DragState = { instanceId, x, y, startX: x, startY: y };
    setDrag(state);
    dragRef.current = state;
  }, []);

  useEffect(() => {
    if (!drag) return;

    const handlePointerMove = (e: PointerEvent) => {
      const next: DragState = { ...dragRef.current!, x: e.clientX, y: e.clientY };
      dragRef.current = next;
      setDrag(next);

      const card = combat.hand.find((handCard) => handCard.instanceId === next.instanceId);
      const definition = card ? CARD_DEFINITIONS[card.definitionId] : null;
      if (!hasSingleTargetEffect(definition)) {
        setHoveredEnemyId(null);
        return;
      }

      setHoveredEnemyId(resolveEnemyIdFromPoint(e.clientX, e.clientY));
    };

    const handlePointerUp = (e: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;

      const droppedInsideHand = isInsideBottomArea(e.clientY, bottomAreaRef.current);

      if (!droppedInsideHand && combat.enemies.length > 0) {
        const card = combat.hand.find((c) => c.instanceId === current.instanceId);
        const def = card ? CARD_DEFINITIONS[card.definitionId] : null;
        if (!def) {
          setDrag(null);
          setHoveredEnemyId(null);
          dragRef.current = null;
          return;
        }
        const pointTargetEnemyId = resolveEnemyIdFromPoint(e.clientX, e.clientY);
        const fallbackEnemyId = selectedEnemyId ?? combat.enemies[0].id;
        const targetEnemyId = pointTargetEnemyId ?? hoveredEnemyId ?? fallbackEnemyId;
        const singleTarget = hasSingleTargetEffect(def);

        if (def.type === 'attack') {
          // 공격 카드 → 즉시 카드 사용 후 돌진 애니메이션만 유지
          setAttacking(true);
          onPlayCard(current.instanceId, singleTarget ? targetEnemyId : undefined);
          setTimeout(() => {
            setAttacking(false);
          }, 200);
        } else {
          // 스킬/파워 → 즉시 사용
          onPlayCard(current.instanceId, singleTarget ? targetEnemyId : undefined);
        }
      }

      setDrag(null);
      setHoveredEnemyId(null);
      dragRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [drag !== null, combat.enemies, combat.hand, onPlayCard, selectedEnemyId, hoveredEnemyId]);
  // #endregion

  // 드래그 중인 카드 정의
  const draggedCard = drag
    ? combat.hand.find((c) => c.instanceId === drag.instanceId)
    : null;
  const draggedDef = draggedCard ? CARD_DEFINITIONS[draggedCard.definitionId] : null;
  const draggedDescription = draggedDef
    ? getPreviewDescription(draggedDef, combat.player.statusEffects, combat.enemies, selectedEnemyId ?? undefined)
    : '';

  const getPileData = (): { title: string; pile: readonly CardInstance[] } => {
    switch (viewingPile) {
      case 'draw': return { title: '뽑을 카드', pile: combat.drawPile };
      case 'discard': return { title: '버린 카드', pile: combat.discardPile };
      case 'exhaust': return { title: '소멸 카드', pile: combat.exhaustPile };
      default: return { title: '', pile: [] };
    }
  };

  const targetSelectable = combat.enemies.length > 1;
  const targetingActive = drag ? hasSingleTargetEffect(draggedDef) : false;
  const selectedEnemyName = selectedEnemyId
    ? combat.enemies.find((enemy) => enemy.id === selectedEnemyId)?.name ?? '-'
    : '-';

  const typeMap = { attack: cardStyles.cardAttack, skill: cardStyles.cardSkill, power: cardStyles.cardPower };

  return (
    <div className={styles.combatScreen}>
      <div className={styles.topInfo}>
        <span>턴 {combat.turn}</span>
        {targetSelectable && <span>타겟: {selectedEnemyName}</span>}
        <button className={styles.pileBtn} onClick={() => setViewingPile('discard')}>
          버린 카드: {combat.discardPile.length}
        </button>
        <button className={styles.pileBtn} onClick={() => setViewingPile('exhaust')}>
          소멸: {combat.exhaustPile.length}
        </button>
      </div>

      <div className={styles.battlefield}>
        <PlayerArea player={combat.player} isAttacking={attacking} characterClass={characterClass} />
        <EnemyArea
          enemies={combat.enemies}
          selectedEnemyId={selectedEnemyId}
          hoveredEnemyId={hoveredEnemyId}
          targetSelectable={targetSelectable}
          targetingActive={targetingActive}
          onSelectEnemy={setSelectedEnemyId}
        />
      </div>

      <div className={styles.bottomSection}>
        <button className={styles.deckIndicator} onClick={() => setViewingPile('draw')}>
          <img className={styles.deckIcon} src="/assets/ui/deck.png" alt="덱" />
          <span className={styles.deckCount}>{combat.drawPile.length}</span>
          <div className={styles.deckTooltip}>
            {combat.drawPile.length === 0
              ? <span>카드 없음</span>
              : groupDrawPile(combat.drawPile).map((line) => (
                  <div key={line}>{line}</div>
                ))
            }
          </div>
        </button>
        <div className={styles.bottomArea} ref={bottomAreaRef}>
          <EnergyDisplay energy={combat.player.energy} maxEnergy={combat.player.maxEnergy} />
          <HandArea
            hand={combat.hand}
            energy={combat.player.energy}
            playerStatusEffects={combat.player.statusEffects}
            enemies={combat.enemies}
            targetEnemyId={selectedEnemyId ?? undefined}
            draggingInstanceId={drag?.instanceId ?? null}
            onDragStart={handleDragStart}
          />
          <button className={styles.endTurnBtn} onClick={onEndTurn}>
            턴 종료
          </button>
        </div>
      </div>

      {/* 드래그 고스트 카드 */}
      {drag && draggedDef && (
        <div
          className={`${cardStyles.card} ${cardStyles.cardGhost} ${typeMap[draggedDef.type]}`}
          style={{ left: drag.x, top: drag.y }}
        >
          <div className={cardStyles.cardCost}>{draggedDef.cost}</div>
          <div className={cardStyles.cardName}>{draggedDef.name}</div>
          <CardArtwork cardId={draggedDef.id} cardName={draggedDef.name} />
          <div className={cardStyles.cardDescription}>{draggedDescription}</div>
          <div className={cardStyles.cardType}>{draggedDef.type}</div>
        </div>
      )}

      {viewingPile && (
        <PileViewer
          title={getPileData().title}
          pile={getPileData().pile}
          onClose={() => setViewingPile(null)}
        />
      )}
    </div>
  );
}
