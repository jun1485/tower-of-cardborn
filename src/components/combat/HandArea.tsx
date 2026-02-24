// 패(Hand) 영역 컴포넌트 (드래그 지원)

import type { CardInstance } from '@tower-of-cardborn/game-core/types/card';
import type { Enemy, StatusEffect } from '@tower-of-cardborn/game-core/types/character';
import { CARD_DEFINITIONS } from '@tower-of-cardborn/game-core/data/cards';
import { getPreviewDescription } from '@tower-of-cardborn/game-core/game/damage-preview';
import { CardComponent } from './CardComponent';
import styles from '../../styles/combat.module.css';

interface HandAreaProps {
  readonly hand: readonly CardInstance[];
  readonly energy: number;
  readonly playerStatusEffects: readonly StatusEffect[];
  readonly enemies: readonly Enemy[];
  readonly targetEnemyId: string | undefined;
  readonly draggingInstanceId: string | null;
  readonly onDragStart: (instanceId: string, x: number, y: number) => void;
}

export function HandArea({
  hand,
  energy,
  playerStatusEffects,
  enemies,
  targetEnemyId,
  draggingInstanceId,
  onDragStart,
}: HandAreaProps) {
  return (
    <div className={`${styles.handArea} card-list card-list-overlap`}>
      {hand.map((card) => {
        const definition = CARD_DEFINITIONS[card.definitionId];
        if (!definition) return null;
        const previewDescription = getPreviewDescription(definition, playerStatusEffects, enemies, targetEnemyId);
        return (
          <CardComponent
            key={card.instanceId}
            instanceId={card.instanceId}
            definition={definition}
            canPlay={energy >= definition.cost}
            isDragging={draggingInstanceId === card.instanceId}
            previewDescription={previewDescription}
            onDragStart={onDragStart}
          />
        );
      })}
    </div>
  );
}
