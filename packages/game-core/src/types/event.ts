// 이벤트 시스템 타입 정의

export type EventId =
  | 'blood_altar' | 'blacksmith' | 'locked_chest' | 'gambler'
  | 'mist' | 'wounded_mercenary' | 'shrine';

export type EventEffect =
  | { readonly type: 'gold'; readonly value: number; readonly variance?: number }
  | { readonly type: 'hp'; readonly value: number }
  | { readonly type: 'max_hp'; readonly value: number }
  | { readonly type: 'heal_full' }
  | { readonly type: 'random_card' }
  | { readonly type: 'remove_card'; readonly count: number }
  | { readonly type: 'upgrade_card'; readonly count: number }
  | {
      readonly type: 'gamble';
      readonly chance: number;
      readonly win: readonly EventEffect[];
      readonly lose: readonly EventEffect[];
      /** event-text 결과 키 접미사 */
      readonly winKey: string;
      readonly loseKey: string;
    };

/** 선택지 활성 조건 (미충족 시 버튼 비활성) */
export interface EventCondition {
  readonly minGold?: number;
  /** HP 소모 선택지 사망 방지 하한 */
  readonly minHp?: number;
  readonly minDeckSize?: number;
  readonly minUpgradable?: number;
}

export interface EventChoice {
  /** 라벨 {N} 치환 인자 */
  readonly labelArgs: readonly number[];
  readonly effects: readonly EventEffect[];
  readonly condition?: EventCondition;
  /** 확정 결과 텍스트 키 접미사. 없으면 후속 화면 또는 즉시 맵 복귀 */
  readonly resultKey?: string;
}

export interface GameEvent {
  readonly id: EventId;
  readonly emoji: string;
  /** 마지막 선택지는 항상 떠나기 (effects 빈 배열) */
  readonly choices: readonly EventChoice[];
}

/** 이벤트 결과 표시 상태 — 'card:<id>' 토큰은 화면에서 카드명 번역 */
export interface EventResult {
  readonly key: string;
  readonly args: readonly (string | number)[];
}
