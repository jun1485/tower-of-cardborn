// 게임 상태 보상 결정성 검증

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetRandomSource, setRandomSeed } from '@tower-of-cardborn/game-core/utils/random';
import type { GameState } from '@tower-of-cardborn/game-core/types/game';
import { DEFAULT_GAME_STATE, loadValidGameState, rollCombatRewards } from './game-state';
import { saveGame } from './storage';

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

afterEach(() => {
  resetRandomSource();
});

describe('전투 보상', () => {
  it('같은 난수 상태에서 모든 보상 결과를 재현한다', () => {
    const state: GameState = {
      ...DEFAULT_GAME_STATE,
      screen: 'combat',
      map: {
        nodes: [{
          id: 'elite-1',
          floor: 1,
          pos: 0.5,
          type: 'elite',
          nextNodeIds: [],
          enemyIds: ['gremlin_nob'],
        }],
        currentNodeId: 'elite-1',
        visitedNodeIds: ['elite-1'],
        mapIndex: 1,
        totalMaps: 3,
        totalFloorsPerMap: 10,
      },
    };

    setRandomSeed(12345);
    const first = rollCombatRewards(state);
    setRandomSeed(12345);
    const second = rollCombatRewards(state);

    expect(second).toEqual(first);
  });
});

describe('보상 화면 복원', () => {
  it('포션 미획득 보상 화면을 다시 불러와도 보상을 재추첨하지 않는다', () => {
    const rewardState: GameState = {
      ...DEFAULT_GAME_STATE,
      screen: 'combat_reward',
      map: {
        nodes: [{
          id: 'combat-1',
          floor: 1,
          pos: 0.5,
          type: 'combat',
          nextNodeIds: [],
          enemyIds: ['jaw_worm'],
        }],
        currentNodeId: 'combat-1',
        visitedNodeIds: ['combat-1'],
        mapIndex: 1,
        totalMaps: 3,
        totalFloorsPerMap: 10,
      },
      rewardCards: ['strike', 'defend', 'strike'],
      rewardGold: 15,
      rewardPotion: null,
    };

    for (let attempt = 0; attempt < 20; attempt++) {
      expect(saveGame(rewardState)).toBe(true);
      const loaded = loadValidGameState();

      expect(loaded.rewardPotion).toBeNull();
      expect(loaded.rewardGold).toBe(15);
      expect(loaded.rewardCards).toEqual(rewardState.rewardCards);
    }
  });
});
