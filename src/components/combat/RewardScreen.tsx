// 전투 보상 카드 선택 화면

import { CARD_DEFINITIONS } from '@tower-of-cardborn/game-core/data/cards';
import type { CardDefinition } from '@tower-of-cardborn/game-core/types/card';
import styles from '../../styles/app.module.css';
import cardStyles from '../../styles/card.module.css';
import { CardArtwork } from '../card/CardArtwork';

interface RewardScreenProps {
  readonly rewardCards: readonly string[];
  readonly onPick: (cardId: string) => void;
  readonly onSkip: () => void;
}

function getKeywords(def: CardDefinition): string[] {
  const keywords: string[] = [];
  for (const effect of def.effects) {
    if (effect.statusType === 'vulnerable' && !keywords.includes('취약: 받는 데미지 50% 증가'))
      keywords.push('취약: 받는 데미지 50% 증가');
    if (effect.statusType === 'weak' && !keywords.includes('약화: 주는 데미지 25% 감소'))
      keywords.push('약화: 주는 데미지 25% 감소');
    if (effect.type === 'gain_strength' && !keywords.includes('힘: 공격 카드 데미지 영구 증가'))
      keywords.push('힘: 공격 카드 데미지 영구 증가');
  }
  if (def.exhaust) keywords.push('소멸: 사용 후 이번 전투에서 제거');
  if (def.type === 'power') keywords.push('파워: 사용 시 영구 효과 발동');
  return keywords;
}

export function RewardScreen({ rewardCards, onPick, onSkip }: RewardScreenProps) {
  return (
    <div className={styles.resultScreen}>
      <h1 className={`${styles.resultTitle} ${styles.victoryTitle}`}>승리!</h1>
      <p className={styles.subtitle}>카드를 선택하세요</p>
      <div className={`${styles.rewardCards} card-list`}>
        {rewardCards.map((cardId) => {
          const def = CARD_DEFINITIONS[cardId];
          if (!def) return null;
          const keywords = getKeywords(def);
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
              onClick={() => onPick(cardId)}
            >
              <div className={cardStyles.cardCost}>{def.cost}</div>
              <div className={cardStyles.cardName}>{def.name}</div>
              <CardArtwork cardId={def.id} cardName={def.name} />
              <div className={cardStyles.cardDescription}>{def.description}</div>
              <div className={cardStyles.cardType}>{def.type}</div>
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
        건너뛰기
      </button>
    </div>
  );
}
