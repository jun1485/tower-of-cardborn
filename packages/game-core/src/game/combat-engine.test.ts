// 전투 엔진 핵심 규칙 회귀 검증

import { describe, expect, it } from 'vitest';
import type { CombatState } from '../types/combat';
import type { Intent } from '../types/character';
import { endPlayerTurn, initCombat, playCard } from './combat-engine';

/** 적 인텐트별 전투 상태 생성 */
function createCombatState(intent: Intent, playerHp = 80): CombatState {
  return {
    player: {
      hp: playerHp,
      maxHp: 80,
      block: 0,
      energy: 3,
      maxEnergy: 3,
      statusEffects: [],
    },
    enemies: [{
      id: 'enemy-1',
      definitionId: 'jaw_worm',
      name: 'Jaw Worm',
      hp: 38,
      maxHp: 38,
      block: 0,
      intent,
      statusEffects: [],
      turnCount: 0,
    }],
    drawPile: [],
    hand: [],
    discardPile: [],
    exhaustPile: [],
    turn: 1,
    phase: 'player_turn',
    result: 'ongoing',
    ascension: 0,
    mapIndex: 1,
  };
}

describe('적 인텐트', () => {
  it('방어 수치를 다음 플레이어 턴까지 유지한다', () => {
    const result = endPlayerTurn(createCombatState({ type: 'defend', value: 5 }));

    expect(result.enemies[0].block).toBe(5);
  });

  it('버프 수치를 적 힘으로 누적한다', () => {
    const result = endPlayerTurn(createCombatState({ type: 'buff', value: 3 }));

    expect(result.enemies[0].statusEffects).toContainEqual({ type: 'strength', duration: 3 });
  });

  it('적 힘을 공격 피해에 반영한다', () => {
    const state = createCombatState({ type: 'attack', value: 5 });
    const strengthened: CombatState = {
      ...state,
      enemies: [{ ...state.enemies[0], statusEffects: [{ type: 'strength', duration: 3 }] }],
    };
    const result = endPlayerTurn(strengthened);

    expect(result.player.hp).toBe(72);
  });
});

describe('액트 난이도', () => {
  it('3액트 적 HP와 공격력을 강화한다', () => {
    const result = initCombat(['strike'], ['jaw_worm'], 80, 80, 0, 3);

    expect(result.enemies[0].maxHp).toBe(52);
    expect(result.enemies[0].intent).toEqual({ type: 'attack', value: 11 });
    expect(result.mapIndex).toBe(3);
  });
});

describe('유물 전투 보너스', () => {
  it('추가 에너지와 시작 힘을 전투 상태에 반영한다', () => {
    const result = initCombat(['strike'], ['jaw_worm'], 80, 80, 0, 1, { energy: 1, strength: 1 });

    expect(result.player.energy).toBe(4);
    expect(result.player.maxEnergy).toBe(4);
    expect(result.player.statusEffects).toContainEqual({ type: 'strength', duration: 1 });
  });
});

describe('자해 카드', () => {
  it('카드 효과 완료 후 HP가 0이면 패배한다', () => {
    const state: CombatState = {
      ...createCombatState({ type: 'attack', value: 5 }, 3),
      hand: [{ instanceId: 'bloodletting-1', definitionId: 'bloodletting' }],
    };
    const result = playCard(state, 'bloodletting-1');

    expect(result.player.hp).toBe(0);
    expect(result.result).toBe('defeat');
  });

  it('자해 후 회복으로 HP가 남으면 전투를 유지한다', () => {
    const state: CombatState = {
      ...createCombatState({ type: 'attack', value: 5 }, 3),
      hand: [{ instanceId: 'crimson-ritual-1', definitionId: 'crimson_ritual' }],
    };
    const result = playCard(state, 'crimson-ritual-1');

    expect(result.player.hp).toBe(10);
    expect(result.result).toBe('ongoing');
  });
});

describe('카드 대상 검증', () => {
  it('존재하지 않는 적 대상이면 카드와 에너지를 소비하지 않는다', () => {
    const base = createCombatState({ type: 'attack', value: 5 });
    const state: CombatState = {
      ...base,
      hand: [{ instanceId: 'strike-1', definitionId: 'strike' }],
    };

    const result = playCard(state, 'strike-1', 'missing-enemy');

    expect(result).toBe(state);
  });
});
