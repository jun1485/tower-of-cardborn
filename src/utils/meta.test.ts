// 런 통계 정규화와 해금 규칙 검증

import { beforeEach, describe, expect, it } from 'vitest';
import { loadMeta, recordRunEnd, recordRunStart } from './meta';

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
    expect(result.meta).toMatchObject({ totalRuns: 1, totalWins: 1, bestFloor: 30, totalKills: 12 });
  });

  it('승리한 최고 승천 레벨을 누적한다', () => {
    recordRunEnd({ won: true, floor: 30, kills: 10, ascension: 4 });
    const result = recordRunEnd({ won: false, floor: 8, kills: 3, ascension: 5 });

    expect(result.meta.highestWonAscension).toBe(4);
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
  });
});
