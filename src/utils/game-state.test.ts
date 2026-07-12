// 게임 상태 보상 결정성 검증

import { afterEach, describe, expect, it } from 'vitest';
import { resetRandomSource, setRandomSeed } from '@tower-of-cardborn/game-core/utils/random';
import type { GameState } from '@tower-of-cardborn/game-core/types/game';
import { DEFAULT_GAME_STATE, rollCombatRewards } from './game-state';

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
