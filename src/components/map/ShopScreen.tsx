// 상점 화면: 카드/유물/포션 구매 + 카드 제거 서비스

import { CARD_DEFINITIONS, getCardRarity } from '@tower-of-cardborn/game-core/data/cards';
import { RELIC_DEFINITIONS } from '@tower-of-cardborn/game-core/data/relics';
import { MAX_POTION_SLOTS, POTION_DEFINITIONS } from '@tower-of-cardborn/game-core/data/potions';
import type { RelicId } from '@tower-of-cardborn/game-core/types/relic';
import type { PotionId } from '@tower-of-cardborn/game-core/types/potion';
import { useTranslation, useLanguage } from '../../i18n';
import { getCardName, generateCardDescription, getCardRarityName, getCardTypeName } from '../../i18n/card-text';
import { getRelicDescription, getRelicName } from '../../i18n/relic-text';
import { getPotionDescription, getPotionName } from '../../i18n/potion-text';
import { MIN_DECK_SIZE, getShopCardPrice } from '../../utils/game-transitions';
import styles from '../../styles/app.module.css';
import cardStyles from '../../styles/card.module.css';
import { CardArtwork } from '../card/CardArtwork';
import { getCardTypeClass } from '../card/card-type-class';

interface ShopScreenProps {
  readonly shopCards: readonly string[];
  readonly shopRelics: readonly RelicId[];
  readonly shopPotions: readonly PotionId[];
  readonly relicPrice: number;
  readonly potionPrice: number;
  readonly removePrice: number;
  readonly upgradePrice: number;
  readonly relics: readonly RelicId[];
  readonly ascension: number;
  readonly potionCount: number;
  readonly gold: number;
  readonly deckSize: number;
  readonly upgradableCount: number;
  readonly onBuy: (cardId: string) => void;
  readonly onBuyRelic: (relicId: RelicId) => void;
  readonly onBuyPotion: (potionId: PotionId) => void;
  readonly onRemoveService: () => void;
  readonly onUpgradeService: () => void;
  readonly onLeave: () => void;
}

export function ShopScreen({
  shopCards, shopRelics, shopPotions, relicPrice, potionPrice, removePrice, upgradePrice, relics, ascension, potionCount,
  gold, deckSize, upgradableCount, onBuy, onBuyRelic, onBuyPotion, onRemoveService, onUpgradeService, onLeave,
}: ShopScreenProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const potionSlotsFull = potionCount >= MAX_POTION_SLOTS;

  return (
    <div className={styles.resultScreen}>
      <h1 className={styles.resultTitle}>{t('shopTitle')}</h1>
      <p className={styles.subtitle}>{t('shopSelect')}</p>
      <span className={styles.goldBadge}>💰 {gold}</span>

      <div className={`${styles.rewardCards} card-list`}>
        {shopCards.map((cardId) => {
          const def = CARD_DEFINITIONS[cardId];
          if (!def) return null;

          const price = getShopCardPrice(cardId, relics, ascension);
          const affordable = gold >= price;
          const name = getCardName(def.id, lang);
          const rarity = getCardRarity(cardId);

          return (
            <button
              key={cardId}
              className={`${cardStyles.card} card-item ${getCardTypeClass(def.type)} ${styles.rewardCard} ${affordable ? '' : cardStyles.cardDisabled}`}
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

      {(shopRelics.length > 0 || shopPotions.length > 0) && (
        <div className={styles.shopExtras}>
          {shopRelics.map((relicId) => (
            <button
              key={relicId}
              className={styles.shopItemBtn}
              disabled={gold < relicPrice}
              onClick={() => onBuyRelic(relicId)}
            >
              <span className={styles.shopItemName}>{RELIC_DEFINITIONS[relicId].emoji} {getRelicName(relicId, lang)}</span>
              <span className={styles.shopItemDesc}>{getRelicDescription(relicId, lang)}</span>
              <span className={styles.shopPrice}>💰 {relicPrice}</span>
            </button>
          ))}
          {shopPotions.map((potionId, index) => (
            <button
              key={`${potionId}-${index}`}
              className={styles.shopItemBtn}
              disabled={gold < potionPrice || potionSlotsFull}
              onClick={() => onBuyPotion(potionId)}
            >
              <span className={styles.shopItemName}>{POTION_DEFINITIONS[potionId].emoji} {getPotionName(potionId, lang)}</span>
              <span className={styles.shopItemDesc}>{getPotionDescription(potionId, lang)}</span>
              <span className={styles.shopPrice}>💰 {potionPrice}</span>
            </button>
          ))}
        </div>
      )}

      <button
        className={styles.resultBtn}
        disabled={gold < upgradePrice || upgradableCount === 0}
        onClick={onUpgradeService}
      >
        {t('shopUpgradeService', upgradePrice)}
      </button>
      <button
        className={styles.resultBtn}
        disabled={gold < removePrice || deckSize <= MIN_DECK_SIZE}
        onClick={onRemoveService}
      >
        {t('shopRemoveService', removePrice)}
      </button>
      <button className={styles.resultBtn} onClick={onLeave}>
        {t('shopLeave')}
      </button>
    </div>
  );
}
