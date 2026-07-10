// 개별 카드 UI 컴포넌트 (포인터 드래그 지원 + 키워드 툴팁)

import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { CardDefinition } from '@tower-of-cardborn/game-core/types/card';
import { getCardRarity } from '@tower-of-cardborn/game-core/data/cards';
import { useTranslation, useLanguage } from '../../i18n';
import type { TFunction } from '../../i18n';
import { getCardName, generateCardDescription, getCardRarityName, getCardTypeName } from '../../i18n/card-text';
import styles from '../../styles/card.module.css';
import { CardArtwork } from '../card/CardArtwork';

interface CardComponentProps {
  readonly definition: CardDefinition;
  readonly instanceId: string;
  readonly canPlay: boolean;
  readonly isDragging: boolean;
  readonly previewDescription?: string;
  readonly onDragStart: (instanceId: string, x: number, y: number, pointerId: number) => void;
  readonly onActivate: (instanceId: string) => void;
}

/** 카드 효과에서 키워드 설명 추출 */
function getKeywords(def: CardDefinition, t: TFunction): string[] {
  const keywords: string[] = [];
  for (const effect of def.effects) {
    const vulnText = t('kwVulnerable');
    const weakText = t('kwWeak');
    const strText = t('kwStrength');
    if (effect.statusType === 'vulnerable' && !keywords.includes(vulnText))
      keywords.push(vulnText);
    if (effect.statusType === 'weak' && !keywords.includes(weakText))
      keywords.push(weakText);
    if (effect.type === 'gain_strength' && !keywords.includes(strText))
      keywords.push(strText);
  }
  if (def.exhaust) keywords.push(t('kwExhaust'));
  if (def.type === 'power') keywords.push(t('kwPower'));
  return keywords;
}

export function CardComponent({
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
  const typeClassMap = { attack: styles.cardAttack, skill: styles.cardSkill, power: styles.cardPower };
  const typeClass = typeClassMap[definition.type];
  const keywords = getKeywords(definition, t);
  const cardName = getCardName(definition.id, lang);
  const cardDesc = previewDescription ?? generateCardDescription(definition, t);
  const rarity = getCardRarity(definition.id);

  const handlePointerDown = (e: ReactPointerEvent) => {
    if (!canPlay) return;
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
      className={`${styles.card} card-item ${typeClass} ${canPlay ? '' : styles.cardDisabled} ${isDragging ? `${styles.cardDragging} card-dragging` : ''}`}
      role="button"
      tabIndex={0}
      aria-disabled={!canPlay}
      aria-label={`${cardName}. ${definition.cost} ${t('energy')}. ${cardDesc}`}
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
}
