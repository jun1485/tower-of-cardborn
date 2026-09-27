// 전투 엔진 핵심 규칙 회귀 검증

import { describe, expect, it } from 'vitest';
import type { CombatState } from '../types/combat';
import type { Intent } from '../types/character';
import { endPlayerTurn, initCombat, playCard, usePotion } from './combat-engine';

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

  it('디버프 인텐트로 플레이어 상태이상을 부여한다', () => {
    const result = endPlayerTurn(createCombatState({ type: 'debuff', value: 2, statusType: 'weak' }));

    expect(result.player.statusEffects).toContainEqual({ type: 'weak', duration: 2 });
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
    const result = initCombat(['strike'], ['jaw_worm'], 80, 80, 0, 1, { energy: 1, strength: 1, block: 0, dexterity: 0 });

    expect(result.player.energy).toBe(4);
    expect(result.player.maxEnergy).toBe(4);
    expect(result.player.statusEffects).toContainEqual({ type: 'strength', duration: 1 });
  });

  it('시작 방어도와 민첩을 전투 상태에 반영한다', () => {
    const result = initCombat(['strike'], ['jaw_worm'], 80, 80, 0, 1, { energy: 0, strength: 0, block: 6, dexterity: 1 });

    expect(result.player.block).toBe(6);
    expect(result.player.statusEffects).toContainEqual({ type: 'dexterity', duration: 1 });
  });
});

describe('독 상태이상', () => {
  it('적 턴 시작 시 중첩만큼 피해 후 1 감소한다', () => {
    const state = createCombatState({ type: 'defend', value: 5 });
    const poisoned: CombatState = {
      ...state,
      enemies: [{ ...state.enemies[0], statusEffects: [{ type: 'poison', duration: 4 }] }],
    };
    const result = endPlayerTurn(poisoned);

    expect(result.enemies[0].hp).toBe(34);
    expect(result.enemies[0].statusEffects).toContainEqual({ type: 'poison', duration: 3 });
  });

  it('독으로 모든 적 처치 시 즉시 승리한다', () => {
    const state = createCombatState({ type: 'attack', value: 5 });
    const poisoned: CombatState = {
      ...state,
      enemies: [{ ...state.enemies[0], hp: 3, statusEffects: [{ type: 'poison', duration: 4 }] }],
    };
    const result = endPlayerTurn(poisoned);

    expect(result.enemies).toEqual([]);
    expect(result.result).toBe('victory');
  });

  it('플레이어 독은 턴 시작 피해 후 감소한다', () => {
    const state = createCombatState({ type: 'defend', value: 5 });
    const poisoned: CombatState = {
      ...state,
      player: { ...state.player, statusEffects: [{ type: 'poison', duration: 3 }] },
    };
    const result = endPlayerTurn(poisoned);

    expect(result.player.hp).toBe(77);
    expect(result.player.statusEffects).toContainEqual({ type: 'poison', duration: 2 });
  });
});

describe('민첩·손상', () => {
  it('민첩이 방어 카드 획득량을 높인다', () => {
    const base = createCombatState({ type: 'attack', value: 5 });
    const state: CombatState = {
      ...base,
      player: { ...base.player, statusEffects: [{ type: 'dexterity', duration: 2 }] },
      hand: [{ instanceId: 'defend-1', definitionId: 'defend' }],
    };
    const result = playCard(state, 'defend-1');

    expect(result.player.block).toBe(7);
  });

  it('손상 상태는 방어 획득량을 감소시킨다', () => {
    const base = createCombatState({ type: 'attack', value: 5 });
    const state: CombatState = {
      ...base,
      player: { ...base.player, statusEffects: [{ type: 'frail', duration: 2 }] },
      hand: [{ instanceId: 'defend-1', definitionId: 'defend' }],
    };
    const result = playCard(state, 'defend-1');

    expect(result.player.block).toBe(3);
  });

  it('손상 상태 적은 방어 인텐트 획득량이 감소한다', () => {
    const state = createCombatState({ type: 'defend', value: 10 });
    const frailEnemy: CombatState = {
      ...state,
      enemies: [{ ...state.enemies[0], statusEffects: [{ type: 'frail', duration: 2 }] }],
    };
    const result = endPlayerTurn(frailEnemy);

    expect(result.enemies[0].block).toBe(7);
  });
});

describe('지속 파워', () => {
  it('파워 카드 사용 시 파워가 누적되고 카드는 소멸된다', () => {
    const base = createCombatState({ type: 'attack', value: 5 });
    const state: CombatState = {
      ...base,
      hand: [{ instanceId: 'metal-skin-1', definitionId: 'metal_skin' }],
    };
    const result = playCard(state, 'metal-skin-1');

    expect(result.powers).toContainEqual({ type: 'turn_start_block', value: 3 });
    expect(result.exhaustPile).toContainEqual({ instanceId: 'metal-skin-1', definitionId: 'metal_skin' });
  });

  it('턴 시작 시 파워 효과를 발동한다', () => {
    const state: CombatState = {
      ...createCombatState({ type: 'defend', value: 5 }),
      powers: [
        { type: 'turn_start_block', value: 3 },
        { type: 'turn_start_strength', value: 2 },
      ],
    };
    const result = endPlayerTurn(state);

    expect(result.player.block).toBe(3);
    expect(result.player.statusEffects).toContainEqual({ type: 'strength', duration: 2 });
  });
});

