// 유물 보상과 전투 보너스 정의 (데이터 주도 효과)

import type { PlayerPower } from '../types/combat';
import type { RelicCombatBonuses, RelicDefinition, RelicId, RelicTier } from '../types/relic';
import { random } from '../utils/random';

export const RELIC_DEFINITIONS: Record<RelicId, RelicDefinition> = {
  // 일반 유물
  iron_heart: { id: 'iron_heart', emoji: '❤️‍🔥', tier: 'normal', maxHpBonus: 8 },
  warrior_emblem: { id: 'warrior_emblem', emoji: '🛡️', tier: 'normal', combatBonuses: { strength: 1 } },
  golden_idol: { id: 'golden_idol', emoji: '🗿', tier: 'normal', goldMultiplier: 1.25 },
  sturdy_aegis: { id: 'sturdy_aegis', emoji: '🔰', tier: 'normal', combatBonuses: { block: 6 } },
  dancers_anklet: { id: 'dancers_anklet', emoji: '🩰', tier: 'normal', combatBonuses: { dexterity: 1 } },
  healing_charm: { id: 'healing_charm', emoji: '🌿', tier: 'normal', restHealBonus: 0.15 },
  merchants_ring: { id: 'merchants_ring', emoji: '💍', tier: 'normal', shopDiscount: 0.8 },
  scouts_spyglass: { id: 'scouts_spyglass', emoji: '🔭', tier: 'normal', extraRewardCard: true },
  clockwork_heart: {
    id: 'clockwork_heart', emoji: '⚙️', tier: 'normal',
    combatPowers: [{ type: 'turn_start_block', value: 2 }],
  },
  // 보스 유물
  energy_core: { id: 'energy_core', emoji: '⚡', tier: 'boss', combatBonuses: { energy: 1 } },
  titan_heart: { id: 'titan_heart', emoji: '💗', tier: 'boss', maxHpBonus: 20 },
  berserker_totem: { id: 'berserker_totem', emoji: '🪬', tier: 'boss', combatBonuses: { strength: 2 } },
  void_prism: { id: 'void_prism', emoji: '🔮', tier: 'boss', combatBonuses: { strength: 1, dexterity: 1 } },
  phoenix_feather: {
    id: 'phoenix_feather', emoji: '🪶', tier: 'boss',
    combatPowers: [{ type: 'turn_start_heal', value: 2 }],
  },
  ancient_grimoire: {
    id: 'ancient_grimoire', emoji: '📜', tier: 'boss',
    combatPowers: [{ type: 'turn_start_draw', value: 1 }],
  },
};

/** 미보유 유물 무작위 선택 (등급별 풀) */
export function getRelicReward(ownedRelics: readonly RelicId[], tier: RelicTier = 'normal'): RelicId | null {
  const candidates = (Object.keys(RELIC_DEFINITIONS) as RelicId[])
    .filter((relicId) => RELIC_DEFINITIONS[relicId].tier === tier && !ownedRelics.includes(relicId));
  return candidates.length > 0 ? candidates[Math.floor(random() * candidates.length)] : null;
}

/** 상점 판매용 미보유 일반 유물 선택 */
export function rollShopRelic(ownedRelics: readonly RelicId[]): RelicId | null {
  return getRelicReward(ownedRelics, 'normal');
}

/** 유물 ID 여부 확인 */
export function isRelicId(value: string): value is RelicId {
  return Object.hasOwn(RELIC_DEFINITIONS, value);
}

/** 미보유 유물 후보 존재 여부 (난수 미사용) */
export function hasUnownedRelic(ownedRelics: readonly RelicId[], tier: RelicTier = 'normal'): boolean {
  return (Object.keys(RELIC_DEFINITIONS) as RelicId[])
    .some((relicId) => RELIC_DEFINITIONS[relicId].tier === tier && !ownedRelics.includes(relicId));
}

/** 보유 유물 전투 보너스 합산 (지속 파워 동일 종류 병합) */
export function getRelicCombatBonuses(ownedRelics: readonly RelicId[]): RelicCombatBonuses {
  const powerTotals = new Map<PlayerPower['type'], number>();
  const base = ownedRelics.reduce((total, relicId) => {
    const definition = RELIC_DEFINITIONS[relicId];
    for (const power of definition?.combatPowers ?? []) {
      powerTotals.set(power.type, (powerTotals.get(power.type) ?? 0) + power.value);
    }
    const bonuses = definition?.combatBonuses;
    if (!bonuses) return total;
    return {
      energy: total.energy + (bonuses.energy ?? 0),
      strength: total.strength + (bonuses.strength ?? 0),
      block: total.block + (bonuses.block ?? 0),
      dexterity: total.dexterity + (bonuses.dexterity ?? 0),
    };
  }, { energy: 0, strength: 0, block: 0, dexterity: 0 });
  return { ...base, powers: [...powerTotals].map(([type, value]) => ({ type, value })) };
}

/** 유물 골드 보상 배율 적용 */
export function applyRelicGoldBonus(gold: number, ownedRelics: readonly RelicId[]): number {
  return Math.floor(ownedRelics.reduce(
    (total, relicId) => total * (RELIC_DEFINITIONS[relicId]?.goldMultiplier ?? 1),
    gold,
  ));
}

/** 유물 획득 시 최대 HP 보너스 조회 */
export function getRelicMaxHpBonus(relicId: RelicId): number {
  return RELIC_DEFINITIONS[relicId]?.maxHpBonus ?? 0;
}

/** 유물 휴식 회복률 가산 합계 */
export function getRelicRestHealBonus(ownedRelics: readonly RelicId[]): number {
  return ownedRelics.reduce((total, relicId) => total + (RELIC_DEFINITIONS[relicId]?.restHealBonus ?? 0), 0);
}

/** 유물 상점 할인 적용 가격 */
export function applyShopDiscount(price: number, ownedRelics: readonly RelicId[]): number {
  return Math.floor(ownedRelics.reduce(
    (total, relicId) => total * (RELIC_DEFINITIONS[relicId]?.shopDiscount ?? 1),
    price,
  ));
}

/** 전투 보상 카드 추가 여부 */
export function hasExtraRewardCard(ownedRelics: readonly RelicId[]): boolean {
  return ownedRelics.some((relicId) => RELIC_DEFINITIONS[relicId]?.extraRewardCard);
}
