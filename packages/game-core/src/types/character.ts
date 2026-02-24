// 플레이어/적 캐릭터 타입 정의

import type { StatusEffectType } from './card';

export interface StatusEffect {
  readonly type: StatusEffectType;
  readonly duration: number;
}

export interface Player {
  readonly hp: number;
  readonly maxHp: number;
  readonly block: number;
  readonly energy: number;
  readonly maxEnergy: number;
  readonly statusEffects: readonly StatusEffect[];
}

/** 적 행동 인텐트 */
export type IntentType = 'attack' | 'defend' | 'buff';

export interface Intent {
  readonly type: IntentType;
  readonly value: number;
}

export interface Enemy {
  readonly id: string;
  readonly name: string;
  readonly hp: number;
  readonly maxHp: number;
  readonly block: number;
  readonly intent: Intent;
  readonly statusEffects: readonly StatusEffect[];
  /** 적 AI 패턴 추적용 턴 카운터 */
  readonly turnCount: number;
  /** 적 정의 ID (enemy-ai에서 패턴 매칭용) */
  readonly definitionId: string;
}

export interface EnemyDefinition {
  readonly id: string;
  readonly name: string;
  readonly hp: number;
  readonly maxHp: number;
}
