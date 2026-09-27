// 전투 화면 컨테이너 (드래그 카드 사용 + 공격 연출 + 파일 뷰어)

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CombatState, PlayerPower } from '@tower-of-cardborn/game-core/types/combat';
import type { CardDefinition, CardInstance } from '@tower-of-cardborn/game-core/types/card';
import type { CharacterClass } from '@tower-of-cardborn/game-core/types/game';
import { CARD_DEFINITIONS, getCardRarity } from '@tower-of-cardborn/game-core/data/cards';
import { useTranslation, useLanguage } from '../../i18n';
import { getCardName, getCardRarityName, getCardTypeName, generatePreviewDescription } from '../../i18n/card-text';
import { PlayerArea } from './PlayerArea';
import { EnemyArea } from './EnemyArea';
import { HandArea } from './HandArea';
import { EnergyDisplay } from './EnergyDisplay';
import { PileViewer } from './PileViewer';
import styles from '../../styles/combat.module.css';
import cardStyles from '../../styles/card.module.css';
import { CardArtwork } from '../card/CardArtwork';
import { getCardTypeClass } from '../card/card-type-class';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { POTION_DEFINITIONS, TARGETED_POTION_IDS } from '@tower-of-cardborn/game-core/data/potions';
import type { PotionId } from '@tower-of-cardborn/game-core/types/potion';
import { getPotionDescription, getPotionName } from '../../i18n/potion-text';
import { playSfx } from '../../utils/sound';

interface CombatScreenProps {
  readonly combat: CombatState;
  readonly characterClass: CharacterClass;
  readonly onPlayCard: (cardInstanceId: string, targetEnemyId?: string) => void;
  readonly onEndTurn: () => void;
  readonly potions: readonly PotionId[];
  readonly onUsePotion: (potionIndex: number, targetEnemyId?: string) => void;
  readonly onOverlayChange: (open: boolean) => void;
}

interface DragState {
  readonly instanceId: string;
  readonly singleTarget: boolean;
  /** 고스트 카드 초기 표시 좌표 */
  readonly startX: number;
  readonly startY: number;
}

/** 파워 미보유 기본값 (참조 안정) */
const EMPTY_POWERS: readonly PlayerPower[] = [];

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

/** 키보드 입력 대상의 상호작용 요소 여부 판별 */
function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element
    && target.closest('button, a, input, textarea, select, [role="button"], [contenteditable="true"]') !== null;
}

/** 드로우 파일 카드 이름별 그룹핑 (툴팁 표시용) */
function groupDrawPile(drawPile: readonly CardInstance[], lang: import('../../i18n/types').Language): string[] {
  const counts = new Map<string, number>();
  for (const card of drawPile) {
    const def = CARD_DEFINITIONS[card.definitionId];
    const name = def ? getCardName(def.id, lang) : card.definitionId;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  // 이름순 정렬 (드로우 순서 노출 방지)
  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b, lang))
    .map(([name, count]) => `${name} x${count}`);
}

