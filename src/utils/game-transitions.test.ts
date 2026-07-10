// 맵과 이벤트 상태 전환 규칙 검증

import { describe, expect, it } from 'vitest';
import type { GameState } from '@tower-of-cardborn/game-core/types/game';
import {
  applyEventOutcome, buyCardState, enterMapNode, finishEventState,
  completeCombatRewardState, enterCombatRewardState, removeCardState,
  enterGameOverState, restState, upgradeCardState,
} from './game-transitions';

const MAP_STATE: GameState = {
  screen: 'map',
  combatState: null,
  deck: ['strike'],
  playerHp: 80,
  playerMaxHp: 80,
  map: {
    nodes: [
      { id: 'shop-1', floor: 1, pos: 0.3, type: 'shop', nextNodeIds: ['event-2'], enemyIds: [] },
      { id: 'event-2', floor: 2, pos: 0.5, type: 'event', nextNodeIds: [], enemyIds: [] },
    ],
    currentNodeId: null,
    visitedNodeIds: [],
    mapIndex: 1,
    totalMaps: 3,
    totalFloorsPerMap: 10,
  },
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
  runSeed: 1234,
  randomState: 1234,
};

describe('맵 노드 전환', () => {
  it('선택 가능한 상점 노드로 진입한다', () => {
    const result = enterMapNode(MAP_STATE, 'shop-1', null, ['bash']);

    expect(result.screen).toBe('shop');
    expect(result.shopCards).toEqual(['bash']);
    expect(result.map?.visitedNodeIds).toEqual(['shop-1']);
  });

  it('연결되지 않은 노드 진입을 차단한다', () => {
    expect(enterMapNode(MAP_STATE, 'event-2', 'shrine', [])).toBe(MAP_STATE);
  });

  it('이벤트 정보가 없으면 이벤트 노드 진입을 차단한다', () => {
    const map = MAP_STATE.map;
    if (!map) throw new Error('맵 데이터가 없습니다.');
    const state: GameState = {
      ...MAP_STATE,
      map: { ...map, currentNodeId: 'shop-1', visitedNodeIds: ['shop-1'] },
    };

    expect(enterMapNode(state, 'event-2', null, [])).toBe(state);
  });
});

describe('이벤트 전환', () => {
  it('카드 제거 후속 화면과 잔여 횟수를 반영한다', () => {
    const state: GameState = { ...MAP_STATE, screen: 'event', eventId: 'mist' };
    const result = applyEventOutcome(state, 'mist', {
      hp: 75,
      maxHp: 80,
      gold: 60,
      gainedCardId: null,
      followUp: { type: 'remove', count: 2 },
      result: null,
    });

    expect(result.screen).toBe('remove_card');
    expect(result.removeSource).toBe('event');
    expect(result.pendingRemoveCount).toBe(2);
  });

  it('결과 화면을 맵으로 종료한다', () => {
    const state: GameState = {
      ...MAP_STATE,
      screen: 'event',
      eventId: 'shrine',
      eventResult: { key: 'shrine.c2.r', args: [8] },
    };

    expect(finishEventState(state).screen).toBe('map');
  });
});

describe('덱 관리 전환', () => {
  it('휴식 회복량을 최대 HP 상한에 맞춰 반영한다', () => {
    const result = restState({ ...MAP_STATE, screen: 'rest', playerHp: 70 });

    expect(result.screen).toBe('map');
    expect(result.playerHp).toBe(80);
  });

  it('이벤트 다중 강화 잔여 횟수를 감소한다', () => {
    const result = upgradeCardState({
      ...MAP_STATE,
      screen: 'upgrade',
      deck: ['strike', 'defend'],
      upgradeSource: 'event',
      pendingUpgradeCount: 2,
    }, 0);

    expect(result.screen).toBe('upgrade');
    expect(result.deck[0]).toBe('strike+');
    expect(result.pendingUpgradeCount).toBe(1);
  });

  it('상점 카드 제거 비용을 차감한다', () => {
    const result = removeCardState({
      ...MAP_STATE,
      screen: 'remove_card',
      removeSource: 'shop',
      deck: ['strike', 'defend'],
    }, 0);

    expect(result.screen).toBe('shop');
    expect(result.deck).toEqual(['defend']);
    expect(result.gold).toBe(0);
  });

  it('마지막 카드는 제거하지 않는다', () => {
    const state: GameState = { ...MAP_STATE, screen: 'remove_card', removeSource: 'rest' };

    expect(removeCardState(state, 0)).toBe(state);
  });

  it('상점 카드를 중복 구매하지 못하게 판매 목록에서 제거한다', () => {
    const state: GameState = { ...MAP_STATE, screen: 'shop', shopCards: ['bash'], gold: 100 };
    const purchased = buyCardState(state, 'bash');

    expect(purchased.deck).toEqual(['strike', 'bash']);
    expect(purchased.shopCards).toEqual([]);
    expect(buyCardState(purchased, 'bash')).toBe(purchased);
  });
});

describe('전투 보상 전환', () => {
  it('승리 HP·카드·골드·처치 수를 보상 화면에 반영한다', () => {
    const map = MAP_STATE.map;
    if (!map) throw new Error('맵 데이터가 없습니다.');
    const combatState: GameState = {
      ...MAP_STATE,
      screen: 'combat',
      map: {
        ...map,
        currentNodeId: 'shop-1',
        nodes: map.nodes.map((node) => node.id === 'shop-1'
          ? { ...node, type: 'combat' as const, enemyIds: ['jaw_worm'] }
          : node),
      },
    };
    const result = enterCombatRewardState(combatState, 55, ['bash'], 20);

    expect(result.screen).toBe('combat_reward');
    expect(result.playerHp).toBe(55);
    expect(result.rewardCards).toEqual(['bash']);
    expect(result.rewardGold).toBe(20);
    expect(result.kills).toBe(1);
  });

  it('패배 전 처치한 적 수를 런 통계에 반영한다', () => {
    const result = enterGameOverState({ ...MAP_STATE, screen: 'combat', kills: 2 }, 1);

    expect(result.screen).toBe('game_over');
    expect(result.kills).toBe(3);
    expect(result.runRecorded).toBe(true);
  });

  it('보상 완료 시 골드를 지급하고 맵으로 복귀한다', () => {
    const rewardState: GameState = { ...MAP_STATE, screen: 'combat_reward', gold: 60, rewardGold: 20 };
    const result = completeCombatRewardState(rewardState, null, null);

    expect(result.screen).toBe('map');
    expect(result.gold).toBe(80);
    expect(result.rewardGold).toBe(0);
  });
});
