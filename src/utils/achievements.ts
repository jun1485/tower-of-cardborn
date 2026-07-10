// 메타 통계 기반 업적 판정

import { MAX_ASCENSION } from '@tower-of-cardborn/game-core/data/ascension';
import type { MetaState } from './meta';

export type AchievementId = 'first_win' | 'slayer' | 'tower_clear' | 'ascension_master';

export interface AchievementProgress {
  readonly id: AchievementId;
  readonly unlocked: boolean;
}

/** 메타 통계별 업적 해금 상태 산출 */
export function getAchievementProgress(meta: MetaState): readonly AchievementProgress[] {
  return [
    { id: 'first_win', unlocked: meta.totalWins >= 1 },
    { id: 'slayer', unlocked: meta.totalKills >= 50 },
    { id: 'tower_clear', unlocked: meta.bestFloor >= 30 },
    { id: 'ascension_master', unlocked: meta.highestWonAscension >= MAX_ASCENSION },
  ];
}
