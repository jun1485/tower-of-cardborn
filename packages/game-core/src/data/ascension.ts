// 승천 난이도 데이터 정의 (레벨별 절대값 테이블)

export const MAX_ASCENSION = 5;

export interface AscensionModifier {
  readonly enemyHpMul: number;
  readonly enemyAtkMul: number;
  readonly startGold: number;
  readonly startHp: number;
  readonly restHealRate: number;
  /** 엘리트 층 추가 엘리트 전환 확률 */
  readonly extraEliteChance: number;
  /** 상점 가격 배율 */
  readonly shopPriceMul: number;
  /** 시작 덱 저주 포함 여부 */
  readonly startWithCurse: boolean;
}

export interface ActModifier {
  readonly enemyHpMul: number;
  readonly enemyAtkMul: number;
}

const ASCENSION_TABLE: readonly AscensionModifier[] = [
  { enemyHpMul: 1.0, enemyAtkMul: 1.0, startGold: 60, startHp: 80, restHealRate: 0.3, extraEliteChance: 0.4, shopPriceMul: 1.0, startWithCurse: false },
  { enemyHpMul: 1.1, enemyAtkMul: 1.0, startGold: 60, startHp: 80, restHealRate: 0.3, extraEliteChance: 0.4, shopPriceMul: 1.0, startWithCurse: false },
  { enemyHpMul: 1.1, enemyAtkMul: 1.1, startGold: 60, startHp: 80, restHealRate: 0.3, extraEliteChance: 0.5, shopPriceMul: 1.0, startWithCurse: false },
  { enemyHpMul: 1.25, enemyAtkMul: 1.1, startGold: 50, startHp: 80, restHealRate: 0.3, extraEliteChance: 0.5, shopPriceMul: 1.1, startWithCurse: false },
  { enemyHpMul: 1.25, enemyAtkMul: 1.2, startGold: 50, startHp: 72, restHealRate: 0.3, extraEliteChance: 0.6, shopPriceMul: 1.1, startWithCurse: false },
  { enemyHpMul: 1.4, enemyAtkMul: 1.25, startGold: 50, startHp: 72, restHealRate: 0.25, extraEliteChance: 0.6, shopPriceMul: 1.2, startWithCurse: true },
];

/** 승천 레벨별 배율 조회 (0~상한 클램프) */
export function getAscensionModifier(level: number): AscensionModifier {
  const clamped = Math.max(0, Math.min(MAX_ASCENSION, Math.floor(level)));
  return ASCENSION_TABLE[clamped];
}

/** 엔들리스 액트당 강화 증가량/상한 */
const ENDLESS_HP_STEP = 0.25;
const ENDLESS_ATK_STEP = 0.15;
const ENDLESS_HP_CAP = 3.0;
const ENDLESS_ATK_CAP = 2.4;

/** 액트별 적 강화 배율 조회 (4액트 이후 엔들리스 누진) */
export function getActModifier(mapIndex: number): ActModifier {
  if (mapIndex > 3) {
    const endlessDepth = mapIndex - 3;
    return {
      enemyHpMul: Math.min(ENDLESS_HP_CAP, 1.38 + ENDLESS_HP_STEP * endlessDepth),
      enemyAtkMul: Math.min(ENDLESS_ATK_CAP, 1.2 + ENDLESS_ATK_STEP * endlessDepth),
    };
  }
  if (mapIndex === 3) return { enemyHpMul: 1.38, enemyAtkMul: 1.2 };
  if (mapIndex === 2) return { enemyHpMul: 1.18, enemyAtkMul: 1.1 };
  return { enemyHpMul: 1, enemyAtkMul: 1 };
}
