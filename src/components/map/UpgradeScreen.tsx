// 카드 강화 선택 화면: 덱에서 업그레이드 가능한 카드를 선택

import { CARD_DEFINITIONS, canUpgrade, getCardRarity, getUpgradedId } from '@tower-of-cardborn/game-core/data/cards';
import { useTranslation, useLanguage } from '../../i18n';
import { getCardName, generateCardDescription } from '../../i18n/card-text';
import styles from '../../styles/app.module.css';
import cardStyles from '../../styles/card.module.css';
import { CardArtwork } from '../card/CardArtwork';

interface UpgradeScreenProps {
  readonly deck: readonly string[];
  readonly canSkip: boolean;
  readonly onUpgrade: (deckIndex: number) => void;
  readonly onSkip: () => void;
}

export function UpgradeScreen({ deck, canSkip, onUpgrade, onSkip }: UpgradeScreenProps) {
  const t = useTranslation();
  const lang = useLanguage();

  return (
    <div className={styles.resultScreen}>
      <h1 className={styles.resultTitle}>{t('upgradeTitle')}</h1>
      <p className={styles.subtitle}>{t('upgradeSelect')}</p>

      <div className={`${styles.upgradeGrid} card-list`}>
        {deck.map((cardId, index) => {
          const def = CARD_DEFINITIONS[cardId];
          if (!def) return null;

          const upgradable = canUpgrade(cardId);
          const upgradedDef = upgradable ? CARD_DEFINITIONS[getUpgradedId(cardId)] : null;
          const name = getCardName(def.id, lang);
          const desc = generateCardDescription(def, t);
          const typeClassMap = {
            attack: cardStyles.cardAttack,
            skill: cardStyles.cardSkill,
            power: cardStyles.cardPower,
          };
          const typeClass = typeClassMap[def.type];

          return (
            <button
              key={index}
              className={`${styles.upgradeCard} card-item ${typeClass} ${!upgradable ? styles.upgradeCardDisabled : ''}`}
              disabled={!upgradable}
              data-rarity={getCardRarity(cardId)}
              onClick={() => upgradable && onUpgrade(index)}
            >
              <div className={cardStyles.cardCost}>{def.cost}</div>
              <div className={cardStyles.cardName}>{name}</div>
              <CardArtwork cardId={def.id} cardName={name} />
              <div className={cardStyles.cardDescription}>{desc}</div>
              {upgradedDef && (
                <div className={styles.upgradePreview}>
                  → {getCardName(upgradedDef.id, lang)}: {generateCardDescription(upgradedDef, t)}
                </div>
              )}
              {!upgradable && def.upgraded && (
                <div className={styles.upgradeAlready}>{t('alreadyUpgraded')}</div>
              )}
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
