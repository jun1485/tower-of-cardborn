// 게임 전체 상태 타입 정의

import type { CombatState } from './combat';
import type { GameMap } from './map';

export type GameScreen = 'title' | 'map' | 'combat' | 'combat_reward' | 'rest' | 'upgrade' | 'game_over' | 'victory';

export type CharacterClass = 'warrior' | 'archer' | 'mage' | 'assassin';

export interface GameState {
  readonly screen: GameScreen;
  readonly combatState: CombatState | null;
  /** 플레이어 보유 덱 (카드 정의 ID 목록) */
  readonly deck: readonly string[];
  /** 플레이어 현재/최대 HP (전투 간 유지) */
  readonly playerHp: number;
  readonly playerMaxHp: number;
  /** 맵 데이터 */
  readonly map: GameMap | null;
  /** 선택한 직업 */
  readonly characterClass: CharacterClass;
  /** 전투 보상 카드 후보 (새로고침 복원용) */
  readonly rewardCards: readonly string[];
}
