// 메타 업적 해금 규칙 검증

import { describe, expect, it } from 'vitest';
import type { MetaState } from './meta';
import { getAchievementProgress } from './achievements';

const META: MetaState = {
  totalRuns: 3,
  totalWins: 1,
  totalKills: 55,
  bestFloor: 30,
  ascensionUnlocked: 2,
  lastAscension: 1,
  highestWonAscension: 1,
  totalDailyWins: 0,
  lastDaily: null,
  recentRuns: [],
  bestRuns: [],
};

describe('메타 업적', () => {
  it('승리·처치·도달 업적을 통계에서 해금한다', () => {
    const result = getAchievementProgress(META);

    expect(result.find((achievement) => achievement.id === 'first_win')?.unlocked).toBe(true);
    expect(result.find((achievement) => achievement.id === 'slayer')?.unlocked).toBe(true);
    expect(result.find((achievement) => achievement.id === 'tower_clear')?.unlocked).toBe(true);
    expect(result.find((achievement) => achievement.id === 'ascension_master')?.unlocked).toBe(false);
  });

  it('최고 승천 난이도 승리 후 마스터 업적을 해금한다', () => {
    const result = getAchievementProgress({ ...META, highestWonAscension: 5 });

    expect(result.find((achievement) => achievement.id === 'ascension_master')?.unlocked).toBe(true);
  });

  it('일일 승리·등반 횟수·최고 점수 업적을 해금한다', () => {
    const result = getAchievementProgress({
      ...META,
      totalRuns: 20,
      totalDailyWins: 1,
      bestRuns: [{
        finishedAt: 0, won: true, floor: 30, kills: 100, ascension: 5,
        runSeed: null, characterClass: null, score: 1200, isDaily: false,
      }],
    });

    expect(result.find((achievement) => achievement.id === 'daily_champion')?.unlocked).toBe(true);
    expect(result.find((achievement) => achievement.id === 'veteran')?.unlocked).toBe(true);
    expect(result.find((achievement) => achievement.id === 'high_scorer')?.unlocked).toBe(true);
  });
});
