// 영구 장비 저장/강화/보너스 규칙 검증

import { beforeEach, describe, expect, it } from 'vitest';
import {
  addShards, applyEquipmentCombatBonuses, calculateShardReward, clearEquipment,
  getEquipmentBonuses, getSlotEffectValue, getUpgradeCost, loadEquipment, upgradeEquipment,
} from './equipment';

const values = new Map<string, string>();
const storage: Storage = {
  get length() { return values.size; },
  clear: () => values.clear(),
  getItem: (key) => values.get(key) ?? null,
  key: (index) => [...values.keys()][index] ?? null,
  removeItem: (key) => values.delete(key),
  setItem: (key, value) => values.set(key, value),
};

const NO_BONUSES = { energy: 0, strength: 0, block: 0, dexterity: 0 };

beforeEach(() => {
  values.clear();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
});

describe('장비 강화', () => {
  it('강화 비용은 레벨에 비례하고 최대 레벨에서 중단된다', () => {
    expect(getUpgradeCost(0)).toBe(15);
    expect(getUpgradeCost(4)).toBe(75);
    expect(getUpgradeCost(5)).toBeNull();
  });

  it('강화석이 부족하면 강화하지 않는다', () => {
    addShards(10);
    const result = upgradeEquipment('weapon');

    expect(result.upgraded).toBe(false);
    expect(loadEquipment().levels.weapon).toBe(0);
    expect(loadEquipment().shards).toBe(10);
  });

  it('강화 시 강화석을 차감하고 레벨을 올린다', () => {
    addShards(50);
    const result = upgradeEquipment('armor');

    expect(result.upgraded).toBe(true);
    expect(result.state.levels.armor).toBe(1);
    expect(result.state.shards).toBe(35);
  });

  it('손상된 장비 데이터를 기본값으로 복원한다', () => {
    localStorage.setItem('tower-of-cardborn-equipment', JSON.stringify({ shards: -5, levels: { weapon: 99 } }));
    const state = loadEquipment();

    expect(state.shards).toBe(0);
    expect(state.levels.weapon).toBe(5);
    expect(state.levels.armor).toBe(0);
    expect(state.levels.talisman).toBe(0);
  });
});

describe('장비 보너스', () => {
  it('슬롯 레벨별 효과 수치를 산출한다', () => {
    expect(getSlotEffectValue('weapon', 5)).toBe(3);
    expect(getSlotEffectValue('armor', 3)).toBe(12);
    expect(getSlotEffectValue('accessory', 2)).toBe(30);
    expect(getSlotEffectValue('boots', 5)).toBe(3);
    expect(getSlotEffectValue('ring', 4)).toBe(11);
    expect(getSlotEffectValue('talisman', 5)).toBe(30);
  });

  it('보유 장비 보너스 합계를 산출한다', () => {
    addShards(200);
    upgradeEquipment('weapon');
    upgradeEquipment('weapon');
    upgradeEquipment('armor');

    expect(getEquipmentBonuses()).toEqual({
      strength: 1, maxHp: 4, gold: 0, dexterity: 0, block: 0, shardPercent: 0,
    });
  });

  it('일일 도전에는 장비 전투 보너스를 적용하지 않는다', () => {
    addShards(200);
    upgradeEquipment('weapon');
    upgradeEquipment('weapon');
    upgradeEquipment('boots');
    upgradeEquipment('ring');

    const applied = applyEquipmentCombatBonuses(NO_BONUSES, false);
    expect(applied.strength).toBe(1);
    expect(applied.dexterity).toBe(1);
    expect(applied.block).toBe(3);
    expect(applyEquipmentCombatBonuses(NO_BONUSES, true)).toEqual(NO_BONUSES);
  });

  it('초기화 후 기본 장비 상태로 복귀한다', () => {
    addShards(100);
    upgradeEquipment('weapon');
    clearEquipment();

    expect(loadEquipment()).toEqual({
      shards: 0,
      levels: { weapon: 0, armor: 0, accessory: 0, boots: 0, ring: 0, talisman: 0 },
    });
  });
});

describe('강화석 보상', () => {
  it('층수와 승리 보너스로 획득량을 산정한다', () => {
    expect(calculateShardReward(12, false)).toBe(12);
    expect(calculateShardReward(20, true)).toBe(35);
  });

  it('부적 레벨이 강화석 획득량을 증가시킨다', () => {
    addShards(15);
    upgradeEquipment('talisman');

    expect(calculateShardReward(20, true)).toBe(36);
    expect(calculateShardReward(20, true, true)).toBe(35);
  });
});
