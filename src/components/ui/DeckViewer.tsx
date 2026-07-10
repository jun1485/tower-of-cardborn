// 현재 런 덱 구성 모달

import { CARD_DEFINITIONS, getCardRarity } from '@tower-of-cardborn/game-core/data/cards';
import { useLanguage, useTranslation } from '../../i18n';
import { generateCardDescription, getCardName, getCardRarityName, getCardTypeName } from '../../i18n/card-text';
import { useModalKeyboard } from '../../hooks/use-modal-keyboard';
import { CardArtwork } from '../card/CardArtwork';
import cardStyles from '../../styles/card.module.css';
import combatStyles from '../../styles/combat.module.css';

interface DeckViewerProps {
  readonly deck: readonly string[];
  readonly onClose: () => void;
}

export function DeckViewer({ deck, onClose }: DeckViewerProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const modalRef = useModalKeyboard(onClose);
  const typeClass = {
    attack: cardStyles.cardAttack,
    skill: cardStyles.cardSkill,
    power: cardStyles.cardPower,
  } as const;

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
          {deck.map((cardId, index) => {
            const definition = CARD_DEFINITIONS[cardId];
            if (!definition) return null;
            const name = getCardName(cardId, lang);
            const rarity = getCardRarity(cardId);
            return (
              <article
                key={`${cardId}-${index}`}
                className={`${cardStyles.card} card-item ${typeClass[definition.type]}`}
                data-rarity={rarity}
              >
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
