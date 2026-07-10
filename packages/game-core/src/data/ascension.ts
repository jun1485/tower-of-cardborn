// 승천 난이도 데이터 정의 (레벨별 절대값 테이블)

export const MAX_ASCENSION = 5;

export interface AscensionModifier {
  readonly enemyHpMul: number;
  readonly enemyAtkMul: number;
  readonly startGold: number;
  readonly startHp: number;
  readonly restHealRate: number;
}

const ASCENSION_TABLE: readonly AscensionModifier[] = [
  { enemyHpMul: 1.0, enemyAtkMul: 1.0, startGold: 60, startHp: 80, restHealRate: 0.3 },
  { enemyHpMul: 1.1, enemyAtkMul: 1.0, startGold: 60, startHp: 80, restHealRate: 0.3 },
  { enemyHpMul: 1.1, enemyAtkMul: 1.1, startGold: 60, startHp: 80, restHealRate: 0.3 },
  { enemyHpMul: 1.25, enemyAtkMul: 1.1, startGold: 50, startHp: 80, restHealRate: 0.3 },
  { enemyHpMul: 1.25, enemyAtkMul: 1.2, startGold: 50, startHp: 72, restHealRate: 0.3 },
  { enemyHpMul: 1.4, enemyAtkMul: 1.25, startGold: 50, startHp: 72, restHealRate: 0.25 },
];

/** 승천 레벨별 배율 조회 (0~상한 클램프) */
export function getAscensionModifier(level: number): AscensionModifier {
  const clamped = Math.max(0, Math.min(MAX_ASCENSION, Math.floor(level)));
  return ASCENSION_TABLE[clamped];
}
