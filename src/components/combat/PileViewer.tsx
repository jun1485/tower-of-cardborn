// 카드 파일 뷰어 (뽑을 카드 / 버린 카드 / 소멸 카드 목록)

import type { CardInstance } from '@tower-of-cardborn/game-core/types/card';
import { CARD_DEFINITIONS } from '@tower-of-cardborn/game-core/data/cards';
import styles from '../../styles/combat.module.css';
import cardStyles from '../../styles/card.module.css';
import { CardArtwork } from '../card/CardArtwork';

interface PileViewerProps {
  readonly title: string;
  readonly pile: readonly CardInstance[];
  readonly onClose: () => void;
}

export function PileViewer({ title, pile, onClose }: PileViewerProps) {
  return (
    <div className={styles.pileOverlay} onClick={onClose}>
      <div className={styles.pileModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.pileHeader}>
          <h2>{title} ({pile.length})</h2>
          <button className={styles.pileCloseBtn} onClick={onClose}>✕</button>
        </div>
        <div className={`${styles.pileGrid} card-list`}>
          {pile.map((card) => {
            const def = CARD_DEFINITIONS[card.definitionId];
            if (!def) return null;
            const typeClassMap = { attack: cardStyles.cardAttack, skill: cardStyles.cardSkill, power: cardStyles.cardPower };
            const typeClass = typeClassMap[def.type];
            return (
              <div key={card.instanceId} className={`${cardStyles.card} card-item ${typeClass}`}>
                <div className={cardStyles.cardCost}>{def.cost}</div>
                <div className={cardStyles.cardName}>{def.name}</div>
                <CardArtwork cardId={def.id} cardName={def.name} />
                <div className={cardStyles.cardDescription}>{def.description}</div>
                <div className={cardStyles.cardType}>{def.type}</div>
              </div>
            );
          })}
          {pile.length === 0 && <p className={styles.pileEmpty}>카드 없음</p>}
        </div>
      </div>
    </div>
  );
}
