// 전투 상태 타입 정의

import type { CardInstance } from './card';
import type { Enemy, Player } from './character';

export type TurnPhase = 'player_turn' | 'enemy_turn';

export type CombatResult = 'ongoing' | 'victory' | 'defeat';

export interface CombatState {
  readonly player: Player;
  readonly enemies: readonly Enemy[];
  readonly drawPile: readonly CardInstance[];
  readonly hand: readonly CardInstance[];
  readonly discardPile: readonly CardInstance[];
  readonly exhaustPile: readonly CardInstance[];
  readonly turn: number;
  readonly phase: TurnPhase;
  readonly result: CombatResult;
}
