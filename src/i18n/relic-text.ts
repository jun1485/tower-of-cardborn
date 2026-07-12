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
  sturdy_aegis: {
    ko: { name: '견고한 방패', description: '전투를 방어도 6과 함께 시작합니다.' },
    en: { name: 'Sturdy Aegis', description: 'Start combat with 6 Block.' },
    zh: { name: '坚固盾牌', description: '战斗开始时获得6点格挡。' },
  },
  dancers_anklet: {
    ko: { name: '무희의 발찌', description: '전투를 민첩 1과 함께 시작합니다.' },
    en: { name: "Dancer's Anklet", description: 'Start combat with 1 Dexterity.' },
    zh: { name: '舞者的脚链', description: '战斗开始时获得1点敏捷。' },
  },
  healing_charm: {
    ko: { name: '치유의 부적', description: '휴식 시 회복량이 15% 증가합니다.' },
    en: { name: 'Healing Charm', description: 'Heal 15% more at Rest sites.' },
    zh: { name: '治愈护符', description: '休息时恢复量增加15%。' },
  },
  merchants_ring: {
    ko: { name: '상인의 반지', description: '상점 가격이 20% 할인됩니다.' },
    en: { name: "Merchant's Ring", description: 'Shop prices are reduced by 20%.' },
    zh: { name: '商人的戒指', description: '商店价格降低20%。' },
  },
  scouts_spyglass: {
    ko: { name: '정찰병의 망원경', description: '전투 보상 카드 선택지가 1장 늘어납니다.' },
    en: { name: "Scout's Spyglass", description: 'Combat rewards offer 1 more card choice.' },
    zh: { name: '侦察兵的望远镜', description: '战斗奖励多提供1张卡牌选择。' },
  },
  titan_heart: {
    ko: { name: '거인의 심장', description: '최대 HP가 20 증가하고 20 회복합니다.' },
    en: { name: 'Titan Heart', description: 'Gain 20 max HP and heal 20 HP.' },
    zh: { name: '泰坦之心', description: '最大生命值提高20并恢复20点生命。' },
  },
  berserker_totem: {
    ko: { name: '광전사의 토템', description: '전투를 힘 2와 함께 시작합니다.' },
    en: { name: 'Berserker Totem', description: 'Start combat with 2 Strength.' },
    zh: { name: '狂战士图腾', description: '战斗开始时获得2点力量。' },
  },
  void_prism: {
    ko: { name: '공허의 프리즘', description: '전투를 힘 1, 민첩 1과 함께 시작합니다.' },
    en: { name: 'Void Prism', description: 'Start combat with 1 Strength and 1 Dexterity.' },
    zh: { name: '虚空棱镜', description: '战斗开始时获得1点力量和1点敏捷。' },
  },
  clockwork_heart: {
    ko: { name: '태엽 심장', description: '매 턴 시작 시 방어도 2를 얻습니다.' },
    en: { name: 'Clockwork Heart', description: 'Gain 2 Block at the start of each turn.' },
    zh: { name: '发条之心', description: '每回合开始时获得2点格挡。' },
  },
  phoenix_feather: {
    ko: { name: '불사조 깃털', description: '매 턴 시작 시 HP를 2 회복합니다.' },
    en: { name: 'Phoenix Feather', description: 'Heal 2 HP at the start of each turn.' },
    zh: { name: '凤凰之羽', description: '每回合开始时恢复2点HP。' },
  },
  ancient_grimoire: {
    ko: { name: '고대 마도서', description: '매 턴 카드 1장을 추가로 드로우합니다.' },
    en: { name: 'Ancient Grimoire', description: 'Draw 1 additional card each turn.' },
    zh: { name: '古代魔典', description: '每回合额外抽1张牌。' },
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
