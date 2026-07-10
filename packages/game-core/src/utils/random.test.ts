// 시드 난수 재현성 검증

import { afterEach, describe, expect, it } from 'vitest';
import {
  createSeededRandom, getDailySeed, getRandomState, random, resetRandomSource,
  restoreRandomState, setRandomSeed,
} from './random';

afterEach(() => {
  resetRandomSource();
});

describe('일일 도전 시드', () => {
  it('같은 UTC 날짜에 같은 시드를 반환한다', () => {
    expect(getDailySeed(new Date('2026-07-10T01:00:00Z'))).toBe(getDailySeed(new Date('2026-07-10T23:00:00Z')));
  });

  it('다른 UTC 날짜에 다른 시드를 반환한다', () => {
    expect(getDailySeed(new Date('2026-07-10T23:59:59Z'))).not.toBe(getDailySeed(new Date('2026-07-11T00:00:00Z')));
  });
});

describe('시드 난수', () => {
  it('같은 시드에서 같은 수열을 생성한다', () => {
    const first = createSeededRandom(20260710);
    const second = createSeededRandom(20260710);

    expect(Array.from({ length: 10 }, first)).toEqual(Array.from({ length: 10 }, second));
  });

  it('다른 시드에서 다른 수열을 생성한다', () => {
    const first = createSeededRandom(1);
    const second = createSeededRandom(2);

    expect(Array.from({ length: 5 }, first)).not.toEqual(Array.from({ length: 5 }, second));
  });

  it('저장된 난수 상태에서 다음 수열을 이어간다', () => {
    setRandomSeed(1234);
    random();
    const savedState = getRandomState();
    const expected = random();
    restoreRandomState(savedState);

    expect(random()).toBe(expected);
  });
});
