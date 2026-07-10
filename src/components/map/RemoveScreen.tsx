// 카드 제거 선택 화면: 덱에서 제거할 카드 선택

import { CARD_DEFINITIONS } from '@tower-of-cardborn/game-core/data/cards';
import { useTranslation, useLanguage } from '../../i18n';
import { getCardName, generateCardDescription } from '../../i18n/card-text';
import styles from '../../styles/app.module.css';
import cardStyles from '../../styles/card.module.css';
import { CardArtwork } from '../card/CardArtwork';

interface RemoveScreenProps {
  readonly deck: readonly string[];
  readonly canSkip: boolean;
  readonly onRemove: (deckIndex: number) => void;
  readonly onSkip: () => void;
}

export function RemoveScreen({ deck, canSkip, onRemove, onSkip }: RemoveScreenProps) {
  const t = useTranslation();
  const lang = useLanguage();

  return (
    <div className={styles.resultScreen}>
      <h1 className={styles.resultTitle}>{t('removeTitle')}</h1>
      <p className={styles.subtitle}>{t('removeSelect')}</p>

      <div className={`${styles.upgradeGrid} card-list`}>
        {deck.map((cardId, index) => {
          const def = CARD_DEFINITIONS[cardId];
          if (!def) return null;

          const name = getCardName(def.id, lang);
          const typeClassMap = {
            attack: cardStyles.cardAttack,
            skill: cardStyles.cardSkill,
            power: cardStyles.cardPower,
          };

          return (
            <button
              key={index}
              className={`${styles.upgradeCard} ${styles.removeCardBtn} card-item ${typeClassMap[def.type]}`}
              onClick={() => onRemove(index)}
            >
              <div className={cardStyles.cardCost}>{def.cost}</div>
              <div className={cardStyles.cardName}>{name}</div>
              <CardArtwork cardId={def.id} cardName={name} />
              <div className={cardStyles.cardDescription}>{generateCardDescription(def, t)}</div>
            </button>
          );
        })}
      </div>

      {canSkip && (
        <button className={styles.resultBtn} onClick={onSkip}>
          {t('cancel')}
        </button>
      )}
    </div>
  );
}
