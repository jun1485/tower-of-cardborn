// 패(Hand) 영역 컴포넌트 (드래그 지원)

import { memo, useCallback, useMemo, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { CardInstance } from '@tower-of-cardborn/game-core/types/card';
import type { Enemy, StatusEffect } from '@tower-of-cardborn/game-core/types/character';
import { CARD_DEFINITIONS } from '@tower-of-cardborn/game-core/data/cards';
import { useTranslation } from '../../i18n';
import { generatePreviewDescription } from '../../i18n/card-text';
import { CardComponent } from './CardComponent';
import styles from '../../styles/combat.module.css';

interface HandAreaProps {
  readonly hand: readonly CardInstance[];
  readonly energy: number;
  readonly playerStatusEffects: readonly StatusEffect[];
  readonly enemies: readonly Enemy[];
  readonly targetEnemyId: string | undefined;
  readonly draggingInstanceId: string | null;
  readonly disabled: boolean;
  readonly onDragStart: (instanceId: string, x: number, y: number, pointerId: number) => void;
  readonly onPlayCard: (cardInstanceId: string, targetEnemyId?: string) => void;
}

export const HandArea = memo(function HandArea({
  hand,
  energy,
  playerStatusEffects,
  enemies,
  targetEnemyId,
  draggingInstanceId,
  disabled,
  onDragStart,
  onPlayCard,
}: HandAreaProps) {
  const t = useTranslation();
  const [expandedHandSize, setExpandedHandSize] = useState<number | null>(null);
  const touchExpanded = expandedHandSize === hand.length;

  // 카드별 미리보기 설명 캐시
  const previewDescriptions = useMemo(() => {
    const previews = new Map<string, string>();
    for (const card of hand) {
      const definition = CARD_DEFINITIONS[card.definitionId];
      if (!definition) continue;
      previews.set(card.instanceId, generatePreviewDescription(definition, t, playerStatusEffects, enemies, targetEnemyId));
    }
    return previews;
  }, [hand, t, playerStatusEffects, enemies, targetEnemyId]);

  // 카드 키보드/탭 사용 처리
  const handleActivate = useCallback((instanceId: string) => {
    const card = hand.find((handCard) => handCard.instanceId === instanceId);
    const definition = card ? CARD_DEFINITIONS[card.definitionId] : undefined;
    if (!definition) return;
    const singleTarget = definition.effects.some((effect) => effect.target === 'single');
    onPlayCard(instanceId, singleTarget ? targetEnemyId : undefined);
  }, [hand, onPlayCard, targetEnemyId]);

  // 터치 첫 조작 시 손패 펼침
  const handlePointerDownCapture = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' || touchExpanded) return;
    event.preventDefault();
    event.stopPropagation();
    setExpandedHandSize(hand.length);
  }, [hand.length, touchExpanded]);

  return (
    <div
      className={`${styles.handArea} ${touchExpanded ? styles.handExpanded : ''} card-list card-list-overlap`}
      onPointerDownCapture={handlePointerDownCapture}
    >
      <div className={styles.handTrack}>
        {hand.map((card) => {
          const definition = CARD_DEFINITIONS[card.definitionId];
          if (!definition) return null;
          return (
            <CardComponent
              key={card.instanceId}
              instanceId={card.instanceId}
              definition={definition}
              canPlay={!disabled && !definition.unplayable && energy >= definition.cost}
              isDragging={draggingInstanceId === card.instanceId}
              previewDescription={previewDescriptions.get(card.instanceId)}
              onDragStart={onDragStart}
              onActivate={handleActivate}
            />
          );
        })}
      </div>
    </div>
  );
});
