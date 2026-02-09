// 덱 관리: 셔플, 드로우, 버리기, 리셔플

import type { CardInstance } from '../types/card';
import { generateId, shuffle } from '../utils/random';

/** 카드 정의 ID 목록 → 셔플된 CardInstance 배열 생성 */
export function createDrawPile(deckIds: readonly string[]): CardInstance[] {
  const cards: CardInstance[] = deckIds.map((definitionId) => ({
    instanceId: generateId(),
    definitionId,
  }));
  return shuffle(cards);
}

interface DrawResult {
  readonly hand: readonly CardInstance[];
  readonly drawPile: readonly CardInstance[];
  readonly discardPile: readonly CardInstance[];
}

/** 드로우 파일에서 count장 드로우 (부족 시 버린 카드 리셔플) */
export function drawCards(
  drawPile: readonly CardInstance[],
  hand: readonly CardInstance[],
  discardPile: readonly CardInstance[],
  count: number,
): DrawResult {
  let currentDraw = [...drawPile];
  let currentDiscard = [...discardPile];
  const currentHand = [...hand];

  for (let i = 0; i < count; i++) {
    // 드로우 파일 소진 시 리셔플
    if (currentDraw.length === 0) {
      if (currentDiscard.length === 0) break;
      currentDraw = shuffle(currentDiscard);
      currentDiscard = [];
    }
    const card = currentDraw.pop();
    if (card) currentHand.push(card);
  }

  return {
    hand: currentHand,
    drawPile: currentDraw,
    discardPile: currentDiscard,
  };
}

/** 패 전체를 버린 카드 더미로 이동 */
export function discardHand(
  hand: readonly CardInstance[],
  discardPile: readonly CardInstance[],
): { hand: readonly CardInstance[]; discardPile: readonly CardInstance[] } {
  return {
    hand: [],
    discardPile: [...discardPile, ...hand],
  };
}
