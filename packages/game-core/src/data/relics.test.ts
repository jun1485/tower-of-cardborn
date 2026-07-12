// 유물 보상과 효과 규칙 검증

import { afterEach, describe, expect, it } from 'vitest';
import { resetRandomSource, setRandomSource } from '../utils/random';
import {
  RELIC_DEFINITIONS, applyRelicGoldBonus, applyShopDiscount,
  getRelicCombatBonuses, getRelicMaxHpBonus, getRelicReward, getRelicRestHealBonus,
} from './relics';
import type { RelicId } from '../types/relic';

afterEach(() => {
  resetRandomSource();
});

const ALL_RELIC_IDS = Object.keys(RELIC_DEFINITIONS) as RelicId[];
const NORMAL_RELIC_IDS = ALL_RELIC_IDS.filter((id) => RELIC_DEFINITIONS[id].tier === 'normal');

describe('유물 시스템', () => {
  it('보유하지 않은 등급 내 유물만 보상한다', () => {
    setRandomSource(() => 0);

    const reward = getRelicReward(['iron_heart']);
    expect(reward && RELIC_DEFINITIONS[reward].tier).toBe('normal');
    expect(getRelicReward(NORMAL_RELIC_IDS)).toBeNull();
  });

  it('보스 등급 유물은 보스 풀에서만 보상한다', () => {
    setRandomSource(() => 0);

    const reward = getRelicReward([], 'boss');
    expect(reward && RELIC_DEFINITIONS[reward].tier).toBe('boss');
  });

  it('에너지·힘·골드 효과를 산출한다', () => {
    expect(getRelicCombatBonuses(['energy_core', 'warrior_emblem'])).toEqual({
      energy: 1, strength: 1, block: 0, dexterity: 0, powers: [],
    });
    expect(applyRelicGoldBonus(20, ['golden_idol'])).toBe(25);
  });

  it('방어·민첩 시작 보너스를 합산한다', () => {
    expect(getRelicCombatBonuses(['sturdy_aegis', 'dancers_anklet', 'void_prism'])).toEqual({
      energy: 0, strength: 1, block: 6, dexterity: 2, powers: [],
    });

    expect(getRelicCombatBonuses(['clockwork_heart', 'ancient_grimoire']).powers).toEqual([
      { type: 'turn_start_block', value: 2 },
      { type: 'turn_start_draw', value: 1 },
    ]);
  });

  it('획득·휴식·상점 보너스를 데이터에서 조회한다', () => {
    expect(getRelicMaxHpBonus('iron_heart')).toBe(8);
    expect(getRelicMaxHpBonus('titan_heart')).toBe(20);
    expect(getRelicRestHealBonus(['healing_charm'])).toBeCloseTo(0.15);
    expect(applyShopDiscount(100, ['merchants_ring'])).toBe(80);
  });
});
