// 런 통계 정규화와 해금 규칙 검증

import { beforeEach, describe, expect, it } from 'vitest';
import {
  calculateRunScore, findRecordedRun, getRankedRuns, isTopRunRecord, loadMeta,
  recordRunEnd, recordRunStart, updateRecordedRun,
} from './meta';
import { addShards, loadEquipment, upgradeEquipment } from './equipment';

const values = new Map<string, string>();
const storage: Storage = {
  get length() { return values.size; },
  clear: () => values.clear(),
  getItem: (key) => values.get(key) ?? null,
  key: (index) => [...values.keys()][index] ?? null,
  removeItem: (key) => values.delete(key),
  setItem: (key, value) => values.set(key, value),
};

beforeEach(() => {
  values.clear();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
});

describe('기록 런 조회', () => {
  it('엔들리스 사망 후에도 클리어 기록의 승리 점수를 조회한다', () => {
    const { recordedAt } = recordRunEnd({ won: true, floor: 30, kills: 10, ascension: 2 });
    updateRecordedRun(recordedAt, { floor: 34, kills: 12, ascension: 2 });

    expect(findRecordedRun(recordedAt)).toMatchObject({
      won: true,
      floor: 34,
      score: calculateRunScore({ floor: 34, kills: 12, won: true, ascension: 2 }),
    });
    expect(findRecordedRun(null)).toBeNull();
  });
});

