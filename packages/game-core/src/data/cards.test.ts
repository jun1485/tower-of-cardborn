// 카드 희귀도·보상·가격 규칙 검증

import { afterEach, describe, expect, it } from 'vitest';
import { resetRandomSource, setRandomSource } from '../utils/random';
import { getCardPrice, getCardRarity, getRewardCards } from './cards';

afterEach(() => {
  resetRandomSource();
});

describe('카드 희귀도', () => {
  it('시작·일반·고급·희귀 카드를 구분한다', () => {
    expect(getCardRarity('strike')).toBe('starter');
    expect(getCardRarity('shrug_it_off')).toBe('common');
    expect(getCardRarity('carnage')).toBe('uncommon');
    expect(getCardRarity('bludgeon')).toBe('rare');
    expect(getCardRarity('bludgeon+')).toBe('rare');
  });

  it('희귀도와 코스트를 상점 가격에 반영한다', () => {
    expect(getCardPrice('bludgeon')).toBeGreaterThan(getCardPrice('carnage'));
    expect(getCardPrice('carnage')).toBeGreaterThan(getCardPrice('shrug_it_off'));
  });
});

describe('카드 보상', () => {
  it('직업 보상 풀에서 중복 없이 선택한다', () => {
    setRandomSource(() => 0.25);
    const rewards = getRewardCards(5, 'assassin');

    expect(rewards).toHaveLength(5);
    expect(new Set(rewards).size).toBe(5);
    expect(rewards.every((cardId) => !['strike', 'magic_bolt', 'quick_shot'].includes(cardId))).toBe(true);
  });
});
