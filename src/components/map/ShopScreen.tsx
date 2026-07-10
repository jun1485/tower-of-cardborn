// 상점 화면: 카드 구매 + 카드 제거 서비스

import { CARD_DEFINITIONS, getCardPrice, getCardRarity } from '@tower-of-cardborn/game-core/data/cards';
import { useTranslation, useLanguage } from '../../i18n';
import { getCardName, generateCardDescription, getCardRarityName, getCardTypeName } from '../../i18n/card-text';
import { MIN_DECK_SIZE, REMOVE_PRICE } from '../../utils/game-transitions';
import styles from '../../styles/app.module.css';
import cardStyles from '../../styles/card.module.css';
import { CardArtwork } from '../card/CardArtwork';

interface ShopScreenProps {
  readonly shopCards: readonly string[];
  readonly gold: number;
  readonly deckSize: number;
  readonly onBuy: (cardId: string) => void;
  readonly onRemoveService: () => void;
  readonly onLeave: () => void;
}

export function ShopScreen({ shopCards, gold, deckSize, onBuy, onRemoveService, onLeave }: ShopScreenProps) {
  const t = useTranslation();
  const lang = useLanguage();

  return (
    <div className={styles.resultScreen}>
      <h1 className={styles.resultTitle}>{t('shopTitle')}</h1>
      <p className={styles.subtitle}>{t('shopSelect')}</p>
      <span className={styles.goldBadge}>💰 {gold}</span>

      <div className={`${styles.rewardCards} card-list`}>
        {shopCards.map((cardId) => {
          const def = CARD_DEFINITIONS[cardId];
          if (!def) return null;

          const price = getCardPrice(cardId);
          const affordable = gold >= price;
          const name = getCardName(def.id, lang);
          const rarity = getCardRarity(cardId);
          const typeClassMap = {
            attack: cardStyles.cardAttack,
            skill: cardStyles.cardSkill,
            power: cardStyles.cardPower,
          };

          return (
            <button
              key={cardId}
              className={`${cardStyles.card} card-item ${typeClassMap[def.type]} ${styles.rewardCard} ${affordable ? '' : cardStyles.cardDisabled}`}
              disabled={!affordable}
              data-rarity={rarity}
              onClick={() => onBuy(cardId)}
            >
              <div className={cardStyles.cardCost}>{def.cost}</div>
              <div className={cardStyles.cardName}>{name}</div>
              <CardArtwork cardId={def.id} cardName={name} />
              <div className={cardStyles.cardDescription}>{generateCardDescription(def, t)}</div>
              <div className={cardStyles.cardType}>{getCardTypeName(def.type, t)} · {getCardRarityName(rarity, t)}</div>
              <span className={styles.shopPrice}>💰 {price}</span>
            </button>
          );
        })}
        {shopCards.length === 0 && <p className={styles.subtitle}>{t('noCards')}</p>}
      </div>

      <button
        className={styles.resultBtn}
        disabled={gold < REMOVE_PRICE || deckSize <= MIN_DECK_SIZE}
        onClick={onRemoveService}
      >
        {t('shopRemoveService', REMOVE_PRICE)}
      </button>
      <button className={styles.resultBtn} onClick={onLeave}>
        {t('shopLeave')}
      </button>
    </div>
  );
}
