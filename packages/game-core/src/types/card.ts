// 카드 시스템 타입 정의

export type CardType = 'attack' | 'skill' | 'power' | 'curse';
export type CardRarity = 'starter' | 'common' | 'uncommon' | 'rare';

export type TargetType = 'single' | 'all';

export type StatusEffectType = 'vulnerable' | 'weak' | 'strength' | 'poison' | 'frail' | 'dexterity';

/** 지속 파워 종류 (매 턴 시작 트리거) */
export type PowerType = 'turn_start_block' | 'turn_start_strength' | 'turn_start_draw' | 'turn_start_heal';

export interface CardEffect {
  readonly type: 'damage' | 'block' | 'draw' | 'apply_status' | 'gain_strength' | 'gain_dexterity' | 'gain_energy' | 'self_damage' | 'heal' | 'add_power';
  readonly value: number;
  readonly target?: TargetType;
  readonly statusType?: StatusEffectType;
  readonly powerType?: PowerType;
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
  /** 사용 불가 카드 (저주) */
  readonly unplayable?: boolean;
}

/** 전투 중 사용되는 카드 인스턴스 (고유 instanceId로 구분) */
export interface CardInstance {
  readonly instanceId: string;
  readonly definitionId: string;
}