export function CombatScreen({
  combat,
  characterClass,
  onPlayCard,
  onEndTurn,
  potions,
  onUsePotion,
  onOverlayChange,
}: CombatScreenProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const reducedMotion = useReducedMotion();
  const [drag, setDrag] = useState<DragState | null>(null);
  const [attacking, setAttacking] = useState(false);
  const [lungingEnemyIds, setLungingEnemyIds] = useState<readonly string[]>([]);
  const [selectedEnemyId, setSelectedEnemyId] = useState<string | null>(combat.enemies[0]?.id ?? null);
  const [hoveredEnemyId, setHoveredEnemyId] = useState<string | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const hoverFrameRef = useRef<number | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const bottomAreaRef = useRef<HTMLDivElement>(null);
  const [viewingPile, setViewingPile] = useState<PileType>(null);
  // 턴 종료 진행 표시 (턴 번호 파생 → 다음 턴 진입 시 자동 해제)
  const [endTurnPendingTurn, setEndTurnPendingTurn] = useState<number | null>(null);
  const turnEnding = endTurnPendingTurn === combat.turn;
  const combatResolved = combat.result !== 'ongoing';
  const inputLocked = turnEnding || combatResolved;
  const endTurnLockRef = useRef(false);
  // 카드 놓기 연출 진행 여부 (완료 전 턴 종료 차단)
  const cardReleasingRef = useRef(false);
  const endTurnTimerRef = useRef<number | null>(null);
  const attackTimerRef = useRef<number | null>(null);

  // 전투 내부 모달 표시 상태 통지
  useEffect(() => {
    onOverlayChange(viewingPile !== null);
    return () => onOverlayChange(false);
  }, [onOverlayChange, viewingPile]);

  // 전투 연출 타이머 정리
  useEffect(() => () => {
    if (endTurnTimerRef.current !== null) window.clearTimeout(endTurnTimerRef.current);
    if (attackTimerRef.current !== null) window.clearTimeout(attackTimerRef.current);
  }, []);

  // 다음 턴 진입 시 턴 종료 잠금 해제
  useEffect(() => {
    endTurnLockRef.current = false;
  }, [combat.turn]);

  /** 적 공격 돌진 애니메이션 후 실제 턴 종료 처리 */
  const handleEndTurnWithAnimation = useCallback(() => {
    if (endTurnLockRef.current || cardReleasingRef.current || combat.result !== 'ongoing') return;
    endTurnLockRef.current = true;
    setEndTurnPendingTurn(combat.turn);
    const attackerIds = combat.enemies
      .filter((e) => e.intent.type === 'attack')
      .map((e) => e.id);

    if (attackerIds.length > 0 && !reducedMotion) {
      setLungingEnemyIds(attackerIds);
      endTurnTimerRef.current = window.setTimeout(() => {
        setLungingEnemyIds([]);
        onEndTurn();
        endTurnTimerRef.current = null;
      }, 350);
    } else {
      onEndTurn();
    }
  }, [combat.enemies, combat.result, combat.turn, onEndTurn, reducedMotion]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (combatResolved || e.repeat || isInteractiveTarget(e.target) || document.querySelector('[aria-modal="true"]')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleEndTurnWithAnimation();
        return;
      }
      const potionIndex = e.code === 'Digit1' || e.code === 'Numpad1'
        ? 0
        : e.code === 'Digit2' || e.code === 'Numpad2' ? 1 : -1;
      const potionId = potions[potionIndex];
      if (potionIndex < 0 || !potionId || turnEnding) return;
      if (potionId === 'healing_potion' && combat.player.hp >= combat.player.maxHp) return;
      const targetEnemyId = combat.enemies.some((enemy) => enemy.id === selectedEnemyId)
        ? selectedEnemyId ?? undefined
        : combat.enemies[0]?.id;
      e.preventDefault();
      onUsePotion(potionIndex, TARGETED_POTION_IDS.has(potionId) ? targetEnemyId : undefined);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [combat.enemies, combat.player.hp, combat.player.maxHp, combatResolved, handleEndTurnWithAnimation, onUsePotion, potions, selectedEnemyId, turnEnding]);

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
    if (endTurnLockRef.current || combat.result !== 'ongoing') return;
    const card = combat.hand.find((handCard) => handCard.instanceId === instanceId);
    const definition = card ? CARD_DEFINITIONS[card.definitionId] : null;
    if (!definition) return;
    const state: DragState = { instanceId, singleTarget: hasSingleTargetEffect(definition), startX: x, startY: y };
    lastPointRef.current = { x, y };
    setDrag(state);
    dragRef.current = state;
    dragPointerIdRef.current = pointerId;
    // 전체 화면에 포인터 캡처 설정 (터치 드래그 중 pointercancel 방지)
    screenRef.current?.setPointerCapture(pointerId);
  }, [combat.hand, combat.result]);

  const isDragging = drag !== null;

  useEffect(() => {
    if (!isDragging) return;
    let releasing = false;

    const clearDragState = () => {
      if (dragPointerIdRef.current != null && screenRef.current) {
        try { screenRef.current.releasePointerCapture(dragPointerIdRef.current); } catch { /* 이미 해제됨 */ }
      }
      if (hoverFrameRef.current !== null) {
        window.cancelAnimationFrame(hoverFrameRef.current);
        hoverFrameRef.current = null;
      }
      dragPointerIdRef.current = null;
      setDrag(null);
      setHoveredEnemyId(null);
      dragRef.current = null;
      lastPointRef.current = null;
    };

    // 드래그 카드 놓기 전환
    const animateGhostRelease = (returnToHand: boolean): Promise<void> => {
      const ghost = ghostRef.current;
      if (!ghost) return Promise.resolve();
      ghost.getAnimations().forEach((animation) => animation.cancel());
      const originalCard = [...(screenRef.current?.querySelectorAll<HTMLElement>('[data-card-instance-id]') ?? [])]
        .find((element) => element.dataset.cardInstanceId === dragRef.current?.instanceId);
      const targetRect = returnToHand ? originalCard?.getBoundingClientRect() : undefined;
      const targetLeft = targetRect ? `${targetRect.left + targetRect.width / 2}px` : ghost.style.left;
      const targetTop = targetRect ? targetRect.top + targetRect.height / 2 : Number.parseFloat(ghost.style.top);
      const keyframes: Keyframe[] = returnToHand ? [
        {
          left: ghost.style.left,
          top: ghost.style.top,
          transform: 'translate(-50%, -58%) scale(0.88)',
          opacity: 0.98,
        },
        {
          left: targetLeft,
          top: `${targetTop}px`,
          transform: 'translate(-50%, -50%) scale(0.66)',
          opacity: 1,
        },
      ] : [
        {
          left: ghost.style.left,
          top: ghost.style.top,
          transform: 'translate(-50%, -58%) scale(0.88)',
          opacity: 0.98,
        },
        {
          left: ghost.style.left,
          top: `${Number.parseFloat(ghost.style.top) - 10}px`,
          transform: 'translate(-50%, -58%) scale(0.82)',
          opacity: 0.86,
          filter: 'brightness(1.28) saturate(1.2)',
          offset: 0.55,
        },
        {
          left: ghost.style.left,
          top: `${Number.parseFloat(ghost.style.top) - 30}px`,
          transform: 'translate(-50%, -58%) scale(0.55)',
          opacity: 0,
          filter: 'brightness(1.4) saturate(0.8)',
        },
      ];
      const animation = ghost.animate(keyframes, {
        duration: reducedMotion ? 1 : returnToHand ? 280 : 260,
        easing: returnToHand ? 'cubic-bezier(0.22, 1, 0.36, 1)' : 'cubic-bezier(0.4, 0, 1, 1)',
        fill: 'forwards',
      });
      return animation.finished.then(() => undefined, () => undefined);
    };

    // 고스트 카드 위치 직접 갱신 (리렌더 없이 프레임당 이동)
    const handlePointerMove = (e: PointerEvent) => {
      if (releasing) return;
      lastPointRef.current = { x: e.clientX, y: e.clientY };
      const ghost = ghostRef.current;
      if (ghost) {
        ghost.style.left = `${e.clientX}px`;
        ghost.style.top = `${e.clientY}px`;
      }
      if (!dragRef.current?.singleTarget || hoverFrameRef.current !== null) return;
      // 히트테스트는 프레임당 1회로 제한
      hoverFrameRef.current = window.requestAnimationFrame(() => {
        hoverFrameRef.current = null;
        const point = lastPointRef.current;
        setHoveredEnemyId(point ? resolveEnemyIdFromPoint(point.x, point.y) : null);
      });
    };

    // 카드 놓기 처리
    const releasePointer = async (e: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;
      releasing = true;
      if (endTurnLockRef.current) {
        await animateGhostRelease(true);
        clearDragState();
        return;
      }

      const droppedInsideHand = isInsideBottomArea(e.clientY, bottomAreaRef.current);
      const tapDistance = Math.hypot(e.clientX - current.startX, e.clientY - current.startY);
      const tappedCard = e.pointerType === 'touch' && droppedInsideHand && tapDistance <= 14;
      const card = combat.hand.find((handCard) => handCard.instanceId === current.instanceId);
      const def = card ? CARD_DEFINITIONS[card.definitionId] : null;

      // 터치 탭 카드 즉시 사용
      if ((!droppedInsideHand || tappedCard) && combat.enemies.length > 0) {
        if (!def) {
          await animateGhostRelease(true);
          clearDragState();
          return;
        }
        const pointTargetEnemyId = resolveEnemyIdFromPoint(e.clientX, e.clientY);
        const fallbackEnemyId = aliveSelectedEnemyId ?? combat.enemies[0].id;
        const targetEnemyId = pointTargetEnemyId ?? aliveHoveredEnemyId ?? fallbackEnemyId;
        const singleTarget = hasSingleTargetEffect(def);

        cardReleasingRef.current = true;
        await animateGhostRelease(false);
        onPlayCard(current.instanceId, singleTarget ? targetEnemyId : undefined);
        cardReleasingRef.current = false;
        // 공격 카드 → 사용 후 돌진 애니메이션 유지
        if (def.type === 'attack' && !reducedMotion) {
          setAttacking(true);
          if (attackTimerRef.current !== null) window.clearTimeout(attackTimerRef.current);
          attackTimerRef.current = window.setTimeout(() => {
            setAttacking(false);
            attackTimerRef.current = null;
          }, 200);
        }
        clearDragState();
        return;
      }

      await animateGhostRelease(true);
      clearDragState();
    };

    // 카드 놓기 취소 처리
    const releasePointerCancel = async () => {
      releasing = true;
      await animateGhostRelease(true);
      clearDragState();
    };

    // 포인터 놓기 이벤트 전달
    const handlePointerUp: EventListener = (event) => {
      if (event instanceof PointerEvent) void releasePointer(event);
    };

    // 포인터 취소 이벤트 전달
    const handlePointerCancel: EventListener = () => {
      void releasePointerCancel();
    };

    const el = screenRef.current ?? window;
    el.addEventListener('pointermove', handlePointerMove as EventListener);
    el.addEventListener('pointerup', handlePointerUp);
    el.addEventListener('pointercancel', handlePointerCancel);
    return () => {
      el.removeEventListener('pointermove', handlePointerMove as EventListener);
      el.removeEventListener('pointerup', handlePointerUp);
      el.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [isDragging, combat.enemies, combat.hand, onPlayCard, aliveSelectedEnemyId, aliveHoveredEnemyId, reducedMotion]);
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
      // 뽑을 카드 더미는 정의 순 정렬 (드로우 순서 노출 방지)
      case 'draw': return {
        title: t('drawPile'),
        pile: [...combat.drawPile].sort((a, b) => a.definitionId.localeCompare(b.definitionId)),
      };
      case 'discard': return { title: t('discardPile'), pile: combat.discardPile };
      case 'exhaust': return { title: t('exhaustPile'), pile: combat.exhaustPile };
      default: return { title: '', pile: [] };
    }
  };
  const pileData = getPileData();

  const targetSelectable = !inputLocked && combat.enemies.length > 1;
  const targetingActive = drag?.singleTarget ?? false;

  /** 전투 대상 선택 */
  const handleSelectEnemy = useCallback((enemyId: string) => {
    playSfx('button_click');
    setSelectedEnemyId(enemyId);
  }, []);

  return (
    <div
      className={`${styles.combatScreen} ${targetingActive ? styles.targeting : ''}`}
      ref={screenRef}
      style={drag ? { touchAction: 'none' } : undefined}
    >
      <div className={styles.topSection}>
        <div className={styles.topInfo}>
          <div className={`${styles.infoChip} ${styles.infoChipPrimary}`}>
            <span className={styles.infoChipLabel}>{t('turn')}</span>
            {/* 턴 변경 시 리마운트로 팝 재생 */}
            <strong key={combat.turn} className={`${styles.infoChipValue} ${styles.turnPop}`}>{combat.turn}</strong>
          </div>
        </div>
        {potions.length > 0 && (
          <div className={styles.potionBelt} role="group" aria-label={t('potions')}>
            {potions.map((potionId, index) => {
              const name = getPotionName(potionId, lang);
              const description = getPotionDescription(potionId, lang);
              const disabled = inputLocked || (potionId === 'healing_potion' && combat.player.hp >= combat.player.maxHp);
              return (
                <button
                  key={`${potionId}-${index}`}
                  className={styles.potionButton}
                  disabled={disabled}
                  aria-label={`${name}. ${description}`}
                  aria-keyshortcuts={`${index + 1}`}
                  title={`${name}: ${description}`}
                  onClick={() => onUsePotion(
                    index,
                    TARGETED_POTION_IDS.has(potionId) ? aliveSelectedEnemyId ?? undefined : undefined,
                  )}
                >
                  <span aria-hidden="true">{POTION_DEFINITIONS[potionId].emoji}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.battlefield}>
        <PlayerArea
          player={combat.player}
          powers={combat.powers ?? EMPTY_POWERS}
          isAttacking={attacking}
          characterClass={characterClass}
        />
        <EnemyArea
          enemies={combat.enemies}
          playerVulnerable={combat.player.statusEffects.some((effect) => effect.type === 'vulnerable' && effect.duration > 0)}
          selectedEnemyId={aliveSelectedEnemyId}
          hoveredEnemyId={aliveHoveredEnemyId}
          lungingEnemyIds={lungingEnemyIds}
          targetSelectable={targetSelectable}
          targetingActive={targetingActive}
          onSelectEnemy={handleSelectEnemy}
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
          disabled={inputLocked}
          onDragStart={handleDragStart}
          onPlayCard={onPlayCard}
        />

        <button className={styles.endTurnBtn} disabled={inputLocked} aria-keyshortcuts="Space" onClick={handleEndTurnWithAnimation}>
          {t('endTurn')}
        </button>

        <div className={styles.pileBtnGroup}>
          <button className={styles.pileBtn} onClick={() => setViewingPile('discard')}>
            <span className="sr-only">{t('discardPile')}</span>
            <strong className={styles.utilityCount}>{combat.discardPile.length}</strong>
          </button>
          <button className={styles.pileBtn} onClick={() => setViewingPile('exhaust')}>
            <span className="sr-only">{t('exhaustPile')}</span>
            <strong className={styles.utilityCount}>{combat.exhaustPile.length}</strong>
          </button>
        </div>
      </div>

      {combat.result === 'victory' && (
        <div className={styles.combatResultCue} role="status" aria-live="assertive">
          {t('victory')}
        </div>
      )}

      {/* 드래그 고스트 카드 (위치는 포인터 이동 시 DOM 직접 갱신) */}
      {drag && draggedDef && (
        <div
          ref={ghostRef}
          className={`${cardStyles.card} ${cardStyles.cardGhost} ${getCardTypeClass(draggedDef.type)}`}
          aria-hidden="true"
          data-rarity={getCardRarity(draggedDef.id)}
          style={{ left: drag.startX, top: drag.startY }}
        >
          <div className={cardStyles.cardCost}>{draggedDef.cost}</div>
          <div className={cardStyles.cardName}>{getCardName(draggedDef.id, lang)}</div>
          <CardArtwork cardId={draggedDef.id} cardName={getCardName(draggedDef.id, lang)} />
          <div className={cardStyles.cardDescription}>{draggedDescription}</div>
          <div className={cardStyles.cardType}>
            {getCardTypeName(draggedDef.type, t)} · {getCardRarityName(getCardRarity(draggedDef.id), t)}
          </div>
        </div>
      )}

      {viewingPile && (
        <PileViewer
          title={pileData.title}
          pile={pileData.pile}
          onClose={() => setViewingPile(null)}
        />
      )}
    </div>
  );
}
