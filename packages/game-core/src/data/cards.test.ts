// 카드 희귀도·보상·가격 규칙 검증

import { afterEach, describe, expect, it } from 'vitest';
import { createSeededRandom, resetRandomSource, setRandomSource } from '../utils/random';
import { CARD_DEFINITIONS, getCardPrice, getCardRarity, getRewardCards, getStarterDeck } from './cards';

afterEach(() => {
  resetRandomSource();
});

describe('카드 희귀도', () => {
  it('카드 ID와 업그레이드 참조가 유효하다', () => {
    for (const [cardId, definition] of Object.entries(CARD_DEFINITIONS)) {
      expect(definition.id).toBe(cardId);
      expect(Number.isInteger(definition.cost) && definition.cost >= 0).toBe(true);
      expect(definition.effects.every((effect) => Number.isInteger(effect.value) && effect.value >= 0)).toBe(true);
      if (definition.upgradeId) {
        expect(CARD_DEFINITIONS[definition.upgradeId]?.upgraded).toBe(true);
      }
    }
  });

  it('모든 직업 시작 덱이 존재하는 카드만 사용한다', () => {
    const classes = ['warrior', 'archer', 'mage', 'assassin'] as const;

    expect(classes.every((characterClass) => (
      getStarterDeck(characterClass).every((cardId) => CARD_DEFINITIONS[cardId] !== undefined)
    ))).toBe(true);
  });

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

  it('보스 보상에서 희귀 카드 비중을 높인다', () => {
    setRandomSource(createSeededRandom(777));
    const normalRareCount = Array.from({ length: 200 }, () => getRewardCards(1, 'warrior', 'normal')[0])
      .filter((cardId) => getCardRarity(cardId) === 'rare').length;
    setRandomSource(createSeededRandom(777));
    const bossRareCount = Array.from({ length: 200 }, () => getRewardCards(1, 'warrior', 'boss')[0])
      .filter((cardId) => getCardRarity(cardId) === 'rare').length;

    expect(bossRareCount).toBeGreaterThan(normalRareCount);
  });
});
