// 전투 보상 카드 선택 화면

import { CARD_DEFINITIONS, getCardRarity } from '@tower-of-cardborn/game-core/data/cards';
import { useTranslation, useLanguage } from '../../i18n';
import { getCardName, generateCardDescription, getCardRarityName, getCardTypeName } from '../../i18n/card-text';
import { getCardKeywords } from '../../i18n/card-keywords';
import styles from '../../styles/app.module.css';
import cardStyles from '../../styles/card.module.css';
import { CardArtwork } from '../card/CardArtwork';
import { getCardTypeClass } from '../card/card-type-class';
import { RELIC_DEFINITIONS } from '@tower-of-cardborn/game-core/data/relics';
import type { RelicId } from '@tower-of-cardborn/game-core/types/relic';
import { getRelicDescription, getRelicName } from '../../i18n/relic-text';
import { POTION_DEFINITIONS } from '@tower-of-cardborn/game-core/data/potions';
import type { PotionId } from '@tower-of-cardborn/game-core/types/potion';
import { getPotionDescription, getPotionName } from '../../i18n/potion-text';

interface RewardScreenProps {
  /** 보상 출처 (보물 상자는 카드 보상 없음) */
  readonly variant?: 'combat' | 'treasure';
  readonly rewardCards: readonly string[];
  readonly rewardGold: number;
  readonly rewardRelic: RelicId | null;
  readonly rewardPotion: PotionId | null;
  readonly onPick: (cardId: string) => void;
  readonly onSkip: () => void;
}

export function RewardScreen({ variant = 'combat', rewardCards, rewardGold, rewardRelic, rewardPotion, onPick, onSkip }: RewardScreenProps) {
  const t = useTranslation();
  const lang = useLanguage();

  return (
    <div className={styles.resultScreen}>
      <h1 className={`${styles.resultTitle} ${styles.victoryTitle}`}>
        {variant === 'treasure' ? t('treasureTitle') : t('victory')}
      </h1>
      {rewardCards.length > 0 && <p className={styles.subtitle}>{t('selectCard')}</p>}
      {rewardGold > 0 && <span className={styles.goldBadge}>{t('goldReward', rewardGold)}</span>}
      {rewardRelic && (
        <section className={styles.relicReward} aria-label={t('relicReward')}>
          <span className={styles.relicIcon} aria-hidden="true">{RELIC_DEFINITIONS[rewardRelic].emoji}</span>
          <div>
            <strong>{t('relicReward')}: {getRelicName(rewardRelic, lang)}</strong>
            <p>{getRelicDescription(rewardRelic, lang)}</p>
          </div>
        </section>
      )}
      {rewardPotion && (
        <section className={styles.potionReward} aria-label={t('potionReward')}>
          <span className={styles.potionIcon} aria-hidden="true">{POTION_DEFINITIONS[rewardPotion].emoji}</span>
          <div>
            <strong>{t('potionReward')}: {getPotionName(rewardPotion, lang)}</strong>
            <p>{getPotionDescription(rewardPotion, lang)}</p>
          </div>
        </section>
      )}
      <div className={`${styles.rewardCards} card-list`}>
        {rewardCards.map((cardId) => {
          const def = CARD_DEFINITIONS[cardId];
          if (!def) return null;
          const keywords = getCardKeywords(def, t);
          const name = getCardName(def.id, lang);
          const desc = generateCardDescription(def, t);
          const rarity = getCardRarity(cardId);
          const typeClass = getCardTypeClass(def.type);
          return (
            <button
              key={cardId}
              className={`${cardStyles.card} card-item ${typeClass} ${styles.rewardCard}`}
              data-rarity={rarity}
              onClick={() => onPick(cardId)}
            >
              <div className={cardStyles.cardCost}>{def.cost}</div>
              <div className={cardStyles.cardName}>{name}</div>
              <CardArtwork cardId={def.id} cardName={name} />
              <div className={cardStyles.cardDescription}>{desc}</div>
              <div className={cardStyles.cardType}>{getCardTypeName(def.type, t)} · {getCardRarityName(rarity, t)}</div>
              {keywords.length > 0 && (
                <div className={cardStyles.cardTooltip}>
                  {keywords.map((kw) => (
                    <div key={kw}>{kw}</div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <button className={styles.resultBtn} onClick={onSkip}>
        {rewardCards.length > 0 ? t('skipCard') : t('eventContinue')}
      </button>
    </div>
  );
}
