// 맵과 이벤트 상태 전환 규칙 검증

import { describe, expect, it } from 'vitest';
import type { GameState } from '@tower-of-cardborn/game-core/types/game';
import {
  applyEventOutcome, buyCardState, enterMapNode, enterShopUpgradeState, enterUpgradeState, finishEventState,
  completeCombatRewardState, enterCombatRewardState, removeCardState,
  enterGameOverState, getShopRemovePrice, getShopUpgradePrice, restState, upgradeCardState,
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
  relics: [],
  rewardRelic: null,
  potions: [],
  rewardPotion: null,
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

  it('보물 노드는 전투 없이 보상 화면으로 진입한다', () => {
    const map = MAP_STATE.map;
    if (!map) throw new Error('맵 데이터가 없습니다.');
    const state: GameState = {
      ...MAP_STATE,
      map: {
        ...map,
        nodes: map.nodes.map((node) => node.id === 'shop-1' ? { ...node, type: 'treasure' as const } : node),
      },
    };
    const result = enterMapNode(state, 'shop-1', null, [], [], [], {
      gold: 40, relic: 'iron_heart', potion: null,
    });

    expect(result.screen).toBe('combat_reward');
    expect(result.rewardCards).toEqual([]);
    expect(result.rewardGold).toBe(40);
    expect(result.rewardRelic).toBe('iron_heart');
  });

  it('보상 정보가 없으면 보물 노드 진입을 차단한다', () => {
    const map = MAP_STATE.map;
    if (!map) throw new Error('맵 데이터가 없습니다.');
    const state: GameState = {
      ...MAP_STATE,
      map: {
        ...map,
        nodes: map.nodes.map((node) => node.id === 'shop-1' ? { ...node, type: 'treasure' as const } : node),
      },
    };

    expect(enterMapNode(state, 'shop-1', null, [])).toBe(state);
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
      gainedRelicId: null,
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

  it('체력이 가득 차면 회복으로 휴식처를 소모하지 않는다', () => {
    const state: GameState = { ...MAP_STATE, screen: 'rest' };

    expect(restState(state)).toBe(state);
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

  it('상인의 반지와 승천 배율을 상점 서비스 가격에 함께 반영한다', () => {
    expect(getShopRemovePrice(['merchants_ring'], 5)).toBe(57);
    expect(getShopUpgradePrice(['merchants_ring'], 5)).toBe(72);
  });

  it('마지막 카드는 제거하지 않는다', () => {
    const state: GameState = { ...MAP_STATE, screen: 'remove_card', removeSource: 'rest' };

    expect(removeCardState(state, 0)).toBe(state);
  });

  it('강화 가능한 카드가 없으면 휴식처 강화 진입을 차단한다', () => {
    const state: GameState = { ...MAP_STATE, screen: 'rest', deck: ['strike+'] };

    expect(enterUpgradeState(state)).toBe(state);
  });

  it('상점 카드 강화는 골드를 차감하고 상점으로 복귀한다', () => {
    const shopState: GameState = { ...MAP_STATE, screen: 'shop', gold: 100, deck: ['strike', 'defend'] };
    const entered = enterShopUpgradeState(shopState);
    const result = upgradeCardState(entered, 0);

    expect(entered.screen).toBe('upgrade');
    expect(entered.upgradeSource).toBe('shop');
    expect(result.screen).toBe('shop');
    expect(result.deck[0]).toBe('strike+');
    expect(result.gold).toBe(25);
  });

  it('할인된 상점 카드 강화 비용을 차감한다', () => {
    const shopState: GameState = {
      ...MAP_STATE,
      screen: 'shop',
      gold: 60,
      deck: ['strike', 'defend'],
      relics: ['merchants_ring'],
    };
    const result = upgradeCardState(enterShopUpgradeState(shopState), 0);

    expect(result.screen).toBe('shop');
    expect(result.gold).toBe(0);
  });

  it('골드가 부족하면 상점 강화 진입을 차단한다', () => {
    const shopState: GameState = { ...MAP_STATE, screen: 'shop', gold: 10 };

    expect(enterShopUpgradeState(shopState)).toBe(shopState);
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
    const result = enterCombatRewardState(combatState, 55, ['bash'], 20, 'iron_heart', 'healing_potion');

    expect(result.screen).toBe('combat_reward');
    expect(result.playerHp).toBe(55);
    expect(result.rewardCards).toEqual(['bash']);
    expect(result.rewardGold).toBe(20);
    expect(result.rewardRelic).toBe('iron_heart');
    expect(result.rewardPotion).toBe('healing_potion');
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

  it('철의 심장 유물 획득 시 최대 HP와 현재 HP를 높인다', () => {
    const rewardState: GameState = {
      ...MAP_STATE,
      screen: 'combat_reward',
      playerHp: 50,
      rewardRelic: 'iron_heart',
    };
    const result = completeCombatRewardState(rewardState, null, null);

    expect(result.relics).toEqual(['iron_heart']);
    expect(result.playerHp).toBe(58);
    expect(result.playerMaxHp).toBe(88);
    expect(result.rewardRelic).toBeNull();
  });

  it('빈 포션 슬롯에 전투 보상 포션을 추가한다', () => {
    const rewardState: GameState = {
      ...MAP_STATE,
      screen: 'combat_reward',
      rewardPotion: 'block_potion',
    };
    const result = completeCombatRewardState(rewardState, null, null);

    expect(result.potions).toEqual(['block_potion']);
    expect(result.rewardPotion).toBeNull();
  });

  it('다음 액트 진입 시 HP를 완전히 회복한다', () => {
    const map = MAP_STATE.map;
    if (!map) throw new Error('맵 데이터가 없습니다.');
    const rewardState: GameState = {
      ...MAP_STATE,
      screen: 'combat_reward',
      playerHp: 25,
      map: {
        ...map,
        currentNodeId: 'shop-1',
        nodes: map.nodes.map((node) => node.id === 'shop-1' ? { ...node, type: 'boss' as const } : node),
      },
    };
    const nextMap = { ...map, mapIndex: 2, currentNodeId: null, visitedNodeIds: [] };
    const result = completeCombatRewardState(rewardState, nextMap, null);

    expect(result.screen).toBe('map');
    expect(result.playerHp).toBe(result.playerMaxHp);
    expect(result.map?.mapIndex).toBe(2);
  });
});
