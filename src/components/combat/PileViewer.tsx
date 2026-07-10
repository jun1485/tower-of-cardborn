// 카드 파일 뷰어 (뽑을 카드 / 버린 카드 / 소멸 카드 목록)

import type { CardInstance } from '@tower-of-cardborn/game-core/types/card';
import { CARD_DEFINITIONS, getCardRarity } from '@tower-of-cardborn/game-core/data/cards';
import { useTranslation, useLanguage } from '../../i18n';
import { getCardName, generateCardDescription, getCardRarityName, getCardTypeName } from '../../i18n/card-text';
import styles from '../../styles/combat.module.css';
import cardStyles from '../../styles/card.module.css';
import { CardArtwork } from '../card/CardArtwork';
import { useModalKeyboard } from '../../hooks/use-modal-keyboard';

interface PileViewerProps {
  readonly title: string;
  readonly pile: readonly CardInstance[];
  readonly onClose: () => void;
}

export function PileViewer({ title, pile, onClose }: PileViewerProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const modalRef = useModalKeyboard(onClose);

  return (
    <div className={styles.pileOverlay} onClick={onClose}>
      <div
        className={styles.pileModal}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pile-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.pileHeader}>
          <h2 id="pile-title">{title} ({pile.length})</h2>
          <button className={styles.pileCloseBtn} aria-label={t('close')} onClick={onClose}>✕</button>
        </div>
        <div className={`${styles.pileGrid} card-list`}>
          {pile.map((card) => {
            const def = CARD_DEFINITIONS[card.definitionId];
            if (!def) return null;
            const name = getCardName(def.id, lang);
            const typeClassMap = { attack: cardStyles.cardAttack, skill: cardStyles.cardSkill, power: cardStyles.cardPower };
            const typeClass = typeClassMap[def.type];
            const rarity = getCardRarity(def.id);
            return (
              <div key={card.instanceId} className={`${cardStyles.card} card-item ${typeClass}`} data-rarity={rarity}>
                <div className={cardStyles.cardCost}>{def.cost}</div>
                <div className={cardStyles.cardName}>{name}</div>
                <CardArtwork cardId={def.id} cardName={name} />
                <div className={cardStyles.cardDescription}>{generateCardDescription(def, t)}</div>
                <div className={cardStyles.cardType}>{getCardTypeName(def.type, t)} · {getCardRarityName(rarity, t)}</div>
              </div>
            );
          })}
          {pile.length === 0 && <p className={styles.pileEmpty}>{t('noCards')}</p>}
        </div>
      </div>
    </div>
  );
}
