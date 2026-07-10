// 전투 보상 카드 선택 화면

import { CARD_DEFINITIONS, getCardRarity } from '@tower-of-cardborn/game-core/data/cards';
import type { CardDefinition } from '@tower-of-cardborn/game-core/types/card';
import { useTranslation, useLanguage } from '../../i18n';
import type { TFunction } from '../../i18n';
import { getCardName, generateCardDescription, getCardRarityName, getCardTypeName } from '../../i18n/card-text';
import styles from '../../styles/app.module.css';
import cardStyles from '../../styles/card.module.css';
import { CardArtwork } from '../card/CardArtwork';

interface RewardScreenProps {
  readonly rewardCards: readonly string[];
  readonly rewardGold: number;
  readonly onPick: (cardId: string) => void;
  readonly onSkip: () => void;
}

/** 카드 정의에서 키워드 목록 추출 */
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

export function RewardScreen({ rewardCards, rewardGold, onPick, onSkip }: RewardScreenProps) {
  const t = useTranslation();
  const lang = useLanguage();

  return (
    <div className={styles.resultScreen}>
      <h1 className={`${styles.resultTitle} ${styles.victoryTitle}`}>{t('victory')}</h1>
      <p className={styles.subtitle}>{t('selectCard')}</p>
      {rewardGold > 0 && <span className={styles.goldBadge}>{t('goldReward', rewardGold)}</span>}
      <div className={`${styles.rewardCards} card-list`}>
        {rewardCards.map((cardId) => {
          const def = CARD_DEFINITIONS[cardId];
          if (!def) return null;
          const keywords = getKeywords(def, t);
          const name = getCardName(def.id, lang);
          const desc = generateCardDescription(def, t);
          const rarity = getCardRarity(cardId);
          const typeClassMap = {
            attack: cardStyles.cardAttack,
            skill: cardStyles.cardSkill,
            power: cardStyles.cardPower,
          };
          const typeClass = typeClassMap[def.type];
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
        {t('skip')}
      </button>
    </div>
  );
}
