// 이벤트 데이터 정의 (수치는 event-text 라벨 {N} 인자와 동기)

import type { GameEvent } from '../types/event';

export const EVENTS: readonly GameEvent[] = [
  {
    id: 'blood_altar',
    emoji: '🩸',
    choices: [
      {
        labelArgs: [12, 6],
        effects: [{ type: 'hp', value: -12 }, { type: 'max_hp', value: 6 }],
        condition: { minHp: 13 },
        resultKey: 'c1.r',
      },
      {
        labelArgs: [8, 25],
        effects: [{ type: 'hp', value: -8 }, { type: 'gold', value: 25 }],
        condition: { minHp: 9 },
        resultKey: 'c2.r',
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'blacksmith',
    emoji: '⚒️',
    choices: [
      {
        labelArgs: [],
        effects: [{ type: 'upgrade_card', count: 1 }],
        condition: { minUpgradable: 1 },
      },
      {
        labelArgs: [30],
        effects: [{ type: 'gold', value: -30 }, { type: 'upgrade_card', count: 2 }],
        condition: { minGold: 30, minUpgradable: 2 },
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'locked_chest',
    emoji: '🎁',
    choices: [
      {
        labelArgs: [12, 40, 55],
        effects: [{ type: 'hp', value: -12 }, { type: 'gold', value: 40, variance: 15 }],
        condition: { minHp: 13 },
        resultKey: 'c1.r',
      },
      {
        labelArgs: [50, 25],
        effects: [{
          type: 'gamble',
          chance: 0.5,
          win: [{ type: 'gold', value: 25 }],
          lose: [],
          winKey: 'c2.win',
          loseKey: 'c2.lose',
        }],
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'gambler',
    emoji: '🎲',
    choices: [
      {
        labelArgs: [20, 50, 50],
        effects: [
          { type: 'gold', value: -20 },
          {
            type: 'gamble',
            chance: 0.5,
            win: [{ type: 'gold', value: 50 }],
            lose: [],
            winKey: 'win',
            loseKey: 'lose',
          },
        ],
        condition: { minGold: 20 },
      },
      {
        labelArgs: [45, 40, 120],
        effects: [
          { type: 'gold', value: -45 },
          {
            type: 'gamble',
            chance: 0.4,
            win: [{ type: 'gold', value: 120 }],
            lose: [],
            winKey: 'win',
            loseKey: 'lose',
          },
        ],
        condition: { minGold: 45 },
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'mist',
    emoji: '🌫️',
    choices: [
      {
        labelArgs: [5],
        effects: [{ type: 'hp', value: 5 }, { type: 'remove_card', count: 1 }],
        condition: { minDeckSize: 5 },
      },
      {
        labelArgs: [10, 2],
        effects: [{ type: 'hp', value: -10 }, { type: 'remove_card', count: 2 }],
        condition: { minHp: 11, minDeckSize: 8 },
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'wounded_mercenary',
    emoji: '🗡️',
    choices: [
      {
        labelArgs: [8],
        effects: [{ type: 'hp', value: -8 }, { type: 'random_card' }],
        condition: { minHp: 9 },
        resultKey: 'c1.r',
      },
      {
        labelArgs: [60, 45, 40, 12],
        effects: [{
          type: 'gamble',
          chance: 0.6,
          win: [{ type: 'gold', value: 45 }],
          lose: [{ type: 'hp', value: -12 }],
          winKey: 'c2.win',
          loseKey: 'c2.lose',
        }],
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'shrine',
    emoji: '⛲',
    choices: [
      {
        labelArgs: [25],
        effects: [{ type: 'gold', value: -25 }, { type: 'heal_full' }],
        condition: { minGold: 25 },
        resultKey: 'c1.r',
      },
      {
        labelArgs: [8],
        effects: [{ type: 'hp', value: 8 }],
        resultKey: 'c2.r',
      },
      { labelArgs: [], effects: [] },
    ],
  },
];

/** 이벤트 ID 조회 */
export function getEventById(eventId: string): GameEvent | undefined {
  return EVENTS.find((event) => event.id === eventId);
}
