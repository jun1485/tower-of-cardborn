// 개별 카드 UI 컴포넌트 (포인터 드래그 지원 + 키워드 툴팁)

import type { PointerEvent as ReactPointerEvent } from 'react';
import type { CardDefinition } from '../../types/card';
import styles from '../../styles/card.module.css';
import { CardArtwork } from '../card/CardArtwork';

interface CardComponentProps {
  readonly definition: CardDefinition;
  readonly instanceId: string;
  readonly canPlay: boolean;
  readonly isDragging: boolean;
  readonly previewDescription?: string;
  readonly onDragStart: (instanceId: string, x: number, y: number) => void;
}

/** 카드 효과에서 키워드 설명 추출 */
function getKeywords(def: CardDefinition): string[] {
  const keywords: string[] = [];
  for (const effect of def.effects) {
    if (effect.statusType === 'vulnerable' && !keywords.includes('취약: 받는 데미지 50% 증가'))
      keywords.push('취약: 받는 데미지 50% 증가');
    if (effect.statusType === 'weak' && !keywords.includes('약화: 주는 데미지 25% 감소'))
      keywords.push('약화: 주는 데미지 25% 감소');
    if (effect.type === 'gain_strength' && !keywords.includes('힘: 공격 카드 데미지 영구 증가'))
      keywords.push('힘: 공격 카드 데미지 영구 증가');
  }
  if (def.exhaust) keywords.push('소멸: 사용 후 이번 전투에서 제거');
  if (def.type === 'power') keywords.push('파워: 사용 시 영구 효과 발동');
  return keywords;
}

export function CardComponent({
  definition,
  instanceId,
  canPlay,
  isDragging,
  previewDescription,
  onDragStart,
}: CardComponentProps) {
  const typeClassMap = { attack: styles.cardAttack, skill: styles.cardSkill, power: styles.cardPower };
  const typeClass = typeClassMap[definition.type];
  const keywords = getKeywords(definition);

  const handlePointerDown = (e: ReactPointerEvent) => {
    if (!canPlay) return;
    e.preventDefault();
    onDragStart(instanceId, e.clientX, e.clientY);
  };

  return (
    <div
      className={`${styles.card} card-item ${typeClass} ${canPlay ? '' : styles.cardDisabled} ${isDragging ? styles.cardDragging : ''}`}
      onPointerDown={handlePointerDown}
    >
      <div className={styles.cardCost}>{definition.cost}</div>
      <div className={styles.cardName}>{definition.name}</div>
      <CardArtwork cardId={definition.id} cardName={definition.name} />
      <div className={styles.cardDescription}>{previewDescription ?? definition.description}</div>
      <div className={styles.cardType}>
        {definition.type}
        {definition.exhaust && ' · 소멸'}
      </div>
      {keywords.length > 0 && (
        <div className={styles.cardTooltip}>
          {keywords.map((kw, i) => (
            <div key={i}>{kw}</div>
          ))}
        </div>
      )}
    </div>
  );
}
