// 현재 런 덱 구성 모달

import { CARD_DEFINITIONS, getCardRarity } from '@tower-of-cardborn/game-core/data/cards';
import { useLanguage, useTranslation } from '../../i18n';
import { generateCardDescription, getCardName, getCardRarityName, getCardTypeName } from '../../i18n/card-text';
import { useModalKeyboard } from '../../hooks/use-modal-keyboard';
import { CardArtwork } from '../card/CardArtwork';
import { getCardTypeClass } from '../card/card-type-class';
import cardStyles from '../../styles/card.module.css';
import combatStyles from '../../styles/combat.module.css';

interface DeckViewerProps {
  readonly deck: readonly string[];
  readonly onClose: () => void;
}

/** 동일 카드 수량 집계 */
function groupDeck(deck: readonly string[]): readonly [string, number][] {
  const counts = new Map<string, number>();
  for (const cardId of deck) counts.set(cardId, (counts.get(cardId) ?? 0) + 1);
  return [...counts.entries()];
}

export function DeckViewer({ deck, onClose }: DeckViewerProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const modalRef = useModalKeyboard(onClose);

  return (
    <div className={combatStyles.pileOverlay} onClick={onClose}>
      <div
        className={combatStyles.pileModal}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deck-viewer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={combatStyles.pileHeader}>
          <h2 id="deck-viewer-title">{t('deck')} ({deck.length})</h2>
          <button className={combatStyles.pileCloseBtn} aria-label={t('close')} onClick={onClose}>✕</button>
        </div>
        <div className={`${combatStyles.pileGrid} card-list`}>
          {groupDeck(deck).map(([cardId, count]) => {
            const definition = CARD_DEFINITIONS[cardId];
            if (!definition) return null;
            const name = getCardName(cardId, lang);
            const rarity = getCardRarity(cardId);
            return (
              <article
                key={cardId}
                className={`${cardStyles.card} card-item ${getCardTypeClass(definition.type)}`}
                data-rarity={rarity}
              >
                {count > 1 && <span className={combatStyles.deckCountBadge}>×{count}</span>}
                <div className={cardStyles.cardCost}>{definition.cost}</div>
                <div className={cardStyles.cardName}>{name}</div>
                <CardArtwork cardId={cardId} cardName={name} />
                <div className={cardStyles.cardDescription}>{generateCardDescription(definition, t)}</div>
                <div className={cardStyles.cardType}>
                  {getCardTypeName(definition.type, t)} · {getCardRarityName(rarity, t)}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
