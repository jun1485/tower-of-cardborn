const CARD_ART_DIRECTORY = '/assets/cards';
const CARD_ART_PLACEHOLDER_FILE = 'placeholder.svg';
const CARD_ART_EXTENSION = 'webp';
const CARD_ART_CACHE_VERSION = 'v6';
const UPGRADE_SUFFIX = '+';
const preloadedCardArtIds = new Set<string>();

function resolveBaseCardArtId(cardId: string): string {
  if (cardId.endsWith(UPGRADE_SUFFIX)) {
    return cardId.slice(0, -UPGRADE_SUFFIX.length);
  }
  return cardId;
}

export function getCardArtPath(cardId: string): string {
  return `${CARD_ART_DIRECTORY}/${cardId}.${CARD_ART_EXTENSION}?${CARD_ART_CACHE_VERSION}`;
}

export function getBaseCardArtPath(cardId: string): string {
  return `${CARD_ART_DIRECTORY}/${resolveBaseCardArtId(cardId)}.${CARD_ART_EXTENSION}?${CARD_ART_CACHE_VERSION}`;
}

export function getCardArtPlaceholderPath(): string {
  return `${CARD_ART_DIRECTORY}/${CARD_ART_PLACEHOLDER_FILE}?${CARD_ART_CACHE_VERSION}`;
}

/** 카드 이미지 선로딩 */
export function preloadCardArt(cardIds: readonly string[]): void {
  new Set(cardIds).forEach((cardId) => {
    if (preloadedCardArtIds.has(cardId)) return;
    preloadedCardArtIds.add(cardId);
    const image = new Image();
    image.addEventListener('error', () => preloadedCardArtIds.delete(cardId), { once: true });
    image.src = getCardArtPath(cardId);
  });
}
