// 적 데이터 정의

import type { EnemyDefinition } from '../types/character';

export const ENEMY_DEFINITIONS: Record<string, EnemyDefinition> = {
  // 일반 적
  jaw_worm: { id: 'jaw_worm', name: 'Jaw Worm', hp: 38, maxHp: 38 },
  cultist: { id: 'cultist', name: 'Cultist', hp: 42, maxHp: 42 },
  louse_red: { id: 'louse_red', name: 'Red Louse', hp: 24, maxHp: 24 },
  fungi_beast: { id: 'fungi_beast', name: 'Fungi Beast', hp: 24, maxHp: 24 },
  // 엘리트
  gremlin_nob: { id: 'gremlin_nob', name: 'Gremlin Nob', hp: 82, maxHp: 82 },
  lagavulin: { id: 'lagavulin', name: 'Lagavulin', hp: 112, maxHp: 112 },
  // 보스
  slime_boss: { id: 'slime_boss', name: 'Slime Boss', hp: 150, maxHp: 150 },
};

/** 일반 전투 인카운터 */
export const NORMAL_ENCOUNTERS: readonly (readonly string[])[] = [
  ['jaw_worm'],
  ['cultist'],
  ['louse_red'],
  ['fungi_beast'],
  ['louse_red', 'louse_red'],
  ['fungi_beast', 'louse_red'],
  ['jaw_worm', 'louse_red'],
  ['cultist', 'louse_red'],
  ['fungi_beast', 'fungi_beast'],
  ['louse_red', 'louse_red', 'fungi_beast'],
];

/** 엘리트 인카운터 */
export const ELITE_ENCOUNTERS: readonly (readonly string[])[] = [
  ['gremlin_nob'],
  ['lagavulin'],
];

/** 보스 인카운터 */
export const BOSS_ENCOUNTERS: readonly (readonly string[])[] = [
  ['slime_boss'],
];

/** 하위 호환용 (기존 코드 참조) */
export const ENCOUNTERS = NORMAL_ENCOUNTERS;
