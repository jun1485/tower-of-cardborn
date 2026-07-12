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
        condition: { minGold: 25, requiresMissingHp: true },
        resultKey: 'c1.r',
      },
      {
        labelArgs: [8],
        effects: [{ type: 'hp', value: 8 }],
        condition: { requiresMissingHp: true },
        resultKey: 'c2.r',
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'ancient_library',
    emoji: '📚',
    choices: [
      {
        labelArgs: [8],
        effects: [{ type: 'hp', value: -8 }, { type: 'random_card' }],
        condition: { minHp: 9 },
        resultKey: 'c1.r',
      },
      {
        labelArgs: [35],
        effects: [{ type: 'gold', value: -35 }, { type: 'upgrade_card', count: 1 }],
        condition: { minGold: 35, minUpgradable: 1 },
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'healing_fountain',
    emoji: '💧',
    choices: [
      {
        labelArgs: [15],
        effects: [{ type: 'hp', value: 15 }],
        condition: { requiresMissingHp: true },
        resultKey: 'c1.r',
      },
      {
        labelArgs: [30, 5],
        effects: [{ type: 'gold', value: -30 }, { type: 'max_hp', value: 5 }],
        condition: { minGold: 30 },
        resultKey: 'c2.r',
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'merchant_caravan',
    emoji: '🐫',
    choices: [
      {
        labelArgs: [35],
        effects: [{ type: 'gold', value: -35 }, { type: 'random_card' }],
        condition: { minGold: 35 },
        resultKey: 'c1.r',
      },
      {
        labelArgs: [40],
        effects: [{ type: 'gold', value: 40 }, { type: 'remove_card', count: 1 }],
        condition: { minDeckSize: 5 },
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'collapsed_mine',
    acts: [1, 2],
    emoji: '⛏️',
    choices: [
      {
        labelArgs: [10, 45, 65],
        effects: [{ type: 'hp', value: -10 }, { type: 'gold', value: 45, variance: 20 }],
        condition: { minHp: 11 },
        resultKey: 'c1.r',
      },
      {
        labelArgs: [60, 30, 8],
        effects: [{
          type: 'gamble',
          chance: 0.6,
          win: [{ type: 'gold', value: 30 }],
          lose: [{ type: 'hp', value: -8 }],
          winKey: 'c2.win',
          loseKey: 'c2.lose',
        }],
        condition: { minHp: 9 },
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'wandering_sage',
    acts: [1, 2],
    emoji: '🧙',
    choices: [
      {
        labelArgs: [],
        effects: [{ type: 'random_card' }],
        resultKey: 'c1.r',
      },
      {
        labelArgs: [25],
        effects: [{ type: 'gold', value: -25 }, { type: 'upgrade_card', count: 1 }],
        condition: { minGold: 25, minUpgradable: 1 },
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'cursed_idol',
    acts: [2, 3],
    emoji: '🗿',
    choices: [
      {
        labelArgs: [50, 8],
        effects: [{
          type: 'gamble',
          chance: 0.5,
          win: [{ type: 'gain_relic' }],
          lose: [{ type: 'hp', value: -8 }, { type: 'curse_card', cardId: 'curse_wound' }],
          winKey: 'c1.win',
          loseKey: 'c1.lose',
        }],
        condition: { minHp: 9, requiresRelicCandidate: true },
      },
      {
        labelArgs: [20],
        effects: [{ type: 'gold', value: 20 }],
        resultKey: 'c2.r',
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'forgotten_grave',
    acts: [2, 3],
    emoji: '🪦',
    choices: [
      {
        labelArgs: [40, 60, 10],
        effects: [{
          type: 'gamble',
          chance: 0.4,
          win: [{ type: 'gold', value: 60 }],
          lose: [{ type: 'hp', value: -10 }],
          winKey: 'c1.win',
          loseKey: 'c1.lose',
        }],
        condition: { minHp: 11 },
      },
      {
        labelArgs: [8],
        effects: [{ type: 'hp', value: 8 }],
        condition: { requiresMissingHp: true },
        resultKey: 'c2.r',
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'traveling_alchemist',
    emoji: '⚗️',
    choices: [
      {
        labelArgs: [5],
        effects: [{ type: 'hp', value: -5 }, { type: 'random_card' }],
        condition: { minHp: 6 },
        resultKey: 'c1.r',
      },
      {
        labelArgs: [20, 15],
        effects: [{ type: 'gold', value: -20 }, { type: 'hp', value: 15 }],
        condition: { minGold: 20, requiresMissingHp: true },
        resultKey: 'c2.r',
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'ancient_armory',
    acts: [2, 3],
    emoji: '🗡️',
    choices: [
      {
        labelArgs: [],
        effects: [{ type: 'random_card' }],
        resultKey: 'c1.r',
      },
      {
        labelArgs: [45],
        effects: [{ type: 'gold', value: -45 }, { type: 'gain_relic' }],
        condition: { minGold: 45, requiresRelicCandidate: true },
        resultKey: 'c2.r',
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'starlit_spring',
    acts: [1, 2],
    emoji: '✨',
    choices: [
      {
        labelArgs: [40],
        effects: [{ type: 'gold', value: -40 }, { type: 'heal_full' }],
        condition: { minGold: 40, requiresMissingHp: true },
        resultKey: 'c1.r',
      },
      {
        labelArgs: [10],
        effects: [{ type: 'hp', value: 10 }],
        condition: { requiresMissingHp: true },
        resultKey: 'c2.r',
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'goblin_toll',
    acts: [1],
    emoji: '👺',
    choices: [
      {
        labelArgs: [25],
        effects: [{ type: 'gold', value: -25 }],
        condition: { minGold: 25 },
        resultKey: 'c1.r',
      },
      {
        labelArgs: [50, 15],
        effects: [{
          type: 'gamble',
          chance: 0.5,
          win: [],
          lose: [{ type: 'hp', value: -15 }],
          winKey: 'c2.win',
          loseKey: 'c2.lose',
        }],
        condition: { minHp: 16 },
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'bookworm_scholar',
    emoji: '📖',
    choices: [
      {
        labelArgs: [20],
        effects: [{ type: 'gold', value: 20 }, { type: 'remove_card', count: 1 }],
        condition: { minDeckSize: 5 },
      },
      {
        labelArgs: [30],
        effects: [{ type: 'gold', value: -30 }, { type: 'random_card' }],
        condition: { minGold: 30 },
        resultKey: 'c2.r',
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'hermits_hut',
    emoji: '🛖',
    choices: [
      {
        labelArgs: [15],
        effects: [{ type: 'hp', value: 15 }],
        condition: { requiresMissingHp: true },
        resultKey: 'c1.r',
      },
      {
        labelArgs: [25, 5],
        effects: [{ type: 'gold', value: 25 }, { type: 'hp', value: -5 }],
        condition: { minHp: 6 },
        resultKey: 'c2.r',
      },
      { labelArgs: [], effects: [] },
    ],
  },
  {
    id: 'witch_hut',
    acts: [2, 3],
    emoji: '🧹',
    choices: [
      {
        labelArgs: [8],
        effects: [{ type: 'max_hp', value: 8 }, { type: 'curse_card', cardId: 'curse_burden' }],
        resultKey: 'c1.r',
      },
      {
        labelArgs: [25],
        effects: [{ type: 'gold', value: -25 }, { type: 'upgrade_card', count: 1 }],
        condition: { minGold: 25, minUpgradable: 1 },
      },
      { labelArgs: [], effects: [] },
    ],
  },
];

/** 이벤트 ID 조회 */
export function getEventById(eventId: string): GameEvent | undefined {
  return EVENTS.find((event) => event.id === eventId);
}