describe('런 통계', () => {
  it('음수·소수·초과 승리 통계를 정규화한다', () => {
    localStorage.setItem('tower-of-cardborn-meta', JSON.stringify({
      version: 1,
      stats: { totalRuns: 2.9, totalWins: 9, totalKills: -4, bestFloor: 3.8 },
    }));

    expect(loadMeta()).toMatchObject({ totalRuns: 2, totalWins: 2, totalKills: 0, bestFloor: 3 });
  });

  it('승리 런의 다음 승천 레벨을 해금한다', () => {
    recordRunStart(0);
    const result = recordRunEnd({ won: true, floor: 30, kills: 12, ascension: 0 });

    expect(result.newlyUnlocked).toBe(1);
    expect(result.saved).toBe(true);
    expect(result.meta).toMatchObject({ totalRuns: 1, totalWins: 1, bestFloor: 30, totalKills: 12 });
  });

  it('승리한 최고 승천 레벨을 누적한다', () => {
    recordRunEnd({ won: true, floor: 30, kills: 10, ascension: 4 });
    const result = recordRunEnd({ won: false, floor: 8, kills: 3, ascension: 5 });

    expect(result.meta.highestWonAscension).toBe(4);
    expect(result.meta.totalRuns).toBe(2);
  });

  it('최근 종료 기록으로 누락된 도전 횟수를 복구한다', () => {
    localStorage.setItem('tower-of-cardborn-meta', JSON.stringify({
      version: 1,
      stats: {
        totalRuns: 0,
        recentRuns: [{ finishedAt: 1, won: false, floor: 4, kills: 2, ascension: 0 }],
      },
    }));

    expect(loadMeta().totalRuns).toBe(1);
  });

  it('종료한 런의 직업을 최근 기록에 보존한다', () => {
    const result = recordRunEnd({
      won: false,
      floor: 5,
      kills: 4,
      ascension: 0,
      characterClass: 'mage',
    });

    expect(result.meta.recentRuns[0].characterClass).toBe('mage');
  });

  it('런 종합 점수를 층·처치·승리·승천으로 산정한다', () => {
    expect(calculateRunScore({ floor: 10, kills: 20, won: false, ascension: 0 })).toBe(210);
    expect(calculateRunScore({ floor: 30, kills: 40, won: true, ascension: 2 })).toBe(770);
  });

  it('점수 상위 런을 순위표에 정렬 보관한다', () => {
    recordRunEnd({ won: false, floor: 5, kills: 2, ascension: 0 });
    recordRunEnd({ won: true, floor: 30, kills: 40, ascension: 2 });
    const result = recordRunEnd({ won: false, floor: 12, kills: 10, ascension: 0 });

    expect(result.meta.bestRuns.map((run) => run.score)).toEqual([770, 210, 81]);
  });

  it('이번 런이 최상단 순위 기록인 경우만 신기록으로 판정한다', () => {
    localStorage.setItem('tower-of-cardborn-meta', JSON.stringify({
      version: 1,
      stats: {
        bestRuns: [
          { finishedAt: 100, won: true, floor: 30, kills: 20, ascension: 0, score: 610 },
          { finishedAt: 200, won: true, floor: 30, kills: 20, ascension: 0, score: 610 },
          { finishedAt: 300, won: true, floor: 20, kills: 10, ascension: 0, score: 430, isDaily: true },
          { finishedAt: 400, won: true, floor: 20, kills: 10, ascension: 0, score: 430, isDaily: true },
        ],
      },
    }));

    expect(isTopRunRecord(100)).toBe(true);
    expect(isTopRunRecord(200)).toBe(false);
    expect(isTopRunRecord(300, true)).toBe(true);
    expect(isTopRunRecord(400, true)).toBe(false);
    expect(isTopRunRecord(null)).toBe(false);
  });

  it('전체 상위권 밖의 일일 기록도 일일 순위표에 보존한다', () => {
    const normalRuns = Array.from({ length: 10 }, (_, index) => ({
      finishedAt: index + 1,
      won: true,
      floor: 30,
      kills: 20,
      ascension: 0,
      score: 1000 - index,
    }));
    localStorage.setItem('tower-of-cardborn-meta', JSON.stringify({
      version: 1,
      stats: {
        bestRuns: [
          ...normalRuns,
          { finishedAt: 100, won: false, floor: 3, kills: 1, ascension: 0, score: 48, isDaily: true },
        ],
      },
    }));

    const meta = loadMeta();

    expect(getRankedRuns(meta.bestRuns)).toHaveLength(10);
    expect(getRankedRuns(meta.bestRuns, true).map((run) => run.finishedAt)).toEqual([100]);
  });

  it('동일 시각에 종료한 런에도 고유 기록 시각을 부여한다', () => {
    const first = recordRunEnd({ won: false, floor: 1, kills: 0, ascension: 0 });
    const second = recordRunEnd({ won: false, floor: 1, kills: 0, ascension: 0 });

    expect(second.recordedAt).toBeGreaterThan(first.recordedAt);
  });

  it('같은 날 일일 도전 재시도는 순위표와 일일 승리 수에서 제외한다', () => {
    const first = recordRunEnd({ won: false, floor: 5, kills: 2, ascension: 0, isDaily: true });
    const retry = recordRunEnd({ won: true, floor: 30, kills: 10, ascension: 0, isDaily: true });

    expect(retry.meta.bestRuns.map((run) => run.finishedAt)).toEqual([first.recordedAt]);
    expect(retry.meta.recentRuns[0]).toMatchObject({ finishedAt: retry.recordedAt, unranked: true });
    expect(retry.meta.totalDailyWins).toBe(0);
    expect(isTopRunRecord(retry.recordedAt, true)).toBe(false);
  });

  it('일일 도전 여부를 순위 기록에 보존한다', () => {
    const result = recordRunEnd({ won: true, floor: 30, kills: 10, ascension: 0, isDaily: true });

    expect(result.meta.bestRuns[0].isDaily).toBe(true);
  });

  it('일일 도전 강화석 보상에서 부적 효과를 제외한다', () => {
    addShards(15);
    upgradeEquipment('talisman');

    recordRunEnd({ won: true, floor: 20, kills: 10, ascension: 0, isDaily: true });

    expect(loadEquipment().shards).toBe(35);
  });

  it('런 종료 시 층수 기반 강화석을 지급한다', () => {
    recordRunEnd({ won: true, floor: 20, kills: 10, ascension: 0 });

    expect(loadEquipment().shards).toBe(35);
  });

  it('엔들리스 진행분이 기록된 승리 런의 층·점수를 상향한다', () => {
    const result = recordRunEnd({ won: true, floor: 30, kills: 40, ascension: 0 });
    const updated = updateRecordedRun(result.recordedAt, { floor: 45, kills: 70, ascension: 0 });
    const meta = loadMeta();

    expect(updated).toBe(true);
    expect(meta.bestFloor).toBe(45);
    expect(meta.bestRuns[0].floor).toBe(45);
    expect(meta.bestRuns[0].score).toBe(45 * 15 + 70 * 3 + 100);
    // 추가 15층만큼 강화석 증가 (기록 시 45 + 갱신 15)
    expect(loadEquipment().shards).toBe(60);
  });

  it('엔들리스 갱신은 승리 수·처치 누계를 중복 가산하지 않는다', () => {
    recordRunStart(0);
    const result = recordRunEnd({ won: true, floor: 30, kills: 40, ascension: 0 });
    updateRecordedRun(result.recordedAt, { floor: 40, kills: 60, ascension: 0 });
    const meta = loadMeta();

    expect(meta.totalWins).toBe(1);
    expect(meta.totalKills).toBe(40);
  });

  it('로컬 저장소 접근이 차단되어도 기본 통계를 반환한다', () => {
    const blockedStorage: Storage = {
      length: 0,
      clear: () => { throw new Error('blocked'); },
      getItem: () => { throw new Error('blocked'); },
      key: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    };
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: blockedStorage });

    expect(loadMeta()).toMatchObject({ totalRuns: 0, totalWins: 0, totalKills: 0 });
    expect(recordRunStart(0).saved).toBe(false);
  });
});
