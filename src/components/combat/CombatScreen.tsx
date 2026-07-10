// 전투 화면 컨테이너 (드래그 카드 사용 + 공격 연출 + 파일 뷰어)

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CombatState } from '@tower-of-cardborn/game-core/types/combat';
import type { CardDefinition, CardInstance } from '@tower-of-cardborn/game-core/types/card';
import type { CharacterClass } from '@tower-of-cardborn/game-core/types/game';
import { CARD_DEFINITIONS } from '@tower-of-cardborn/game-core/data/cards';
import { useTranslation, useLanguage } from '../../i18n';
import { getCardName, getCardTypeName, generatePreviewDescription } from '../../i18n/card-text';
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
function groupDrawPile(drawPile: readonly CardInstance[], lang: import('../../i18n/types').Language): string[] {
  const counts = new Map<string, number>();
  for (const card of drawPile) {
    const def = CARD_DEFINITIONS[card.definitionId];
    const name = def ? getCardName(def.id, lang) : card.definitionId;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([name, count]) => `${name} x${count}`);
}

export function CombatScreen({ combat, characterClass, onPlayCard, onEndTurn }: CombatScreenProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const [drag, setDrag] = useState<DragState | null>(null);
  const [attacking, setAttacking] = useState(false);
  const [lungingEnemyIds, setLungingEnemyIds] = useState<readonly string[]>([]);
  const [selectedEnemyId, setSelectedEnemyId] = useState<string | null>(combat.enemies[0]?.id ?? null);
  const [hoveredEnemyId, setHoveredEnemyId] = useState<string | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const bottomAreaRef = useRef<HTMLDivElement>(null);
  const [viewingPile, setViewingPile] = useState<PileType>(null);
  const endTurnLockRef = useRef(false);

  /** 적 공격 돌진 애니메이션 후 실제 턴 종료 처리 */
  const handleEndTurnWithAnimation = useCallback(() => {
    if (endTurnLockRef.current) return;
    const attackerIds = combat.enemies
      .filter((e) => e.intent.type === 'attack')
      .map((e) => e.id);

    if (attackerIds.length > 0) {
      endTurnLockRef.current = true;
      setLungingEnemyIds(attackerIds);
      setTimeout(() => {
        setLungingEnemyIds([]);
        onEndTurn();
        endTurnLockRef.current = false;
      }, 350);
    } else {
      onEndTurn();
    }
  }, [combat.enemies, onEndTurn]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA') return;
      e.preventDefault();
      handleEndTurnWithAnimation();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleEndTurnWithAnimation]);

  // #region 적 타겟 선택 보정
  // 선택/호버 대상 사망 시 생존 적 기준 파생 보정
  const aliveSelectedEnemyId = combat.enemies.some((enemy) => enemy.id === selectedEnemyId)
    ? selectedEnemyId
    : combat.enemies[0]?.id ?? null;
  const aliveHoveredEnemyId = combat.enemies.some((enemy) => enemy.id === hoveredEnemyId)
    ? hoveredEnemyId
    : null;
  // #endregion

  // #region 드래그 시작/이동/종료
  const handleDragStart = useCallback((instanceId: string, x: number, y: number, pointerId: number) => {
    const state: DragState = { instanceId, x, y, startX: x, startY: y };
    setDrag(state);
    dragRef.current = state;
    dragPointerIdRef.current = pointerId;
    // 전체 화면에 포인터 캡처 설정 (터치 드래그 중 pointercancel 방지)
    screenRef.current?.setPointerCapture(pointerId);
  }, []);

  const isDragging = drag !== null;

  useEffect(() => {
    if (!isDragging) return;

    const clearDragState = () => {
      if (dragPointerIdRef.current != null && screenRef.current) {
        try { screenRef.current.releasePointerCapture(dragPointerIdRef.current); } catch { /* 이미 해제됨 */ }
      }
      dragPointerIdRef.current = null;
      setDrag(null);
      setHoveredEnemyId(null);
      dragRef.current = null;
    };

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
          clearDragState();
          return;
        }
        const pointTargetEnemyId = resolveEnemyIdFromPoint(e.clientX, e.clientY);
        const fallbackEnemyId = aliveSelectedEnemyId ?? combat.enemies[0].id;
        const targetEnemyId = pointTargetEnemyId ?? aliveHoveredEnemyId ?? fallbackEnemyId;
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

      clearDragState();
    };

    const handlePointerCancel = () => {
      clearDragState();
    };

    const el = screenRef.current ?? window;
    el.addEventListener('pointermove', handlePointerMove as EventListener);
    el.addEventListener('pointerup', handlePointerUp as EventListener);
    el.addEventListener('pointercancel', handlePointerCancel as EventListener);
    return () => {
      el.removeEventListener('pointermove', handlePointerMove as EventListener);
      el.removeEventListener('pointerup', handlePointerUp as EventListener);
      el.removeEventListener('pointercancel', handlePointerCancel as EventListener);
    };
  }, [isDragging, combat.enemies, combat.hand, onPlayCard, aliveSelectedEnemyId, aliveHoveredEnemyId]);
  // #endregion

  // 드래그 중인 카드 정의
  const draggedCard = drag
    ? combat.hand.find((c) => c.instanceId === drag.instanceId)
    : null;
  const draggedDef = draggedCard ? CARD_DEFINITIONS[draggedCard.definitionId] : null;
  const draggedDescription = draggedDef
    ? generatePreviewDescription(draggedDef, t, combat.player.statusEffects, combat.enemies, aliveSelectedEnemyId ?? undefined)
    : '';

  const getPileData = (): { title: string; pile: readonly CardInstance[] } => {
    switch (viewingPile) {
      case 'draw': return { title: t('drawPile'), pile: combat.drawPile };
      case 'discard': return { title: t('discardPile'), pile: combat.discardPile };
      case 'exhaust': return { title: t('exhaustPile'), pile: combat.exhaustPile };
      default: return { title: '', pile: [] };
    }
  };

  const targetSelectable = combat.enemies.length > 1;
  const targetingActive = drag ? hasSingleTargetEffect(draggedDef) : false;
  const typeMap = { attack: cardStyles.cardAttack, skill: cardStyles.cardSkill, power: cardStyles.cardPower };

  return (
    <div className={styles.combatScreen} ref={screenRef} style={drag ? { touchAction: 'none' } : undefined}>
      <div className={styles.topSection}>
        <div className={styles.topInfo}>
          <div className={`${styles.infoChip} ${styles.infoChipPrimary}`}>
            <span className={styles.infoChipLabel}>{t('turn')}</span>
            <strong className={styles.infoChipValue}>{combat.turn}</strong>
          </div>
        </div>
      </div>

      <div className={styles.battlefield}>
        <PlayerArea player={combat.player} isAttacking={attacking} characterClass={characterClass} />
        <EnemyArea
          enemies={combat.enemies}
          selectedEnemyId={aliveSelectedEnemyId}
          hoveredEnemyId={aliveHoveredEnemyId}
          lungingEnemyIds={lungingEnemyIds}
          targetSelectable={targetSelectable}
          targetingActive={targetingActive}
          onSelectEnemy={setSelectedEnemyId}
        />
      </div>

      <div className={styles.bottomSection} ref={bottomAreaRef}>
        <button className={styles.deckIndicator} onClick={() => setViewingPile('draw')}>
          <img className={styles.deckIcon} src="/assets/ui/deck.png" alt={t('deck')} />
          <strong className={styles.utilityCount}>{combat.drawPile.length}</strong>
          <div className={styles.deckTooltip}>
            {combat.drawPile.length === 0
              ? <span>{t('noCards')}</span>
              : groupDrawPile(combat.drawPile, lang).map((line) => (
                  <div key={line}>{line}</div>
                ))
            }
          </div>
        </button>

        <EnergyDisplay energy={combat.player.energy} maxEnergy={combat.player.maxEnergy} />

        <HandArea
          hand={combat.hand}
          energy={combat.player.energy}
          playerStatusEffects={combat.player.statusEffects}
          enemies={combat.enemies}
          targetEnemyId={aliveSelectedEnemyId ?? undefined}
          draggingInstanceId={drag?.instanceId ?? null}
          onDragStart={handleDragStart}
        />

        <button className={styles.endTurnBtn} onClick={handleEndTurnWithAnimation}>
          {t('endTurn')}
        </button>

        <div className={styles.pileBtnGroup}>
          <button className={styles.pileBtn} onClick={() => setViewingPile('discard')}>
            <strong className={styles.utilityCount}>{combat.discardPile.length}</strong>
          </button>
          <button className={styles.pileBtn} onClick={() => setViewingPile('exhaust')}>
            <strong className={styles.utilityCount}>{combat.exhaustPile.length}</strong>
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
          <div className={cardStyles.cardName}>{getCardName(draggedDef.id, lang)}</div>
          <CardArtwork cardId={draggedDef.id} cardName={getCardName(draggedDef.id, lang)} />
          <div className={cardStyles.cardDescription}>{draggedDescription}</div>
          <div className={cardStyles.cardType}>{getCardTypeName(draggedDef.type, t)}</div>
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
