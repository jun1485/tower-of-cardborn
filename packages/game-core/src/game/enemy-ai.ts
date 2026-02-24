// 적 AI: 인텐트 결정 및 행동 실행

import type { Enemy, Intent } from '../types/character';

/** 적 정의 ID 기반 인텐트 결정 */
export function decideIntent(enemy: Enemy): Intent {
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

/** Cultist: 매턴 공격력 증가 (5→6→7...) */
function cultistIntent(turnCount: number): Intent {
  return { type: 'attack', value: 5 + turnCount };
}

/** Red Louse: 항상 공격 (4~7 고정 랜덤) */
function louseRedIntent(): Intent {
  return { type: 'attack', value: 4 + Math.floor(Math.random() * 4) };
}

/** Fungi Beast: 공격(5) / 공격(5) / 방어(3) 반복 */
function fungiBeastIntent(turnCount: number): Intent {
  return turnCount % 3 === 2
    ? { type: 'defend', value: 3 }
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

/** Slime Boss: 강공격(35) / 방어(10) 교대 */
function slimeBossIntent(turnCount: number): Intent {
  return turnCount % 2 === 0
    ? { type: 'attack', value: 35 }
    : { type: 'defend', value: 10 };
}


