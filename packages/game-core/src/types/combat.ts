// 전투 상태 타입 정의

import type { CardInstance, PowerType } from './card';
import type { Enemy, Player } from './character';

export type TurnPhase = 'player_turn' | 'enemy_turn';

export type CombatResult = 'ongoing' | 'victory' | 'defeat';

/** 플레이어 지속 파워 (매 턴 시작 발동) */
export interface PlayerPower {
  readonly type: PowerType;
  readonly value: number;
}

export interface CombatState {
  readonly player: Player;
  readonly enemies: readonly Enemy[];
  readonly drawPile: readonly CardInstance[];
  readonly hand: readonly CardInstance[];
  readonly discardPile: readonly CardInstance[];
  readonly exhaustPile: readonly CardInstance[];
  /** 지속 파워 목록 (구버전 저장 호환 옵셔널) */
  readonly powers?: readonly PlayerPower[];
  readonly turn: number;
  readonly phase: TurnPhase;
  readonly result: CombatResult;
  /** 승천 난이도 레벨 (적 강화 배율 기준) */
  readonly ascension: number;
  /** 현재 액트 번호 */
  readonly mapIndex: number;
}
