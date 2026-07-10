// 이벤트 조건과 결과 규칙 검증

import { afterEach, describe, expect, it } from 'vitest';
import { getEventById } from '../data/events';
import { resetRandomSource, setRandomSource } from '../utils/random';
import { isChoiceAvailable, resolveEventChoice } from './event-engine';

afterEach(() => {
  resetRandomSource();
});

describe('이벤트 선택 조건', () => {
  it('HP 소모로 사망하는 선택을 차단한다', () => {
    const event = getEventById('blood_altar');
    const choice = event?.choices[0];

    expect(choice && isChoiceAvailable(choice, { hp: 12, gold: 0, deckSize: 10, upgradableCount: 1 })).toBe(false);
  });
});

describe('이벤트 결과', () => {
  it('회복량을 최대 HP 상한까지의 실제 변화량으로 표시한다', () => {
    const event = getEventById('shrine');
    const choice = event?.choices[1];
    if (!event || !choice) throw new Error('이벤트 데이터가 없습니다.');

    const result = resolveEventChoice(event, choice, { hp: 78, maxHp: 80, gold: 0, characterClass: 'warrior' });

    expect(result.hp).toBe(80);
    expect(result.result?.args).toEqual([2]);
  });

  it('고정 난수로 도박 승리 분기를 재현한다', () => {
    const event = getEventById('gambler');
    const choice = event?.choices[0];
    if (!event || !choice) throw new Error('이벤트 데이터가 없습니다.');
    setRandomSource(() => 0.1);

    const result = resolveEventChoice(event, choice, { hp: 80, maxHp: 80, gold: 20, characterClass: 'warrior' });

    expect(result.gold).toBe(50);
    expect(result.result?.key).toBe('gambler.win');
  });
});
