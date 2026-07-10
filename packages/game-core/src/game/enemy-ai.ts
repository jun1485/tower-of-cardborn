// 적 AI: 인텐트 결정 및 행동 실행

import type { Enemy, Intent } from '../types/character';
import { getActModifier, getAscensionModifier } from '../data/ascension';
import { random } from '../utils/random';

/** 승천 레벨별 공격 인텐트 배율 적용 */
function scaleIntent(intent: Intent, atkMul: number): Intent {
  if (intent.type !== 'attack' || atkMul === 1) return intent;
  return { ...intent, value: Math.round(intent.value * atkMul) };
}

/** 적 정의 ID 기반 인텐트 결정 */
export function decideIntent(enemy: Enemy, ascension = 0, mapIndex = 1): Intent {
  const atkMul = getAscensionModifier(ascension).enemyAtkMul * getActModifier(mapIndex).enemyAtkMul;
  return scaleIntent(baseIntent(enemy), atkMul);
}

/** 적 정의 ID 기반 기본 인텐트 산출 */
function baseIntent(enemy: Enemy): Intent {
  switch (enemy.definitionId) {
    case 'jaw_worm':
      return jawWormIntent(enemy.turnCount);
    case 'cultist':
      return cultistIntent(enemy.turnCount);
    case 'louse_red':
      return louseRedIntent();
    case 'fungi_beast':
      return fungiBeastIntent(enemy.turnCount);
    case 'gremlin_nob':
      return gremlinNobIntent(enemy.turnCount);
    case 'lagavulin':
      return lagavulinIntent(enemy.turnCount);
    case 'slime_boss':
      return slimeBossIntent(enemy.turnCount);
    case 'stone_guardian':
      return stoneGuardianIntent(enemy.turnCount);
    case 'tower_heart':
      return towerHeartIntent(enemy.turnCount);
    default:
      return { type: 'attack', value: 6 };
  }
}

/** Jaw Worm: 공격(9) / 방어(5) 교대 반복 */
function jawWormIntent(turnCount: number): Intent {
  return turnCount % 2 === 0
    ? { type: 'attack', value: 9 }
    : { type: 'defend', value: 5 };
}

/** Cultist 주기적 힘 버프와 공격 반복 */
function cultistIntent(turnCount: number): Intent {
  return turnCount % 3 === 0
    ? { type: 'buff', value: 2 }
    : { type: 'attack', value: 5 + turnCount };
}

/** Red Louse: 항상 공격 (4~7 고정 랜덤) */
function louseRedIntent(): Intent {
  return { type: 'attack', value: 4 + Math.floor(random() * 4) };
}

/** Fungi Beast 공격과 약화 반복 */
function fungiBeastIntent(turnCount: number): Intent {
  return turnCount % 3 === 2
    ? { type: 'debuff', value: 2, statusType: 'weak' }
    : { type: 'attack', value: 5 };
}

/** Gremlin Nob (엘리트): 강공격(14) / 매우강공격(18) 교대 */
function gremlinNobIntent(turnCount: number): Intent {
  return turnCount % 2 === 0
    ? { type: 'attack', value: 14 }
    : { type: 'attack', value: 18 };
}

/** Lagavulin (엘리트): 3턴 수면(방어15) 후 매턴 공격(18) */
function lagavulinIntent(turnCount: number): Intent {
  return turnCount < 3
    ? { type: 'defend', value: 15 }
    : { type: 'attack', value: 18 };
}

/** Slime Boss 강공격과 취약 및 방어 반복 */
function slimeBossIntent(turnCount: number): Intent {
  if (turnCount % 3 === 0) return { type: 'attack', value: 35 };
  return turnCount % 3 === 1
    ? { type: 'debuff', value: 2, statusType: 'vulnerable' }
    : { type: 'defend', value: 12 };
}

/** Stone Guardian 방어와 강화 및 강공격 반복 */
function stoneGuardianIntent(turnCount: number): Intent {
  if (turnCount % 3 === 0) return { type: 'defend', value: 18 };
  return turnCount % 3 === 1
    ? { type: 'buff', value: 3 }
    : { type: 'attack', value: 24 };
}

/** Tower Heart 취약과 연속 공격 및 강화 반복 */
function towerHeartIntent(turnCount: number): Intent {
  switch (turnCount % 4) {
    case 0: return { type: 'debuff', value: 2, statusType: 'vulnerable' };
    case 1: return { type: 'attack', value: 28 };
    case 2: return { type: 'buff', value: 2 };
    default: return { type: 'attack', value: 20 };
  }
}


