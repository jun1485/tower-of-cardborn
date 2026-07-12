// 전투·보상·상점 밸런스 상수 중앙 정의

/** 전투 규칙 상수 */
export const COMBAT_BALANCE = {
  handSize: 5,
  startingEnergy: 3,
  weakMultiplier: 0.75,
  vulnerableMultiplier: 1.5,
  frailMultiplier: 0.75,
} as const;

/** 포션 효과 수치 */
export const POTION_BALANCE = {
  healingPotionHeal: 20,
  blockPotionBlock: 15,
  firePotionDamage: 20,
  energyPotionGain: 2,
  strengthPotionGain: 2,
  toxinPotionStacks: 6,
} as const;

/** 노드 유형별 골드 보상 범위 */
export const GOLD_REWARD_BALANCE = {
  normalBase: 12,
  normalVariance: 7,
  eliteBase: 30,
  eliteVariance: 11,
  bossBase: 60,
  bossVariance: 16,
  /** 유물 풀 소진 시 대체 골드 */
  exhaustedRelicGold: 25,
} as const;

/** 보물 상자 보상 상수 */
export const TREASURE_BALANCE = {
  goldBase: 35,
  goldVariance: 20,
  relicChance: 0.4,
  potionChance: 0.35,
} as const;

/** 상점 가격 상수 */
export const SHOP_BALANCE = {
  cardBasePrice: 45,
  uncommonSurcharge: 20,
  rareSurcharge: 45,
  costSurchargePerEnergy: 10,
  removePrice: 60,
  upgradePrice: 75,
  relicPrice: 150,
  potionPrice: 40,
} as const;
