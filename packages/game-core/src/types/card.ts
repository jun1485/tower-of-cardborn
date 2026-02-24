// 카드 시스템 타입 정의

export type CardType = 'attack' | 'skill' | 'power';

export type TargetType = 'single' | 'all';

export type StatusEffectType = 'vulnerable' | 'weak' | 'strength';

export interface CardEffect {
  readonly type: 'damage' | 'block' | 'draw' | 'apply_status' | 'gain_strength' | 'gain_energy' | 'self_damage' | 'heal';
  readonly value: number;
  readonly target?: TargetType;
  readonly statusType?: StatusEffectType;
}

export interface CardDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: CardType;
  readonly cost: number;
  readonly effects: readonly CardEffect[];
  /** 업그레이드 카드 ID (없으면 업그레이드 불가) */
  readonly upgradeId?: string;
  /** 업그레이드 여부 표시 */
  readonly upgraded?: boolean;
  /** 사용 후 소멸 (exhaustPile로 이동) */
  readonly exhaust?: boolean;
}

/** 전투 중 사용되는 카드 인스턴스 (고유 instanceId로 구분) */
export interface CardInstance {
  readonly instanceId: string;
  readonly definitionId: string;
}
