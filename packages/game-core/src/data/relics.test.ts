// 유물 보상과 효과 규칙 검증

import { afterEach, describe, expect, it } from 'vitest';
import { resetRandomSource, setRandomSource } from '../utils/random';
import { applyRelicGoldBonus, getRelicCombatBonuses, getRelicReward } from './relics';

afterEach(() => {
  resetRandomSource();
});

describe('유물 시스템', () => {
  it('보유하지 않은 유물만 보상한다', () => {
    setRandomSource(() => 0);

    expect(getRelicReward(['iron_heart'])).toBe('energy_core');
    expect(getRelicReward(['iron_heart', 'energy_core', 'warrior_emblem', 'golden_idol'])).toBeNull();
  });

  it('에너지·힘·골드 효과를 산출한다', () => {
    expect(getRelicCombatBonuses(['energy_core', 'warrior_emblem'])).toEqual({ energy: 1, strength: 1 });
    expect(applyRelicGoldBonus(20, ['golden_idol'])).toBe(25);
  });
});
