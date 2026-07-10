// 게임 저장 복원과 손상 데이터 처리 검증

import { beforeEach, describe, expect, it } from 'vitest';
import type { GameState } from '@tower-of-cardborn/game-core/types/game';
import { clearSave, loadGame, saveGame } from './storage';

const values = new Map<string, string>();
const storage: Storage = {
  get length() { return values.size; },
  clear: () => values.clear(),
  getItem: (key) => values.get(key) ?? null,
  key: (index) => [...values.keys()][index] ?? null,
  removeItem: (key) => values.delete(key),
  setItem: (key, value) => values.set(key, value),
};

const GAME_STATE: GameState = {
  screen: 'title',
  combatState: null,
  deck: ['strike'],
  playerHp: 80,
  playerMaxHp: 80,
  map: null,
  characterClass: 'warrior',
  rewardCards: [],
  gold: 60,
  rewardGold: 0,
  shopCards: [],
  removeSource: null,
  kills: 0,
  ascension: 0,
  eventId: null,
  eventResult: null,
  seenEventIds: [],
  pendingRemoveCount: 0,
  pendingUpgradeCount: 0,
  upgradeSource: null,
  runRecorded: false,
  unlockedAscension: null,
  runSeed: null,
  randomState: null,
};

beforeEach(() => {
  values.clear();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
});

describe('게임 저장', () => {
  it('유효한 게임 상태를 저장하고 복원한다', () => {
    expect(saveGame(GAME_STATE)).toBe(true);
    expect(loadGame()).toEqual(GAME_STATE);
  });

  it('손상된 JSON을 제거하고 초기 상태로 복구한다', () => {
    localStorage.setItem('tower-of-cardborn-save', '{invalid');

    expect(loadGame()).toBeNull();
    expect(localStorage.getItem('tower-of-cardborn-save')).toBeNull();
  });

  it('필수 필드가 누락된 저장 상태를 제거한다', () => {
    localStorage.setItem('tower-of-cardborn-save', JSON.stringify({ version: 8, state: { screen: 'combat' } }));

    expect(loadGame()).toBeNull();
  });

  it('존재하지 않는 카드 ID가 포함된 저장 상태를 제거한다', () => {
    localStorage.setItem('tower-of-cardborn-save', JSON.stringify({
      version: 8,
      state: { ...GAME_STATE, deck: ['removed_card'] },
    }));

    expect(loadGame()).toBeNull();
  });

  it('존재하지 않는 맵 연결이 포함된 저장 상태를 제거한다', () => {
    localStorage.setItem('tower-of-cardborn-save', JSON.stringify({
      version: 8,
      state: {
        ...GAME_STATE,
        screen: 'map',
        map: {
          nodes: [{ id: 'node-1', floor: 1, pos: 0.5, type: 'combat', nextNodeIds: ['missing'], enemyIds: ['jaw_worm'] }],
          currentNodeId: null,
          visitedNodeIds: [],
          mapIndex: 1,
          totalMaps: 3,
          totalFloorsPerMap: 10,
        },
      },
    }));

    expect(loadGame()).toBeNull();
  });

  it('저장 데이터를 직접 초기화한다', () => {
    saveGame(GAME_STATE);
    clearSave();

    expect(loadGame()).toBeNull();
  });
});
