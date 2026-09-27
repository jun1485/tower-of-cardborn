// 이벤트 조건과 결과 규칙 검증

import { afterEach, describe, expect, it } from 'vitest';
import { EVENTS, getEventById } from '../data/events';
import { resetRandomSource, setRandomSource } from '../utils/random';
import { isChoiceAvailable, pickRandomEvent, resolveEventChoice } from './event-engine';

afterEach(() => {
  resetRandomSource();
});

describe('이벤트 선택 조건', () => {
  it('이벤트 ID가 중복되지 않고 마지막 선택은 떠나기다', () => {
    expect(new Set(EVENTS.map((event) => event.id)).size).toBe(EVENTS.length);
    expect(EVENTS.every((event) => event.choices.at(-1)?.effects.length === 0)).toBe(true);
  });

  it('HP 소모로 사망하는 선택을 차단한다', () => {
    const event = getEventById('blood_altar');
    const choice = event?.choices[0];

    expect(choice && isChoiceAvailable(choice, { hp: 12, maxHp: 80, gold: 0, deckSize: 10, upgradableCount: 1 })).toBe(false);
  });

  it('최대 HP에서는 회복 선택을 차단한다', () => {
    const event = getEventById('healing_fountain');
    const choice = event?.choices[0];

    expect(choice && isChoiceAvailable(choice, { hp: 80, maxHp: 80, gold: 0, deckSize: 10, upgradableCount: 1 })).toBe(false);
  });
});

describe('이벤트 추첨', () => {
  it('엔들리스 액트에서는 액트 지정 이벤트까지 전체 풀에서 추첨한다', () => {
    const actLimited = EVENTS.filter((event) => event.acts);
    const seenAllButLast = EVENTS.filter((event) => event.id !== actLimited.at(-1)?.id).map((event) => event.id);

    expect(actLimited.length).toBeGreaterThan(0);
    expect(pickRandomEvent(seenAllButLast, 4).id).toBe(actLimited.at(-1)?.id);
  });

  it('일반 액트에서는 다른 액트 전용 이벤트를 제외한다', () => {
    const actOneOnly = EVENTS.filter((event) => event.acts && !event.acts.includes(3));

    for (let index = 0; index < 50; index++) {
      setRandomSource(() => index / 50);
      expect(actOneOnly.map((event) => event.id)).not.toContain(pickRandomEvent([], 3).id);
    }
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

  it('고대 도서관에서 HP를 지불하고 카드를 얻는다', () => {
    const event = getEventById('ancient_library');
    const choice = event?.choices[0];
    if (!event || !choice) throw new Error('이벤트 데이터가 없습니다.');
    setRandomSource(() => 0);

    const result = resolveEventChoice(event, choice, { hp: 50, maxHp: 80, gold: 0, characterClass: 'mage' });

    expect(result.hp).toBe(42);
    expect(result.gainedCardId).not.toBeNull();
  });

  it('치유의 샘에서 최대 HP를 높인다', () => {
    const event = getEventById('healing_fountain');
    const choice = event?.choices[1];
    if (!event || !choice) throw new Error('이벤트 데이터가 없습니다.');

    const result = resolveEventChoice(event, choice, { hp: 60, maxHp: 80, gold: 30, characterClass: 'warrior' });

    expect(result.gold).toBe(0);
    expect(result.maxHp).toBe(85);
    expect(result.hp).toBe(65);
  });
});
