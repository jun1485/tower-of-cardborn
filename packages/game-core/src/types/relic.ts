// 유물 시스템 타입 정의

import type { PlayerPower } from './combat';

export type RelicId =
  | 'iron_heart' | 'energy_core' | 'warrior_emblem' | 'golden_idol'
  | 'sturdy_aegis' | 'dancers_anklet' | 'healing_charm' | 'merchants_ring'
  | 'scouts_spyglass' | 'titan_heart' | 'berserker_totem' | 'void_prism'
  | 'clockwork_heart' | 'phoenix_feather' | 'ancient_grimoire';

/** 유물 등급 (boss는 보스 처치 보상 전용) */
export type RelicTier = 'normal' | 'boss';

export interface RelicDefinition {
  readonly id: RelicId;
  readonly emoji: string;
  readonly tier: RelicTier;
  /** 전투 시작 보너스 */
  readonly combatBonuses?: Partial<RelicCombatBonuses>;
  /** 전투 시작 부여 지속 파워 */
  readonly combatPowers?: readonly PlayerPower[];
  /** 획득 시 최대 HP 증가 */
  readonly maxHpBonus?: number;
  /** 전투 골드 보상 배율 */
  readonly goldMultiplier?: number;
  /** 휴식 회복률 가산 */
  readonly restHealBonus?: number;
  /** 상점 가격 배율 */
  readonly shopDiscount?: number;
  /** 전투 보상 카드 1장 추가 */
  readonly extraRewardCard?: boolean;
}

export interface RelicCombatBonuses {
  readonly energy: number;
  readonly strength: number;
  readonly block: number;
  readonly dexterity: number;
  /** 전투 시작 시 부여되는 지속 파워 */
  readonly powers?: readonly PlayerPower[];
}
