// 포션 보상과 보유 한도 정의

import type { NodeType } from '../types/map';
import type { PotionDefinition, PotionId } from '../types/potion';
import { random } from '../utils/random';

export const MAX_POTION_SLOTS = 2;

export const POTION_DEFINITIONS: Record<PotionId, PotionDefinition> = {
  healing_potion: { id: 'healing_potion', emoji: '🧪' },
  block_potion: { id: 'block_potion', emoji: '🛡️' },
  fire_potion: { id: 'fire_potion', emoji: '🔥' },
  energy_potion: { id: 'energy_potion', emoji: '⚡' },
  strength_potion: { id: 'strength_potion', emoji: '💪' },
  toxin_potion: { id: 'toxin_potion', emoji: '☠️' },
};

/** 적 대상 지정이 필요한 포션 */
export const TARGETED_POTION_IDS: ReadonlySet<PotionId> = new Set(['fire_potion', 'toxin_potion']);

/** 노드 유형별 포션 보상 추첨 */
export function rollPotionReward(nodeType: NodeType | undefined, inventorySize: number): PotionId | null {
  if (inventorySize >= MAX_POTION_SLOTS || (nodeType !== 'combat' && nodeType !== 'elite')) return null;
  const potionIds = Object.keys(POTION_DEFINITIONS) as PotionId[];
  return potionIds[Math.floor(random() * potionIds.length)];
}
