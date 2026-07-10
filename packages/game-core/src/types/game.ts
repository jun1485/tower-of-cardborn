// 게임 전체 상태 타입 정의

import type { CombatState } from './combat';
import type { GameMap } from './map';
import type { EventId, EventResult } from './event';

export type GameScreen = 'title' | 'map' | 'combat' | 'combat_reward' | 'rest' | 'upgrade' | 'remove_card' | 'shop' | 'event' | 'game_over' | 'victory';

export type CharacterClass = 'warrior' | 'archer' | 'mage' | 'assassin';

/** 카드 제거 화면 진입 출처 (복귀 화면/비용 결정) */
export type RemoveSource = 'rest' | 'shop' | 'event';

/** 카드 강화 화면 진입 출처 */
export type UpgradeSource = 'rest' | 'event';

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
  /** 보유 골드 */
  readonly gold: number;
  /** 전투 승리 보상 골드 (보상 확정 시 지급) */
  readonly rewardGold: number;
  /** 상점 판매 카드 목록 (새로고침 복원용) */
  readonly shopCards: readonly string[];
  /** 카드 제거 화면 진입 출처 */
  readonly removeSource: RemoveSource | null;
  /** 누적 처치 수 (런 통계) */
  readonly kills: number;
  /** 현재 런의 승천 난이도 레벨 */
  readonly ascension: number;
  /** 진행 중 이벤트 ID (새로고침 복원용) */
  readonly eventId: EventId | null;
  /** 이벤트 결과 표시 상태 (null = 선택 대기) */
  readonly eventResult: EventResult | null;
  /** 런 내 열람 이벤트 이력 (중복 방지) */
  readonly seenEventIds: readonly string[];
  /** 이벤트발 잔여 카드 제거/강화 횟수 */
  readonly pendingRemoveCount: number;
  readonly pendingUpgradeCount: number;
  /** 강화 화면 진입 출처 */
  readonly upgradeSource: UpgradeSource | null;
  /** 메타 통계 기록 완료 여부 (중복 기록 방지) */
  readonly runRecorded: boolean;
  /** 이번 런 신규 해금 승천 레벨 (승리 화면 배지용) */
  readonly unlockedAscension: number | null;
}
