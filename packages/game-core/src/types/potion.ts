// 포션 시스템 타입 정의

export type PotionId =
  | 'healing_potion' | 'block_potion' | 'fire_potion'
  | 'energy_potion' | 'strength_potion' | 'toxin_potion';

export interface PotionDefinition {
  readonly id: PotionId;
  readonly emoji: string;
}
