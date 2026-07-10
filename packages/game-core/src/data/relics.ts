// 유물 보상과 전투 보너스 정의

import type { RelicCombatBonuses, RelicDefinition, RelicId } from '../types/relic';
import { random } from '../utils/random';

export const RELIC_DEFINITIONS: Record<RelicId, RelicDefinition> = {
  iron_heart: { id: 'iron_heart', emoji: '❤️‍🔥' },
  energy_core: { id: 'energy_core', emoji: '⚡' },
  warrior_emblem: { id: 'warrior_emblem', emoji: '🛡️' },
  golden_idol: { id: 'golden_idol', emoji: '🗿' },
};

/** 미보유 유물 무작위 선택 */
export function getRelicReward(ownedRelics: readonly RelicId[]): RelicId | null {
  const candidates = (Object.keys(RELIC_DEFINITIONS) as RelicId[])
    .filter((relicId) => !ownedRelics.includes(relicId));
  return candidates.length > 0 ? candidates[Math.floor(random() * candidates.length)] : null;
}

/** 보유 유물 전투 보너스 산출 */
export function getRelicCombatBonuses(ownedRelics: readonly RelicId[]): RelicCombatBonuses {
  return {
    energy: ownedRelics.includes('energy_core') ? 1 : 0,
    strength: ownedRelics.includes('warrior_emblem') ? 1 : 0,
  };
}

/** 황금 우상 골드 보너스 적용 */
export function applyRelicGoldBonus(gold: number, ownedRelics: readonly RelicId[]): number {
  return ownedRelics.includes('golden_idol') ? Math.floor(gold * 1.25) : gold;
}
