// 개별 카드 UI 컴포넌트 (포인터 드래그 지원 + 키워드 툴팁)

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { CardDefinition } from '@tower-of-cardborn/game-core/types/card';
import { getCardRarity } from '@tower-of-cardborn/game-core/data/cards';
import { useTranslation, useLanguage } from '../../i18n';
import { getCardName, generateCardDescription, getCardRarityName, getCardTypeName } from '../../i18n/card-text';
import { getCardKeywords } from '../../i18n/card-keywords';
import { playSfx } from '../../utils/sound';
import styles from '../../styles/card.module.css';
import { CardArtwork } from '../card/CardArtwork';
import { getCardTypeClass } from '../card/card-type-class';

interface CardComponentProps {
  readonly definition: CardDefinition;
  readonly instanceId: string;
  readonly canPlay: boolean;
  readonly isDragging: boolean;
  readonly previewDescription?: string;
  readonly onDragStart: (instanceId: string, x: number, y: number, pointerId: number) => void;
  readonly onActivate: (instanceId: string) => void;
}

export const CardComponent = memo(function CardComponent({
  definition,
  instanceId,
  canPlay,
  isDragging,
  previewDescription,
  onDragStart,
  onActivate,
}: CardComponentProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const typeClass = getCardTypeClass(definition.type);
  const keywords = useMemo(() => getCardKeywords(definition, t), [definition, t]);
  const cardName = getCardName(definition.id, lang);
  const cardDesc = previewDescription ?? generateCardDescription(definition, t);
  const rarity = getCardRarity(definition.id);
  const [rejected, setRejected] = useState(false);
  const rejectTimerRef = useRef<number | null>(null);

  // 거부 흔들림 타이머 정리
  useEffect(() => () => {
    if (rejectTimerRef.current !== null) window.clearTimeout(rejectTimerRef.current);
  }, []);

  const handlePointerDown = (e: ReactPointerEvent) => {
    if (!canPlay) {
      // 사용 불가 카드 조작 거부 피드백
      playSfx('card_reject');
      setRejected(true);
      if (rejectTimerRef.current !== null) window.clearTimeout(rejectTimerRef.current);
      rejectTimerRef.current = window.setTimeout(() => {
        setRejected(false);
        rejectTimerRef.current = null;
      }, 320);
      return;
    }
    e.preventDefault();
    onDragStart(instanceId, e.clientX, e.clientY, e.pointerId);
  };

  /** 카드 키보드 사용 */
  const handleKeyDown = (event: ReactKeyboardEvent) => {
    if (!canPlay || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onActivate(instanceId);
  };

  return (
    <div
      className={`${styles.card} card-item ${typeClass} ${canPlay ? styles.cardPlayable : styles.cardDisabled} ${rejected ? styles.cardReject : ''} ${isDragging ? `${styles.cardDragging} card-dragging` : ''}`}
      role="button"
      tabIndex={0}
      aria-disabled={!canPlay}
      aria-label={[`${cardName}. ${definition.cost} ${t('energy')}. ${cardDesc}`, ...keywords].join(' ')}
      data-card-instance-id={instanceId}
      data-rarity={rarity}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.cardCost}>{definition.cost}</div>
      <div className={styles.cardName}>{cardName}</div>
      <CardArtwork cardId={definition.id} cardName={cardName} />
      <div className={styles.cardDescription}>{cardDesc}</div>
      <div className={styles.cardType}>
        {getCardTypeName(definition.type, t)} · {getCardRarityName(rarity, t)}
        {definition.exhaust && ` · ${t('exhaust')}`}
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
});
