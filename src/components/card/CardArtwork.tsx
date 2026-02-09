import type { SyntheticEvent } from 'react';
import styles from '../../styles/card.module.css';
import { getBaseCardArtPath, getCardArtPath, getCardArtPlaceholderPath } from '../../utils/card-art';

interface CardArtworkProps {
  readonly cardId: string;
  readonly cardName: string;
}

export function CardArtwork({ cardId, cardName }: CardArtworkProps) {
  const handleCardArtworkError = (event: SyntheticEvent<HTMLImageElement>): void => {
    const image = event.currentTarget;
    const fallbackStep = image.dataset.fallbackStep ?? 'initial';
    if (fallbackStep === 'initial') {
      image.dataset.fallbackStep = 'base';
      image.src = getBaseCardArtPath(cardId);
      return;
    }
    if (fallbackStep === 'base') {
      image.dataset.fallbackStep = 'placeholder';
      image.src = getCardArtPlaceholderPath();
    }
  };

  return (
    <div className={styles.cardArtwork}>
      <img
        className={styles.cardArtworkImage}
        src={getCardArtPath(cardId)}
        alt={`${cardName} 카드 일러스트`}
        loading="lazy"
        onError={handleCardArtworkError}
      />
    </div>
  );
}
