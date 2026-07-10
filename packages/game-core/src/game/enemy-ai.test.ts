// 적 패턴과 난이도 배율 검증

import { describe, expect, it } from 'vitest';
import type { Enemy } from '../types/character';
import { decideIntent } from './enemy-ai';

/** 적 패턴 검증 상태 생성 */
function createEnemy(definitionId: string, turnCount: number): Enemy {
  return {
    id: 'enemy-1',
    definitionId,
    name: definitionId,
    hp: 100,
    maxHp: 100,
    block: 0,
    intent: { type: 'attack', value: 0 },
    statusEffects: [],
    turnCount,
  };
}

describe('적 AI 패턴', () => {
  it('광신도가 힘 버프 후 공격한다', () => {
    expect(decideIntent(createEnemy('cultist', 0))).toEqual({ type: 'buff', value: 2 });
    expect(decideIntent(createEnemy('cultist', 1))).toEqual({ type: 'attack', value: 6 });
  });

  it('액트와 승천 공격 배율을 함께 반영한다', () => {
    expect(decideIntent(createEnemy('jaw_worm', 0), 2, 3)).toEqual({ type: 'attack', value: 12 });
  });

  it('균류 야수와 슬라임 보스가 상태이상을 예고한다', () => {
    expect(decideIntent(createEnemy('fungi_beast', 2))).toEqual({ type: 'debuff', value: 2, statusType: 'weak' });
    expect(decideIntent(createEnemy('slime_boss', 1))).toEqual({ type: 'debuff', value: 2, statusType: 'vulnerable' });
  });

  it('2·3액트 보스가 고유 패턴을 사용한다', () => {
    expect(decideIntent(createEnemy('stone_guardian', 1))).toEqual({ type: 'buff', value: 3 });
    expect(decideIntent(createEnemy('tower_heart', 0))).toEqual({ type: 'debuff', value: 2, statusType: 'vulnerable' });
    expect(decideIntent(createEnemy('tower_heart', 2))).toEqual({ type: 'buff', value: 2 });
  });
});
