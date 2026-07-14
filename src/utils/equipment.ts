// 런 간 유지되는 영구 장비 저장/강화 (강화석 재화 기반)

import type { RelicCombatBonuses } from '@tower-of-cardborn/game-core/types/relic';

const EQUIPMENT_KEY = 'tower-of-cardborn-equipment';

export type EquipmentSlot = 'weapon' | 'armor' | 'accessory' | 'boots' | 'ring' | 'talisman';

export const EQUIPMENT_SLOTS: readonly EquipmentSlot[] = ['weapon', 'armor', 'accessory', 'boots', 'ring', 'talisman'];
export const MAX_EQUIPMENT_LEVEL = 5;

/** 레벨별 무기 시작 힘 */
const WEAPON_STRENGTH: readonly number[] = [0, 1, 1, 2, 2, 3];
/** 레벨별 갑옷 최대 HP */
const ARMOR_MAX_HP: readonly number[] = [0, 4, 8, 12, 16, 20];
/** 레벨별 장신구 시작 골드 */
const ACCESSORY_GOLD: readonly number[] = [0, 15, 30, 45, 60, 80];
/** 레벨별 신발 시작 민첩 */
const BOOTS_DEXTERITY: readonly number[] = [0, 1, 1, 2, 2, 3];
/** 레벨별 반지 전투 시작 방어도 */
const RING_BLOCK: readonly number[] = [0, 3, 5, 8, 11, 15];
/** 레벨별 부적 강화석 획득 증가율(%) */
const TALISMAN_SHARD_PERCENT: readonly number[] = [0, 5, 10, 15, 20, 30];

export interface EquipmentState {
  /** 보유 강화석 */
  readonly shards: number;
  /** 슬롯별 강화 레벨 */
  readonly levels: Readonly<Record<EquipmentSlot, number>>;
}

/** 런 시작에 적용되는 장비 보너스 합계 */
export interface EquipmentBonuses {
  readonly strength: number;
  readonly maxHp: number;
  readonly gold: number;
  readonly dexterity: number;
  readonly block: number;
  /** 강화석 획득 증가율(%) */
  readonly shardPercent: number;
}

const DEFAULT_EQUIPMENT: EquipmentState = {
  shards: 0,
  levels: { weapon: 0, armor: 0, accessory: 0, boots: 0, ring: 0, talisman: 0 },
};

/** JSON 객체 형태 확인 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 레벨 범위 정규화 */
function normalizeLevel(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(MAX_EQUIPMENT_LEVEL, Math.floor(value)))
    : 0;
}

/** 강화석 수량 정규화 */
function normalizeShards(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

export function loadEquipment(): EquipmentState {
  try {
    const raw = localStorage.getItem(EQUIPMENT_KEY);
    if (!raw) return DEFAULT_EQUIPMENT;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return DEFAULT_EQUIPMENT;
    const levels = isRecord(parsed.levels) ? parsed.levels : {};
    return {
      shards: normalizeShards(parsed.shards),
      levels: {
        weapon: normalizeLevel(levels.weapon),
        armor: normalizeLevel(levels.armor),
        accessory: normalizeLevel(levels.accessory),
        boots: normalizeLevel(levels.boots),
        ring: normalizeLevel(levels.ring),
        talisman: normalizeLevel(levels.talisman),
      },
    };
  } catch {
    return DEFAULT_EQUIPMENT;
  }
}

function saveEquipment(state: EquipmentState): boolean {
  try {
    localStorage.setItem(EQUIPMENT_KEY, JSON.stringify(state));
    return true;
  } catch {
    console.error('장비 데이터를 저장하지 못했습니다.');
    return false;
  }
}

/** 장비 진행도 초기화 */
export function clearEquipment(): boolean {
  try {
    localStorage.removeItem(EQUIPMENT_KEY);
    return true;
  } catch {
    console.error('장비 데이터를 초기화하지 못했습니다.');
    return false;
  }
}

/** 다음 레벨 강화 비용 (최대 레벨이면 null) */
export function getUpgradeCost(level: number): number | null {
  return level >= MAX_EQUIPMENT_LEVEL ? null : 15 * (level + 1);
}

/** 슬롯별 레벨 효과 수치 조회 */
export function getSlotEffectValue(slot: EquipmentSlot, level: number): number {
  const normalized = normalizeLevel(level);
  if (slot === 'weapon') return WEAPON_STRENGTH[normalized];
  if (slot === 'armor') return ARMOR_MAX_HP[normalized];
  if (slot === 'accessory') return ACCESSORY_GOLD[normalized];
  if (slot === 'boots') return BOOTS_DEXTERITY[normalized];
  if (slot === 'ring') return RING_BLOCK[normalized];
  return TALISMAN_SHARD_PERCENT[normalized];
}

/** 현재 장비 보너스 합계 산출 */
export function getEquipmentBonuses(state = loadEquipment()): EquipmentBonuses {
  return {
    strength: getSlotEffectValue('weapon', state.levels.weapon),
    maxHp: getSlotEffectValue('armor', state.levels.armor),
    gold: getSlotEffectValue('accessory', state.levels.accessory),
    dexterity: getSlotEffectValue('boots', state.levels.boots),
    block: getSlotEffectValue('ring', state.levels.ring),
    shardPercent: getSlotEffectValue('talisman', state.levels.talisman),
  };
}

/** 유물 전투 보너스에 장비 힘·민첩·방어 가산 (일일 도전 제외) */
export function applyEquipmentCombatBonuses(bonuses: RelicCombatBonuses, isDaily: boolean): RelicCombatBonuses {
  if (isDaily) return bonuses;
  const equipment = getEquipmentBonuses();
  if (equipment.strength === 0 && equipment.dexterity === 0 && equipment.block === 0) return bonuses;
  return {
    ...bonuses,
    strength: bonuses.strength + equipment.strength,
    dexterity: bonuses.dexterity + equipment.dexterity,
    block: bonuses.block + equipment.block,
  };
}

/** 런 종료 강화석 획득량 산정 */
export function calculateShardReward(floor: number, won: boolean, isDaily = false): number {
  const base = Math.max(0, Math.floor(floor)) + (won ? 15 : 0);
  const shardPercent = isDaily ? 0 : getEquipmentBonuses().shardPercent;
  return Math.floor(base * (1 + shardPercent / 100));
}

/** 강화석 지급 */
export function addShards(amount: number): { state: EquipmentState; saved: boolean } {
  const prev = loadEquipment();
  const next: EquipmentState = { ...prev, shards: prev.shards + Math.max(0, Math.floor(amount)) };
  return { state: next, saved: saveEquipment(next) };
}

/** 슬롯 강화 (강화석 차감, 불가 시 현재 상태 유지) */
export function upgradeEquipment(slot: EquipmentSlot): { state: EquipmentState; upgraded: boolean; saved: boolean } {
  const prev = loadEquipment();
  const cost = getUpgradeCost(prev.levels[slot]);
  if (cost === null || prev.shards < cost) {
    return { state: prev, upgraded: false, saved: true };
  }
  const next: EquipmentState = {
    shards: prev.shards - cost,
    levels: { ...prev.levels, [slot]: prev.levels[slot] + 1 },
  };
  return { state: next, upgraded: true, saved: saveEquipment(next) };
}
