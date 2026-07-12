// 포션 이름과 설명 번역

import type { PotionId } from '@tower-of-cardborn/game-core/types/potion';
import type { Language } from './types';

interface PotionText {
  readonly name: string;
  readonly description: string;
}

const POTION_TEXT: Record<PotionId, Record<Language, PotionText>> = {
  healing_potion: {
    ko: { name: '회복 포션', description: 'HP를 20 회복합니다.' },
    en: { name: 'Healing Potion', description: 'Restore 20 HP.' },
    zh: { name: '治疗药水', description: '恢复20点生命值。' },
  },
  block_potion: {
    ko: { name: '방어 포션', description: '방어도를 15 얻습니다.' },
    en: { name: 'Block Potion', description: 'Gain 15 Block.' },
    zh: { name: '防御药水', description: '获得15点格挡。' },
  },
  fire_potion: {
    ko: { name: '화염 포션', description: '선택한 적에게 고정 피해 20을 줍니다.' },
    en: { name: 'Fire Potion', description: 'Deal 20 fixed damage to the selected enemy.' },
    zh: { name: '火焰药水', description: '对选中的敌人造成20点固定伤害。' },
  },
  energy_potion: {
    ko: { name: '에너지 포션', description: '이번 턴 에너지를 2 얻습니다.' },
    en: { name: 'Energy Potion', description: 'Gain 2 Energy this turn.' },
    zh: { name: '能量药水', description: '本回合获得2点能量。' },
  },
  strength_potion: {
    ko: { name: '힘의 포션', description: '이번 전투 동안 힘을 2 얻습니다.' },
    en: { name: 'Strength Potion', description: 'Gain 2 Strength for this combat.' },
    zh: { name: '力量药水', description: '本场战斗获得2点力量。' },
  },
  toxin_potion: {
    ko: { name: '맹독 포션', description: '선택한 적에게 독 6을 부여합니다.' },
    en: { name: 'Toxin Potion', description: 'Apply 6 Poison to the selected enemy.' },
    zh: { name: '剧毒药水', description: '对选中的敌人施加6层中毒。' },
  },
};

/** 언어별 포션 이름 조회 */
export function getPotionName(potionId: PotionId, lang: Language): string {
  return POTION_TEXT[potionId][lang].name;
}

/** 언어별 포션 설명 조회 */
export function getPotionDescription(potionId: PotionId, lang: Language): string {
  return POTION_TEXT[potionId][lang].description;
}
