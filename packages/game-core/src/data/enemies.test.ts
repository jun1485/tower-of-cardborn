// 적 정의와 인카운터 참조 무결성 검증

import { describe, expect, it } from 'vitest';
import {
  ACT_THREE_ENCOUNTERS, ACT_TWO_ENCOUNTERS, BOSS_ENCOUNTERS,
  ELITE_ENCOUNTERS, ENEMY_DEFINITIONS, NORMAL_ENCOUNTERS,
} from './enemies';

describe('적 데이터', () => {
  it('정의 키와 ID 및 HP가 유효하다', () => {
    for (const [enemyId, definition] of Object.entries(ENEMY_DEFINITIONS)) {
      expect(definition.id).toBe(enemyId);
      expect(definition.hp).toBeGreaterThan(0);
      expect(definition.maxHp).toBe(definition.hp);
    }
  });

  it('모든 인카운터가 존재하는 적만 참조한다', () => {
    const encounters = [
      ...NORMAL_ENCOUNTERS,
      ...ACT_TWO_ENCOUNTERS,
      ...ACT_THREE_ENCOUNTERS,
      ...ELITE_ENCOUNTERS,
      ...BOSS_ENCOUNTERS,
    ];

    expect(encounters.flat().every((enemyId) => ENEMY_DEFINITIONS[enemyId] !== undefined)).toBe(true);
  });
});
