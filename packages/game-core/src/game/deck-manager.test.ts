// 덱 셔플/드로우/리셔플 규칙 검증

import { afterEach, describe, expect, it } from 'vitest';
import type { CardInstance } from '../types/card';
import { createSeededRandom, resetRandomSource, setRandomSource } from '../utils/random';
import { createDrawPile, discardHand, drawCards } from './deck-manager';

afterEach(() => {
  resetRandomSource();
});

/** 순번 기반 카드 인스턴스 목록 생성 */
function createCards(count: number, prefix = 'card'): CardInstance[] {
  return Array.from({ length: count }, (_, index) => ({
    instanceId: `${prefix}-${index}`,
    definitionId: prefix,
  }));
}

describe('드로우 파일 생성', () => {
  it('덱 전체를 고유 인스턴스로 변환한다', () => {
    const pile = createDrawPile(['strike', 'strike', 'defend']);

    expect(pile).toHaveLength(3);
    expect(new Set(pile.map((card) => card.instanceId)).size).toBe(3);
    expect(pile.map((card) => card.definitionId).sort()).toEqual(['defend', 'strike', 'strike']);
  });

  it('동일 시드에서 동일한 순서로 셔플한다', () => {
    setRandomSource(createSeededRandom(42));
    const first = createDrawPile(['a', 'b', 'c', 'd', 'e']).map((card) => card.definitionId);
    setRandomSource(createSeededRandom(42));
    const second = createDrawPile(['a', 'b', 'c', 'd', 'e']).map((card) => card.definitionId);

    expect(first).toEqual(second);
  });
});

describe('드로우', () => {
  it('요청 수만큼 패에 추가하고 드로우 파일에서 제거한다', () => {
    const result = drawCards(createCards(5), [], [], 3);

    expect(result.hand).toHaveLength(3);
    expect(result.drawPile).toHaveLength(2);
    expect(result.discardPile).toHaveLength(0);
  });

  it('드로우 파일 소진 시 버린 카드를 리셔플하여 계속 드로우한다', () => {
    const result = drawCards(createCards(1, 'draw'), [], createCards(4, 'discard'), 3);

    expect(result.hand).toHaveLength(3);
    expect(result.discardPile).toHaveLength(0);
    expect(result.drawPile).toHaveLength(2);
  });

  it('전체 카드가 부족하면 가능한 만큼만 드로우한다', () => {
    const result = drawCards(createCards(1, 'draw'), [], createCards(1, 'discard'), 5);

    expect(result.hand).toHaveLength(2);
    expect(result.drawPile).toHaveLength(0);
    expect(result.discardPile).toHaveLength(0);
  });

  it('기존 패를 유지한 채 드로우를 누적한다', () => {
    const result = drawCards(createCards(2, 'draw'), createCards(2, 'hand'), [], 1);

    expect(result.hand).toHaveLength(3);
    expect(result.hand.slice(0, 2).every((card) => card.definitionId === 'hand')).toBe(true);
  });
});

describe('패 버리기', () => {
  it('패 전체를 버린 카드 더미 뒤에 추가한다', () => {
    const result = discardHand(createCards(3, 'hand'), createCards(2, 'discard'));

    expect(result.hand).toHaveLength(0);
    expect(result.discardPile).toHaveLength(5);
    expect(result.discardPile.slice(2).every((card) => card.definitionId === 'hand')).toBe(true);
  });
});
