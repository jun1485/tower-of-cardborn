// 유물 이름과 설명 번역

import type { RelicId } from '@tower-of-cardborn/game-core/types/relic';
import type { Language } from './types';

interface RelicText {
  readonly name: string;
  readonly description: string;
}

const RELIC_TEXT: Record<RelicId, Record<Language, RelicText>> = {
  iron_heart: {
    ko: { name: '철의 심장', description: '최대 HP가 8 증가하고 8 회복합니다.' },
    en: { name: 'Iron Heart', description: 'Gain 8 max HP and heal 8 HP.' },
    zh: { name: '钢铁之心', description: '最大生命值提高8并恢复8点生命。' },
  },
  energy_core: {
    ko: { name: '에너지 코어', description: '전투 중 최대 에너지가 1 증가합니다.' },
    en: { name: 'Energy Core', description: 'Increase maximum Energy by 1 during combat.' },
    zh: { name: '能量核心', description: '战斗中的最大能量提高1。' },
  },
  warrior_emblem: {
    ko: { name: '전사의 문장', description: '전투를 힘 1과 함께 시작합니다.' },
    en: { name: 'Warrior Emblem', description: 'Start combat with 1 Strength.' },
    zh: { name: '战士徽记', description: '战斗开始时获得1点力量。' },
  },
  golden_idol: {
    ko: { name: '황금 우상', description: '이후 전투에서 얻는 골드가 25% 증가합니다.' },
    en: { name: 'Golden Idol', description: 'Gain 25% more gold from future combats.' },
    zh: { name: '黄金神像', description: '之后战斗获得的金币增加25%。' },
  },
};

/** 언어별 유물 이름 조회 */
export function getRelicName(relicId: RelicId, lang: Language): string {
  return RELIC_TEXT[relicId][lang].name;
}

/** 언어별 유물 설명 조회 */
export function getRelicDescription(relicId: RelicId, lang: Language): string {
  return RELIC_TEXT[relicId][lang].description;
}
