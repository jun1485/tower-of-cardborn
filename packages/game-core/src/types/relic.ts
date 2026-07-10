// 유물 시스템 타입 정의

export type RelicId = 'iron_heart' | 'energy_core' | 'warrior_emblem' | 'golden_idol';

export interface RelicDefinition {
  readonly id: RelicId;
  readonly emoji: string;
}

export interface RelicCombatBonuses {
  readonly energy: number;
  readonly strength: number;
}
