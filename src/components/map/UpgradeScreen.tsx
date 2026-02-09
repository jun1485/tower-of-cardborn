// 카드 강화 선택 화면: 덱에서 업그레이드 가능한 카드를 선택

import { CARD_DEFINITIONS, canUpgrade, getUpgradedId } from '../../data/cards';
import styles from '../../styles/app.module.css';
import cardStyles from '../../styles/card.module.css';
import { CardArtwork } from '../card/CardArtwork';

interface UpgradeScreenProps {
  readonly deck: readonly string[];
  readonly onUpgrade: (deckIndex: number) => void;
  readonly onSkip: () => void;
}

export function UpgradeScreen({ deck, onUpgrade, onSkip }: UpgradeScreenProps) {
  return (
    <div className={styles.resultScreen}>
      <h1 className={styles.resultTitle}>카드 강화</h1>
      <p className={styles.subtitle}>강화할 카드를 선택하세요</p>

      <div className={`${styles.upgradeGrid} card-list`}>
        {deck.map((cardId, index) => {
          const def = CARD_DEFINITIONS[cardId];
          if (!def) return null;

          const upgradable = canUpgrade(cardId);
          const upgradedDef = upgradable ? CARD_DEFINITIONS[getUpgradedId(cardId)] : null;
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
              onClick={() => upgradable && onUpgrade(index)}
            >
              <div className={cardStyles.cardCost}>{def.cost}</div>
              <div className={cardStyles.cardName}>{def.name}</div>
              <CardArtwork cardId={def.id} cardName={def.name} />
              <div className={cardStyles.cardDescription}>{def.description}</div>
              {upgradedDef && (
                <div className={styles.upgradePreview}>
                  → {upgradedDef.name}: {upgradedDef.description}
                </div>
              )}
              {!upgradable && def.upgraded && (
                <div className={styles.upgradeAlready}>강화 완료</div>
              )}
            </button>
          );
        })}
      </div>

      <button className={styles.resultBtn} onClick={onSkip}>
        건너뛰기
      </button>
    </div>
  );
}