describe('사용 카드 이동 시점', () => {
  it('드로우 효과 리셔플에 방금 사용한 카드를 섞지 않는다', () => {
    const state: CombatState = {
      ...createCombatState({ type: 'attack', value: 5 }),
      hand: [{ instanceId: 'surge-1', definitionId: 'mana_surge' }],
    };
    const result = playCard(state, 'surge-1');

    expect(result.hand).toEqual([]);
    expect(result.discardPile).toEqual([{ instanceId: 'surge-1', definitionId: 'mana_surge' }]);
    expect(result.player.energy).toBe(4);
  });
});

describe('유물 지속 파워 첫 턴', () => {
  it('매 턴 방어·회복·드로우 파워를 1턴에도 발동한다', () => {
    const result = initCombat(
      Array.from({ length: 10 }, () => 'strike'),
      ['jaw_worm'],
      50,
      80,
      0,
      1,
      {
        energy: 0, strength: 0, block: 0, dexterity: 0,
        powers: [
          { type: 'turn_start_block', value: 2 },
          { type: 'turn_start_heal', value: 2 },
          { type: 'turn_start_draw', value: 1 },
        ],
      },
    );

    expect(result.player.block).toBe(2);
    expect(result.player.hp).toBe(52);
    expect(result.hand).toHaveLength(6);
  });
});

describe('전투 초기화 방어', () => {
  it('정의 없는 적 id는 제외하고 전투를 생성한다', () => {
    const result = initCombat(['strike'], ['jaw_worm', 'removed_enemy']);

    expect(result.enemies).toHaveLength(1);
    expect(result.enemies[0].definitionId).toBe('jaw_worm');
  });
});

describe('저주 카드', () => {
  it('저주 카드는 사용할 수 없다', () => {
    const base = createCombatState({ type: 'attack', value: 5 });
    const state: CombatState = {
      ...base,
      hand: [{ instanceId: 'curse-1', definitionId: 'curse_wound' }],
    };

    expect(playCard(state, 'curse-1')).toBe(state);
  });
});

describe('광역 상태이상', () => {
  it('전체 대상 독 부여 카드가 모든 적에 적용된다', () => {
    const base = createCombatState({ type: 'attack', value: 5 });
    const state: CombatState = {
      ...base,
      enemies: [
        base.enemies[0],
        { ...base.enemies[0], id: 'enemy-2' },
      ],
      hand: [{ instanceId: 'toxic-cloud-1', definitionId: 'toxic_cloud' }],
    };
    const result = playCard(state, 'toxic-cloud-1');

    expect(result.enemies[0].statusEffects).toContainEqual({ type: 'poison', duration: 3 });
    expect(result.enemies[1].statusEffects).toContainEqual({ type: 'poison', duration: 3 });
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

describe('전투 포션', () => {
  it('회복과 방어 포션을 플레이어에게 적용한다', () => {
    const damaged = createCombatState({ type: 'attack', value: 5 }, 40);

    expect(usePotion(damaged, 'healing_potion').player.hp).toBe(60);
    expect(usePotion(damaged, 'block_potion').player.block).toBe(15);
  });

  it('화염 포션으로 적을 처치하면 승리한다', () => {
    const state = createCombatState({ type: 'attack', value: 5 });
    const weakened: CombatState = { ...state, enemies: [{ ...state.enemies[0], hp: 20 }] };
    const result = usePotion(weakened, 'fire_potion', 'enemy-1');

    expect(result.enemies).toEqual([]);
    expect(result.result).toBe('victory');
  });

  it('최대 HP에서는 회복 포션을 소비하지 않는다', () => {
    const state = createCombatState({ type: 'attack', value: 5 });

    expect(usePotion(state, 'healing_potion')).toBe(state);
  });

  it('에너지·힘 포션을 즉시 적용한다', () => {
    const state = createCombatState({ type: 'attack', value: 5 });

    expect(usePotion(state, 'energy_potion').player.energy).toBe(5);
    expect(usePotion(state, 'strength_potion').player.statusEffects)
      .toContainEqual({ type: 'strength', duration: 2 });
  });

  it('맹독 포션이 대상 적에게 독을 부여한다', () => {
    const state = createCombatState({ type: 'attack', value: 5 });
    const result = usePotion(state, 'toxin_potion', 'enemy-1');

    expect(result.enemies[0].statusEffects).toContainEqual({ type: 'poison', duration: 6 });
    expect(result.enemies[0].hp).toBe(38);
  });
});
