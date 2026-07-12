// 승천·액트 강화 배율 규칙 검증

import { describe, expect, it } from 'vitest';
import { getActModifier, getAscensionModifier } from './ascension';

describe('액트 강화 배율', () => {
  it('기본 3개 액트 배율을 유지한다', () => {
    expect(getActModifier(1)).toEqual({ enemyHpMul: 1, enemyAtkMul: 1 });
    expect(getActModifier(2)).toEqual({ enemyHpMul: 1.18, enemyAtkMul: 1.1 });
    expect(getActModifier(3)).toEqual({ enemyHpMul: 1.38, enemyAtkMul: 1.2 });
  });

  it('엔들리스 액트는 누진 강화되고 상한에서 멈춘다', () => {
    expect(getActModifier(4).enemyHpMul).toBeCloseTo(1.63);
    expect(getActModifier(4).enemyAtkMul).toBeCloseTo(1.35);
    expect(getActModifier(5).enemyHpMul).toBeCloseTo(1.88);
    expect(getActModifier(50).enemyHpMul).toBe(3.0);
    expect(getActModifier(50).enemyAtkMul).toBe(2.4);
  });
});

describe('승천 배율', () => {
  it('승천 5는 시작 저주와 상점 가격 인상 규칙을 포함한다', () => {
    const top = getAscensionModifier(5);

    expect(top.startWithCurse).toBe(true);
    expect(top.shopPriceMul).toBeCloseTo(1.2);
    expect(getAscensionModifier(0).startWithCurse).toBe(false);
  });
});
