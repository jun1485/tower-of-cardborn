// 적 데이터 정의

import type { EnemyDefinition } from '../types/character';

export const ENEMY_DEFINITIONS: Record<string, EnemyDefinition> = {
  // 일반 적
  jaw_worm: { id: 'jaw_worm', name: 'Jaw Worm', hp: 38, maxHp: 38 },
  cultist: { id: 'cultist', name: 'Cultist', hp: 42, maxHp: 42 },
  louse_red: { id: 'louse_red', name: 'Red Louse', hp: 24, maxHp: 24 },
  fungi_beast: { id: 'fungi_beast', name: 'Fungi Beast', hp: 24, maxHp: 24 },
  stone_sentinel: { id: 'stone_sentinel', name: 'Stone Sentinel', hp: 48, maxHp: 48 },
  crystal_crawler: { id: 'crystal_crawler', name: 'Crystal Crawler', hp: 52, maxHp: 52 },
  temple_acolyte: { id: 'temple_acolyte', name: 'Temple Acolyte', hp: 40, maxHp: 40 },
  void_wisp: { id: 'void_wisp', name: 'Void Wisp', hp: 44, maxHp: 44 },
  void_husk: { id: 'void_husk', name: 'Void Husk', hp: 50, maxHp: 50 },
  abyss_watcher: { id: 'abyss_watcher', name: 'Abyss Watcher', hp: 46, maxHp: 46 },
  // 엘리트
  gremlin_nob: { id: 'gremlin_nob', name: 'Gremlin Nob', hp: 82, maxHp: 82 },
  lagavulin: { id: 'lagavulin', name: 'Lagavulin', hp: 112, maxHp: 112 },
  arcane_golem: { id: 'arcane_golem', name: 'Arcane Golem', hp: 128, maxHp: 128 },
  obsidian_knight: { id: 'obsidian_knight', name: 'Obsidian Knight', hp: 135, maxHp: 135 },
  void_reaper: { id: 'void_reaper', name: 'Void Reaper', hp: 152, maxHp: 152 },
  plague_herald: { id: 'plague_herald', name: 'Plague Herald', hp: 160, maxHp: 160 },
  // 보스
  slime_boss: { id: 'slime_boss', name: 'Slime Boss', hp: 150, maxHp: 150 },
  gremlin_king: { id: 'gremlin_king', name: 'Gremlin King', hp: 145, maxHp: 145 },
  stone_guardian: { id: 'stone_guardian', name: 'Stone Guardian', hp: 180, maxHp: 180 },
  crystal_hydra: { id: 'crystal_hydra', name: 'Crystal Hydra', hp: 190, maxHp: 190 },
  tower_heart: { id: 'tower_heart', name: 'Tower Heart', hp: 220, maxHp: 220 },
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
  ['jaw_worm', 'fungi_beast'],
  ['cultist', 'fungi_beast'],
  ['fungi_beast', 'fungi_beast'],
  ['louse_red', 'louse_red', 'fungi_beast'],
  ['jaw_worm', 'louse_red', 'fungi_beast'],
  ['cultist', 'louse_red', 'fungi_beast'],
];

/** 2액트 일반 전투 인카운터 */
export const ACT_TWO_ENCOUNTERS: readonly (readonly string[])[] = [
  ['stone_sentinel', 'cultist'],
  ['stone_sentinel', 'fungi_beast'],
  ['stone_sentinel', 'louse_red'],
  ['stone_sentinel', 'stone_sentinel'],
  ['crystal_crawler', 'crystal_crawler'],
  ['crystal_crawler', 'stone_sentinel'],
  ['temple_acolyte', 'temple_acolyte'],
  ['temple_acolyte', 'crystal_crawler'],
  ['temple_acolyte', 'stone_sentinel'],
  ['crystal_crawler', 'louse_red', 'louse_red'],
];

/** 3액트 일반 전투 인카운터 */
export const ACT_THREE_ENCOUNTERS: readonly (readonly string[])[] = [
  ['void_wisp', 'stone_sentinel'],
  ['void_wisp', 'cultist', 'louse_red'],
  ['void_wisp', 'stone_sentinel', 'fungi_beast'],
  ['void_wisp', 'void_wisp', 'stone_sentinel'],
  ['void_husk', 'void_wisp'],
  ['void_husk', 'void_husk'],
  ['abyss_watcher', 'void_husk'],
  ['abyss_watcher', 'abyss_watcher', 'void_wisp'],
  ['void_husk', 'crystal_crawler', 'temple_acolyte'],
  ['abyss_watcher', 'void_wisp', 'void_wisp'],
];

/** 엘리트 인카운터 */
export const ELITE_ENCOUNTERS: readonly (readonly string[])[] = [
  ['gremlin_nob'],
  ['lagavulin'],
];

/** 보스 인카운터 */
export const BOSS_ENCOUNTERS: readonly (readonly string[])[] = [
  ['slime_boss'],
  ['gremlin_king'],
];

/** 액트별 일반 전투 인카운터 풀 조회 */
export function getNormalEncounters(mapIndex: number): readonly (readonly string[])[] {
  if (mapIndex >= 3) return ACT_THREE_ENCOUNTERS;
  return mapIndex === 2 ? ACT_TWO_ENCOUNTERS : NORMAL_ENCOUNTERS;
}

/** 액트별 엘리트 인카운터 풀 조회 */
export function getEliteEncounters(mapIndex: number): readonly (readonly string[])[] {
  if (mapIndex >= 3) return [['void_reaper'], ['plague_herald']];
  return mapIndex === 2 ? [['arcane_golem'], ['obsidian_knight']] : ELITE_ENCOUNTERS;
}

/** 액트별 보스 인카운터 풀 조회 (3액트 고정, 엔들리스는 전체 로테이션) */
export function getBossEncounters(mapIndex: number): readonly (readonly string[])[] {
  if (mapIndex > 3) {
    return [['slime_boss'], ['gremlin_king'], ['stone_guardian'], ['crystal_hydra'], ['tower_heart']];
  }
  if (mapIndex === 3) return [['tower_heart']];
  return mapIndex === 2 ? [['stone_guardian'], ['crystal_hydra']] : BOSS_ENCOUNTERS;
}

/** 하위 호환용 (기존 코드 참조) */
export const ENCOUNTERS = NORMAL_ENCOUNTERS;
