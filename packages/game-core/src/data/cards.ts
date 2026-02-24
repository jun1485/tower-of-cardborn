// 카드 데이터 정의 (전사/궁수/마법사 기본 + 업그레이드)

import type { CardDefinition } from '../types/card';
import type { CharacterClass } from '../types/game';

export const CARD_DEFINITIONS: Record<string, CardDefinition> = {
  // #region 기본 카드
  strike: {
    id: 'strike',
    name: 'Strike',
    description: '6 데미지.',
    type: 'attack',
    cost: 1,
    effects: [{ type: 'damage', value: 6, target: 'single' }],
    upgradeId: 'strike+',
  },
  defend: {
    id: 'defend',
    name: 'Defend',
    description: '5 방어.',
    type: 'skill',
    cost: 1,
    effects: [{ type: 'block', value: 5 }],
    upgradeId: 'defend+',
  },
  bash: {
    id: 'bash',
    name: 'Bash',
    description: '8 데미지. 취약 2턴 부여.',
    type: 'attack',
    cost: 2,
    effects: [
      { type: 'damage', value: 8, target: 'single' },
      { type: 'apply_status', value: 2, target: 'single', statusType: 'vulnerable' },
    ],
    upgradeId: 'bash+',
  },
  cleave: {
    id: 'cleave',
    name: 'Cleave',
    description: '8 데미지.',
    type: 'attack',
    cost: 1,
    effects: [{ type: 'damage', value: 8, target: 'single' }],
    upgradeId: 'cleave+',
  },
  shrug_it_off: {
    id: 'shrug_it_off',
    name: 'Shrug It Off',
    description: '8 방어. 카드 1장 드로우.',
    type: 'skill',
    cost: 1,
    effects: [
      { type: 'block', value: 8 },
      { type: 'draw', value: 1 },
    ],
    upgradeId: 'shrug_it_off+',
  },
  pommel_strike: {
    id: 'pommel_strike',
    name: 'Pommel Strike',
    description: '9 데미지. 카드 1장 드로우.',
    type: 'attack',
    cost: 1,
    effects: [
      { type: 'damage', value: 9, target: 'single' },
      { type: 'draw', value: 1 },
    ],
    upgradeId: 'pommel_strike+',
  },
  twin_strike: {
    id: 'twin_strike',
    name: 'Twin Strike',
    description: '5 데미지를 2회.',
    type: 'attack',
    cost: 1,
    effects: [
      { type: 'damage', value: 5, target: 'single' },
      { type: 'damage', value: 5, target: 'single' },
    ],
    upgradeId: 'twin_strike+',
  },
  iron_wave: {
    id: 'iron_wave',
    name: 'Iron Wave',
    description: '5 방어. 5 데미지.',
    type: 'attack',
    cost: 1,
    effects: [
      { type: 'block', value: 5 },
      { type: 'damage', value: 5, target: 'single' },
    ],
    upgradeId: 'iron_wave+',
  },
  clothesline: {
    id: 'clothesline',
    name: 'Clothesline',
    description: '12 데미지. 약화 2턴 부여.',
    type: 'attack',
    cost: 2,
    effects: [
      { type: 'damage', value: 12, target: 'single' },
      { type: 'apply_status', value: 2, target: 'single', statusType: 'weak' },
    ],
    upgradeId: 'clothesline+',
  },
  true_grit: {
    id: 'true_grit',
    name: 'True Grit',
    description: '7 방어.',
    type: 'skill',
    cost: 1,
    effects: [{ type: 'block', value: 7 }],
    upgradeId: 'true_grit+',
  },
  battle_trance: {
    id: 'battle_trance',
    name: 'Battle Trance',
    description: '카드 3장 드로우.',
    type: 'skill',
    cost: 0,
    effects: [{ type: 'draw', value: 3 }],
    upgradeId: 'battle_trance+',
  },
  carnage: {
    id: 'carnage',
    name: 'Carnage',
    description: '20 데미지.',
    type: 'attack',
    cost: 2,
    effects: [{ type: 'damage', value: 20, target: 'single' }],
    upgradeId: 'carnage+',
  },
  bloodletting: {
    id: 'bloodletting',
    name: 'Bloodletting',
    description: 'HP 3 소모. 에너지 2 획득.',
    type: 'skill',
    cost: 0,
    exhaust: true,
    effects: [
      { type: 'self_damage', value: 3 },
      { type: 'gain_energy', value: 2 },
    ],
    upgradeId: 'bloodletting+',
  },
  heavy_blade: {
    id: 'heavy_blade',
    name: 'Heavy Blade',
    description: '14 데미지.',
    type: 'attack',
    cost: 2,
    effects: [{ type: 'damage', value: 14, target: 'single' }],
    upgradeId: 'heavy_blade+',
  },
  // 신규 카드
  inflame: {
    id: 'inflame',
    name: 'Inflame',
    description: '힘 2 증가.',
    type: 'power',
    cost: 1,
    effects: [{ type: 'gain_strength', value: 2 }],
    upgradeId: 'inflame+',
  },
  bludgeon: {
    id: 'bludgeon',
    name: 'Bludgeon',
    description: '32 데미지.',
    type: 'attack',
    cost: 3,
    effects: [{ type: 'damage', value: 32, target: 'single' }],
    upgradeId: 'bludgeon+',
  },
  uppercut: {
    id: 'uppercut',
    name: 'Uppercut',
    description: '13 데미지. 약화 1. 취약 1.',
    type: 'attack',
    cost: 2,
    exhaust: true,
    effects: [
      { type: 'damage', value: 13, target: 'single' },
      { type: 'apply_status', value: 1, target: 'single', statusType: 'weak' },
      { type: 'apply_status', value: 1, target: 'single', statusType: 'vulnerable' },
    ],
    upgradeId: 'uppercut+',
  },
  anger: {
    id: 'anger',
    name: 'Anger',
    description: '6 데미지.',
    type: 'attack',
    cost: 0,
    effects: [{ type: 'damage', value: 6, target: 'single' }],
    upgradeId: 'anger+',
  },
  impervious: {
    id: 'impervious',
    name: 'Impervious',
    description: '30 방어.',
    type: 'skill',
    cost: 2,
    exhaust: true,
    effects: [{ type: 'block', value: 30 }],
    upgradeId: 'impervious+',
  },
  offering: {
    id: 'offering',
    name: 'Offering',
    description: 'HP 6 소모. 에너지 2. 카드 3장 드로우.',
    type: 'skill',
    cost: 0,
    exhaust: true,
    effects: [
      { type: 'self_damage', value: 6 },
      { type: 'gain_energy', value: 2 },
      { type: 'draw', value: 3 },
    ],
    upgradeId: 'offering+',
  },
  sword_boomerang: {
    id: 'sword_boomerang',
    name: 'Sword Boomerang',
    description: '3 데미지를 3회.',
    type: 'attack',
    cost: 1,
    effects: [
      { type: 'damage', value: 3, target: 'single' },
      { type: 'damage', value: 3, target: 'single' },
      { type: 'damage', value: 3, target: 'single' },
    ],
    upgradeId: 'sword_boomerang+',
  },
  // #endregion

  // #region 업그레이드 카드
  'strike+': {
    id: 'strike+',
    name: 'Strike+',
    description: '9 데미지.',
    type: 'attack',
    cost: 1,
    effects: [{ type: 'damage', value: 9, target: 'single' }],
    upgraded: true,
  },
  'defend+': {
    id: 'defend+',
    name: 'Defend+',
    description: '8 방어.',
    type: 'skill',
    cost: 1,
    effects: [{ type: 'block', value: 8 }],
    upgraded: true,
  },
  'bash+': {
    id: 'bash+',
    name: 'Bash+',
    description: '10 데미지. 취약 3턴 부여.',
    type: 'attack',
    cost: 2,
    effects: [
      { type: 'damage', value: 10, target: 'single' },
      { type: 'apply_status', value: 3, target: 'single', statusType: 'vulnerable' },
    ],
    upgraded: true,
  },
  'cleave+': {
    id: 'cleave+',
    name: 'Cleave+',
    description: '11 데미지.',
    type: 'attack',
    cost: 1,
    effects: [{ type: 'damage', value: 11, target: 'single' }],
    upgraded: true,
  },
  'shrug_it_off+': {
    id: 'shrug_it_off+',
    name: 'Shrug It Off+',
    description: '11 방어. 카드 1장 드로우.',
    type: 'skill',
    cost: 1,
    effects: [
      { type: 'block', value: 11 },
      { type: 'draw', value: 1 },
    ],
    upgraded: true,
  },
  'pommel_strike+': {
    id: 'pommel_strike+',
    name: 'Pommel Strike+',
    description: '10 데미지. 카드 2장 드로우.',
    type: 'attack',
    cost: 1,
    effects: [
      { type: 'damage', value: 10, target: 'single' },
      { type: 'draw', value: 2 },
    ],
    upgraded: true,
  },
  'twin_strike+': {
    id: 'twin_strike+',
    name: 'Twin Strike+',
    description: '7 데미지를 2회.',
    type: 'attack',
    cost: 1,
    effects: [
      { type: 'damage', value: 7, target: 'single' },
      { type: 'damage', value: 7, target: 'single' },
    ],
    upgraded: true,
  },
  'iron_wave+': {
    id: 'iron_wave+',
    name: 'Iron Wave+',
    description: '7 방어. 7 데미지.',
    type: 'attack',
    cost: 1,
    effects: [
      { type: 'block', value: 7 },
      { type: 'damage', value: 7, target: 'single' },
    ],
    upgraded: true,
  },
  'clothesline+': {
    id: 'clothesline+',
    name: 'Clothesline+',
    description: '14 데미지. 약화 3턴 부여.',
    type: 'attack',
    cost: 2,
    effects: [
      { type: 'damage', value: 14, target: 'single' },
      { type: 'apply_status', value: 3, target: 'single', statusType: 'weak' },
    ],
    upgraded: true,
  },
  'true_grit+': {
    id: 'true_grit+',
    name: 'True Grit+',
    description: '10 방어.',
    type: 'skill',
    cost: 1,
    effects: [{ type: 'block', value: 10 }],
    upgraded: true,
  },
  'battle_trance+': {
    id: 'battle_trance+',
    name: 'Battle Trance+',
    description: '카드 4장 드로우.',
    type: 'skill',
    cost: 0,
    effects: [{ type: 'draw', value: 4 }],
    upgraded: true,
  },
  'carnage+': {
    id: 'carnage+',
    name: 'Carnage+',
    description: '28 데미지.',
    type: 'attack',
    cost: 2,
    effects: [{ type: 'damage', value: 28, target: 'single' }],
    upgraded: true,
  },
  'heavy_blade+': {
    id: 'heavy_blade+',
    name: 'Heavy Blade+',
    description: '18 데미지.',
    type: 'attack',
    cost: 2,
    effects: [{ type: 'damage', value: 18, target: 'single' }],
    upgraded: true,
  },
  'bloodletting+': {
    id: 'bloodletting+',
    name: 'Bloodletting+',
    description: 'HP 3 소모. 에너지 3 획득.',
    type: 'skill',
    cost: 0,
    exhaust: true,
    effects: [
      { type: 'self_damage', value: 3 },
      { type: 'gain_energy', value: 3 },
    ],
    upgraded: true,
  },
  'inflame+': {
    id: 'inflame+',
    name: 'Inflame+',
    description: '힘 3 증가.',
    type: 'power',
    cost: 1,
    effects: [{ type: 'gain_strength', value: 3 }],
    upgraded: true,
  },
  'bludgeon+': {
    id: 'bludgeon+',
    name: 'Bludgeon+',
    description: '42 데미지.',
    type: 'attack',
    cost: 3,
    effects: [{ type: 'damage', value: 42, target: 'single' }],
    upgraded: true,
  },
  'uppercut+': {
    id: 'uppercut+',
    name: 'Uppercut+',
    description: '13 데미지. 약화 2. 취약 2.',
    type: 'attack',
    cost: 2,
    exhaust: true,
    effects: [
      { type: 'damage', value: 13, target: 'single' },
      { type: 'apply_status', value: 2, target: 'single', statusType: 'weak' },
      { type: 'apply_status', value: 2, target: 'single', statusType: 'vulnerable' },
    ],
    upgraded: true,
  },
  'anger+': {
    id: 'anger+',
    name: 'Anger+',
    description: '8 데미지.',
    type: 'attack',
    cost: 0,
    effects: [{ type: 'damage', value: 8, target: 'single' }],
    upgraded: true,
  },
  'impervious+': {
    id: 'impervious+',
    name: 'Impervious+',
    description: '40 방어.',
    type: 'skill',
    cost: 2,
    exhaust: true,
    effects: [{ type: 'block', value: 40 }],
    upgraded: true,
  },
  'offering+': {
    id: 'offering+',
    name: 'Offering+',
    description: 'HP 6 소모. 에너지 2. 카드 5장 드로우.',
    type: 'skill',
    cost: 0,
    exhaust: true,
    effects: [
      { type: 'self_damage', value: 6 },
      { type: 'gain_energy', value: 2 },
      { type: 'draw', value: 5 },
    ],
    upgraded: true,
  },
  'sword_boomerang+': {
    id: 'sword_boomerang+',
    name: 'Sword Boomerang+',
    description: '3 데미지를 4회.',
    type: 'attack',
    cost: 1,
    effects: [
      { type: 'damage', value: 3, target: 'single' },
      { type: 'damage', value: 3, target: 'single' },
      { type: 'damage', value: 3, target: 'single' },
      { type: 'damage', value: 3, target: 'single' },
    ],
    upgraded: true,
  },
  // #endregion

  // #region 궁수 기본 카드
  quick_shot: {
    id: 'quick_shot', name: 'Quick Shot',
    description: '6 데미지.',
    type: 'attack', cost: 1,
    effects: [{ type: 'damage', value: 6, target: 'single' }],
    upgradeId: 'quick_shot+',
  },
  dodge: {
    id: 'dodge', name: 'Dodge',
    description: '5 방어.',
    type: 'skill', cost: 1,
    effects: [{ type: 'block', value: 5 }],
    upgradeId: 'dodge+',
  },
  aimed_shot: {
    id: 'aimed_shot', name: 'Aimed Shot',
    description: '8 데미지. 취약 2턴 부여.',
    type: 'attack', cost: 2,
    effects: [
      { type: 'damage', value: 8, target: 'single' },
      { type: 'apply_status', value: 2, target: 'single', statusType: 'vulnerable' },
    ],
    upgradeId: 'aimed_shot+',
  },
  // 궁수 보상 카드
  rain_of_arrows: {
    id: 'rain_of_arrows', name: 'Rain of Arrows',
    description: '4 데미지를 2회.',
    type: 'attack', cost: 1,
    effects: [
      { type: 'damage', value: 4, target: 'single' },
      { type: 'damage', value: 4, target: 'single' },
    ],
    upgradeId: 'rain_of_arrows+',
  },
  piercing_arrow: {
    id: 'piercing_arrow', name: 'Piercing Arrow',
    description: '18 데미지.',
    type: 'attack', cost: 2,
    effects: [{ type: 'damage', value: 18, target: 'single' }],
    upgradeId: 'piercing_arrow+',
  },
  evasion: {
    id: 'evasion', name: 'Evasion',
    description: '8 방어. 카드 1장 드로우.',
    type: 'skill', cost: 1,
    effects: [{ type: 'block', value: 8 }, { type: 'draw', value: 1 }],
    upgradeId: 'evasion+',
  },
  multishot: {
    id: 'multishot', name: 'Multishot',
    description: '3 데미지를 3회.',
    type: 'attack', cost: 1,
    effects: [
      { type: 'damage', value: 3, target: 'single' },
      { type: 'damage', value: 3, target: 'single' },
      { type: 'damage', value: 3, target: 'single' },
    ],
    upgradeId: 'multishot+',
  },
  deadly_aim: {
    id: 'deadly_aim', name: 'Deadly Aim',
    description: '힘 2 증가.',
    type: 'power', cost: 1,
    effects: [{ type: 'gain_strength', value: 2 }],
    upgradeId: 'deadly_aim+',
  },
  poison_arrow: {
    id: 'poison_arrow', name: 'Poison Arrow',
    description: '10 데미지. 약화 2턴 부여.',
    type: 'attack', cost: 2,
    effects: [
      { type: 'damage', value: 10, target: 'single' },
      { type: 'apply_status', value: 2, target: 'single', statusType: 'weak' },
    ],
    upgradeId: 'poison_arrow+',
  },
  arrow_barrage: {
    id: 'arrow_barrage', name: 'Arrow Barrage',
    description: '5 데미지를 4회.',
    type: 'attack', cost: 3,
    effects: [
      { type: 'damage', value: 5, target: 'single' },
      { type: 'damage', value: 5, target: 'single' },
      { type: 'damage', value: 5, target: 'single' },
      { type: 'damage', value: 5, target: 'single' },
    ],
    upgradeId: 'arrow_barrage+',
  },
  preparation: {
    id: 'preparation', name: 'Preparation',
    description: '카드 3장 드로우.',
    type: 'skill', cost: 0,
    effects: [{ type: 'draw', value: 3 }],
    upgradeId: 'preparation+',
  },
  smoke_bomb: {
    id: 'smoke_bomb', name: 'Smoke Bomb',
    description: '25 방어.',
    type: 'skill', cost: 2, exhaust: true,
    effects: [{ type: 'block', value: 25 }],
    upgradeId: 'smoke_bomb+',
  },
  headshot: {
    id: 'headshot', name: 'Headshot',
    description: '13 데미지. 약화 1. 취약 1.',
    type: 'attack', cost: 2, exhaust: true,
    effects: [
      { type: 'damage', value: 13, target: 'single' },
      { type: 'apply_status', value: 1, target: 'single', statusType: 'weak' },
      { type: 'apply_status', value: 1, target: 'single', statusType: 'vulnerable' },
    ],
    upgradeId: 'headshot+',
  },
  // 궁수 업그레이드 카드
  'quick_shot+': {
    id: 'quick_shot+', name: 'Quick Shot+',
    description: '9 데미지.',
    type: 'attack', cost: 1,
    effects: [{ type: 'damage', value: 9, target: 'single' }],
    upgraded: true,
  },
  'dodge+': {
    id: 'dodge+', name: 'Dodge+',
    description: '8 방어.',
    type: 'skill', cost: 1,
    effects: [{ type: 'block', value: 8 }],
    upgraded: true,
  },
  'aimed_shot+': {
    id: 'aimed_shot+', name: 'Aimed Shot+',
    description: '10 데미지. 취약 3턴 부여.',
    type: 'attack', cost: 2,
    effects: [
      { type: 'damage', value: 10, target: 'single' },
      { type: 'apply_status', value: 3, target: 'single', statusType: 'vulnerable' },
    ],
    upgraded: true,
  },
  'rain_of_arrows+': {
    id: 'rain_of_arrows+', name: 'Rain of Arrows+',
    description: '5 데미지를 2회.',
    type: 'attack', cost: 1,
    effects: [
      { type: 'damage', value: 5, target: 'single' },
      { type: 'damage', value: 5, target: 'single' },
    ],
    upgraded: true,
  },
  'piercing_arrow+': {
    id: 'piercing_arrow+', name: 'Piercing Arrow+',
    description: '24 데미지.',
    type: 'attack', cost: 2,
    effects: [{ type: 'damage', value: 24, target: 'single' }],
    upgraded: true,
  },
  'evasion+': {
    id: 'evasion+', name: 'Evasion+',
    description: '11 방어. 카드 1장 드로우.',
    type: 'skill', cost: 1,
    effects: [{ type: 'block', value: 11 }, { type: 'draw', value: 1 }],
    upgraded: true,
  },
  'multishot+': {
    id: 'multishot+', name: 'Multishot+',
    description: '4 데미지를 3회.',
    type: 'attack', cost: 1,
    effects: [
      { type: 'damage', value: 4, target: 'single' },
      { type: 'damage', value: 4, target: 'single' },
      { type: 'damage', value: 4, target: 'single' },
    ],
    upgraded: true,
  },
  'deadly_aim+': {
    id: 'deadly_aim+', name: 'Deadly Aim+',
    description: '힘 3 증가.',
    type: 'power', cost: 1,
    effects: [{ type: 'gain_strength', value: 3 }],
    upgraded: true,
  },
  'poison_arrow+': {
    id: 'poison_arrow+', name: 'Poison Arrow+',
    description: '12 데미지. 약화 3턴 부여.',
    type: 'attack', cost: 2,
    effects: [
      { type: 'damage', value: 12, target: 'single' },
      { type: 'apply_status', value: 3, target: 'single', statusType: 'weak' },
    ],
    upgraded: true,
  },
  'arrow_barrage+': {
    id: 'arrow_barrage+', name: 'Arrow Barrage+',
    description: '6 데미지를 4회.',
    type: 'attack', cost: 3,
    effects: [
      { type: 'damage', value: 6, target: 'single' },
      { type: 'damage', value: 6, target: 'single' },
      { type: 'damage', value: 6, target: 'single' },
      { type: 'damage', value: 6, target: 'single' },
    ],
    upgraded: true,
  },
  'preparation+': {
    id: 'preparation+', name: 'Preparation+',
    description: '카드 4장 드로우.',
    type: 'skill', cost: 0,
    effects: [{ type: 'draw', value: 4 }],
    upgraded: true,
  },
  'smoke_bomb+': {
    id: 'smoke_bomb+', name: 'Smoke Bomb+',
    description: '35 방어.',
    type: 'skill', cost: 2, exhaust: true,
    effects: [{ type: 'block', value: 35 }],
    upgraded: true,
  },
  'headshot+': {
    id: 'headshot+', name: 'Headshot+',
    description: '13 데미지. 약화 2. 취약 2.',
    type: 'attack', cost: 2, exhaust: true,
    effects: [
      { type: 'damage', value: 13, target: 'single' },
      { type: 'apply_status', value: 2, target: 'single', statusType: 'weak' },
      { type: 'apply_status', value: 2, target: 'single', statusType: 'vulnerable' },
    ],
    upgraded: true,
  },
  // #endregion

  // #region 마법사 기본 카드
  magic_bolt: {
    id: 'magic_bolt', name: 'Magic Bolt',
    description: '6 데미지.',
    type: 'attack', cost: 1,
    effects: [{ type: 'damage', value: 6, target: 'single' }],
    upgradeId: 'magic_bolt+',
  },
  arcane_barrier: {
    id: 'arcane_barrier', name: 'Arcane Barrier',
    description: '5 방어.',
    type: 'skill', cost: 1,
    effects: [{ type: 'block', value: 5 }],
    upgradeId: 'arcane_barrier+',
  },
  mana_blast: {
    id: 'mana_blast', name: 'Mana Blast',
    description: '8 데미지. 취약 2턴 부여.',
    type: 'attack', cost: 2,
    effects: [
      { type: 'damage', value: 8, target: 'single' },
      { type: 'apply_status', value: 2, target: 'single', statusType: 'vulnerable' },
    ],
    upgradeId: 'mana_blast+',
  },
  ember_lance: {
    id: 'ember_lance', name: 'Ember Lance',
    description: '9 데미지.',
    type: 'attack', cost: 1,
    effects: [{ type: 'damage', value: 9, target: 'single' }],
    upgradeId: 'ember_lance+',
  },
  frost_shield: {
    id: 'frost_shield', name: 'Frost Shield',
    description: '8 방어. 카드 1장 드로우.',
    type: 'skill', cost: 1,
    effects: [{ type: 'block', value: 8 }, { type: 'draw', value: 1 }],
    upgradeId: 'frost_shield+',
  },
  lightning_chain: {
    id: 'lightning_chain', name: 'Lightning Chain',
    description: '4 데미지를 2회.',
    type: 'attack', cost: 1,
    effects: [
      { type: 'damage', value: 4, target: 'single' },
      { type: 'damage', value: 4, target: 'single' },
    ],
    upgradeId: 'lightning_chain+',
  },
  arcane_intellect: {
    id: 'arcane_intellect', name: 'Arcane Intellect',
    description: '카드 3장 드로우.',
    type: 'skill', cost: 0,
    effects: [{ type: 'draw', value: 3 }],
    upgradeId: 'arcane_intellect+',
  },
  mana_surge: {
    id: 'mana_surge', name: 'Mana Surge',
    description: '에너지 1 획득. 카드 1장 드로우.',
    type: 'skill', cost: 0,
    effects: [{ type: 'gain_energy', value: 1 }, { type: 'draw', value: 1 }],
    upgradeId: 'mana_surge+',
  },
  flame_wave: {
    id: 'flame_wave', name: 'Flame Wave',
    description: '모든 적에게 7 데미지.',
    type: 'attack', cost: 2,
    effects: [{ type: 'damage', value: 7, target: 'all' }],
    upgradeId: 'flame_wave+',
  },
  frost_nova: {
    id: 'frost_nova', name: 'Frost Nova',
    description: '6 방어. 약화 2턴 부여.',
    type: 'skill', cost: 1,
    effects: [
      { type: 'block', value: 6 },
      { type: 'apply_status', value: 2, target: 'single', statusType: 'weak' },
    ],
    upgradeId: 'frost_nova+',
  },
  thunder_mark: {
    id: 'thunder_mark', name: 'Thunder Mark',
    description: '12 데미지. 취약 1턴 부여.',
    type: 'attack', cost: 2,
    effects: [
      { type: 'damage', value: 12, target: 'single' },
      { type: 'apply_status', value: 1, target: 'single', statusType: 'vulnerable' },
    ],
    upgradeId: 'thunder_mark+',
  },
  spell_focus: {
    id: 'spell_focus', name: 'Spell Focus',
    description: '힘 2 증가.',
    type: 'power', cost: 1,
    effects: [{ type: 'gain_strength', value: 2 }],
    upgradeId: 'spell_focus+',
  },
  mana_burst: {
    id: 'mana_burst', name: 'Mana Burst',
    description: '6 데미지.',
    type: 'attack', cost: 0,
    effects: [{ type: 'damage', value: 6, target: 'single' }],
    upgradeId: 'mana_burst+',
  },
  crystal_wall: {
    id: 'crystal_wall', name: 'Crystal Wall',
    description: '24 방어.',
    type: 'skill', cost: 2, exhaust: true,
    effects: [{ type: 'block', value: 24 }],
    upgradeId: 'crystal_wall+',
  },
  arcane_missile: {
    id: 'arcane_missile', name: 'Arcane Missile',
    description: '3 데미지를 3회.',
    type: 'attack', cost: 1,
    effects: [
      { type: 'damage', value: 3, target: 'single' },
      { type: 'damage', value: 3, target: 'single' },
      { type: 'damage', value: 3, target: 'single' },
    ],
    upgradeId: 'arcane_missile+',
  },
  elemental_orb: {
    id: 'elemental_orb', name: 'Elemental Orb',
    description: '힘 3 증가.',
    type: 'power', cost: 2,
    effects: [{ type: 'gain_strength', value: 3 }],
    upgradeId: 'elemental_orb+',
  },
  rune_spear: {
    id: 'rune_spear', name: 'Rune Spear',
    description: '14 데미지. 카드 1장 드로우.',
    type: 'attack', cost: 2,
    effects: [{ type: 'damage', value: 14, target: 'single' }, { type: 'draw', value: 1 }],
    upgradeId: 'rune_spear+',
  },
  blink_step: {
    id: 'blink_step', name: 'Blink Step',
    description: '7 방어. 에너지 1 획득.',
    type: 'skill', cost: 1,
    effects: [{ type: 'block', value: 7 }, { type: 'gain_energy', value: 1 }],
    upgradeId: 'blink_step+',
  },
  meteor: {
    id: 'meteor', name: 'Meteor',
    description: '30 데미지.',
    type: 'attack', cost: 3, exhaust: true,
    effects: [{ type: 'damage', value: 30, target: 'single' }],
    upgradeId: 'meteor+',
  },
  overcharge: {
    id: 'overcharge', name: 'Overcharge',
    description: 'HP 4 소모. 에너지 2. 카드 1장 드로우.',
    type: 'skill', cost: 0,
    effects: [
      { type: 'self_damage', value: 4 },
      { type: 'gain_energy', value: 2 },
      { type: 'draw', value: 1 },
    ],
    upgradeId: 'overcharge+',
  },
  prism_beam: {
    id: 'prism_beam', name: 'Prism Beam',
    description: '모든 적에게 10 데미지.',
    type: 'attack', cost: 2,
    effects: [{ type: 'damage', value: 10, target: 'all' }],
    upgradeId: 'prism_beam+',
  },
  mind_shock: {
    id: 'mind_shock', name: 'Mind Shock',
    description: '7 데미지. 약화 1턴 부여.',
    type: 'attack', cost: 1,
    effects: [
      { type: 'damage', value: 7, target: 'single' },
      { type: 'apply_status', value: 1, target: 'single', statusType: 'weak' },
    ],
    upgradeId: 'mind_shock+',
  },
  rune_barrier: {
    id: 'rune_barrier', name: 'Rune Barrier',
    description: '11 방어.',
    type: 'skill', cost: 1,
    effects: [{ type: 'block', value: 11 }],
    upgradeId: 'rune_barrier+',
  },
  void_pulse: {
    id: 'void_pulse', name: 'Void Pulse',
    description: '16 데미지. HP 3 소모.',
    type: 'attack', cost: 2,
    effects: [
      { type: 'damage', value: 16, target: 'single' },
      { type: 'self_damage', value: 3 },
    ],
    upgradeId: 'void_pulse+',
  },
  starfall: {
    id: 'starfall', name: 'Starfall',
    description: '모든 적에게 20 데미지.',
    type: 'attack', cost: 3, exhaust: true,
    effects: [{ type: 'damage', value: 20, target: 'all' }],
    upgradeId: 'starfall+',
  },
  mana_leech: {
    id: 'mana_leech', name: 'Mana Leech',
    description: '8 데미지. 에너지 1 획득.',
    type: 'attack', cost: 1,
    effects: [{ type: 'damage', value: 8, target: 'single' }, { type: 'gain_energy', value: 1 }],
    upgradeId: 'mana_leech+',
  },
  spell_echo: {
    id: 'spell_echo', name: 'Spell Echo',
    description: '6 방어. 카드 2장 드로우.',
    type: 'skill', cost: 1,
    effects: [{ type: 'block', value: 6 }, { type: 'draw', value: 2 }],
    upgradeId: 'spell_echo+',
  },
  ignition: {
    id: 'ignition', name: 'Ignition',
    description: '10 데미지. 취약 1턴 부여.',
    type: 'attack', cost: 1,
    effects: [
      { type: 'damage', value: 10, target: 'single' },
      { type: 'apply_status', value: 1, target: 'single', statusType: 'vulnerable' },
    ],
    upgradeId: 'ignition+',
  },
  glacial_spike: {
    id: 'glacial_spike', name: 'Glacial Spike',
    description: '8 데미지. 약화 1턴 부여.',
    type: 'attack', cost: 1,
    effects: [
      { type: 'damage', value: 8, target: 'single' },
      { type: 'apply_status', value: 1, target: 'single', statusType: 'weak' },
    ],
    upgradeId: 'glacial_spike+',
  },
  storm_orb: {
    id: 'storm_orb', name: 'Storm Orb',
    description: '6 데미지를 3회.',
    type: 'attack', cost: 2,
    effects: [
      { type: 'damage', value: 6, target: 'single' },
      { type: 'damage', value: 6, target: 'single' },
      { type: 'damage', value: 6, target: 'single' },
    ],
    upgradeId: 'storm_orb+',
  },
  // 마법사 업그레이드 카드
  'magic_bolt+': {
    id: 'magic_bolt+', name: 'Magic Bolt+',
    description: '9 데미지.',
    type: 'attack', cost: 1,
    effects: [{ type: 'damage', value: 9, target: 'single' }],
    upgraded: true,
  },
  'arcane_barrier+': {
    id: 'arcane_barrier+', name: 'Arcane Barrier+',
    description: '8 방어.',
    type: 'skill', cost: 1,
    effects: [{ type: 'block', value: 8 }],
    upgraded: true,
  },
  'mana_blast+': {
    id: 'mana_blast+', name: 'Mana Blast+',
    description: '10 데미지. 취약 3턴 부여.',
    type: 'attack', cost: 2,
    effects: [
      { type: 'damage', value: 10, target: 'single' },
      { type: 'apply_status', value: 3, target: 'single', statusType: 'vulnerable' },
    ],
    upgraded: true,
  },
  'ember_lance+': {
    id: 'ember_lance+', name: 'Ember Lance+',
    description: '12 데미지.',
    type: 'attack', cost: 1,
    effects: [{ type: 'damage', value: 12, target: 'single' }],
    upgraded: true,
  },
  'frost_shield+': {
    id: 'frost_shield+', name: 'Frost Shield+',
    description: '11 방어. 카드 1장 드로우.',
    type: 'skill', cost: 1,
    effects: [{ type: 'block', value: 11 }, { type: 'draw', value: 1 }],
    upgraded: true,
  },
  'lightning_chain+': {
    id: 'lightning_chain+', name: 'Lightning Chain+',
    description: '5 데미지를 2회.',
    type: 'attack', cost: 1,
    effects: [
      { type: 'damage', value: 5, target: 'single' },
      { type: 'damage', value: 5, target: 'single' },
    ],
    upgraded: true,
  },
  'arcane_intellect+': {
    id: 'arcane_intellect+', name: 'Arcane Intellect+',
    description: '카드 4장 드로우.',
    type: 'skill', cost: 0,
    effects: [{ type: 'draw', value: 4 }],
    upgraded: true,
  },
  'mana_surge+': {
    id: 'mana_surge+', name: 'Mana Surge+',
    description: '에너지 2 획득. 카드 1장 드로우.',
    type: 'skill', cost: 0,
    effects: [{ type: 'gain_energy', value: 2 }, { type: 'draw', value: 1 }],
    upgraded: true,
  },
  'flame_wave+': {
    id: 'flame_wave+', name: 'Flame Wave+',
    description: '모든 적에게 10 데미지.',
    type: 'attack', cost: 2,
    effects: [{ type: 'damage', value: 10, target: 'all' }],
    upgraded: true,
  },
  'frost_nova+': {
    id: 'frost_nova+', name: 'Frost Nova+',
    description: '8 방어. 약화 3턴 부여.',
    type: 'skill', cost: 1,
    effects: [
      { type: 'block', value: 8 },
      { type: 'apply_status', value: 3, target: 'single', statusType: 'weak' },
    ],
    upgraded: true,
  },
  'thunder_mark+': {
    id: 'thunder_mark+', name: 'Thunder Mark+',
    description: '15 데미지. 취약 2턴 부여.',
    type: 'attack', cost: 2,
    effects: [
      { type: 'damage', value: 15, target: 'single' },
      { type: 'apply_status', value: 2, target: 'single', statusType: 'vulnerable' },
    ],
    upgraded: true,
  },
  'spell_focus+': {
    id: 'spell_focus+', name: 'Spell Focus+',
    description: '힘 3 증가.',
    type: 'power', cost: 1,
    effects: [{ type: 'gain_strength', value: 3 }],
    upgraded: true,
  },
  'mana_burst+': {
    id: 'mana_burst+', name: 'Mana Burst+',
    description: '8 데미지.',
    type: 'attack', cost: 0,
    effects: [{ type: 'damage', value: 8, target: 'single' }],
    upgraded: true,
  },
  'crystal_wall+': {
    id: 'crystal_wall+', name: 'Crystal Wall+',
    description: '32 방어.',
    type: 'skill', cost: 2, exhaust: true,
    effects: [{ type: 'block', value: 32 }],
    upgraded: true,
  },
  'arcane_missile+': {
    id: 'arcane_missile+', name: 'Arcane Missile+',
    description: '4 데미지를 3회.',
    type: 'attack', cost: 1,
    effects: [
      { type: 'damage', value: 4, target: 'single' },
      { type: 'damage', value: 4, target: 'single' },
      { type: 'damage', value: 4, target: 'single' },
    ],
    upgraded: true,
  },
  'elemental_orb+': {
    id: 'elemental_orb+', name: 'Elemental Orb+',
    description: '힘 4 증가.',
    type: 'power', cost: 2,
    effects: [{ type: 'gain_strength', value: 4 }],
    upgraded: true,
  },
  'rune_spear+': {
    id: 'rune_spear+', name: 'Rune Spear+',
    description: '17 데미지. 카드 1장 드로우.',
    type: 'attack', cost: 2,
    effects: [{ type: 'damage', value: 17, target: 'single' }, { type: 'draw', value: 1 }],
    upgraded: true,
  },
  'blink_step+': {
    id: 'blink_step+', name: 'Blink Step+',
    description: '10 방어. 에너지 1 획득. 카드 1장 드로우.',
    type: 'skill', cost: 1,
    effects: [{ type: 'block', value: 10 }, { type: 'gain_energy', value: 1 }, { type: 'draw', value: 1 }],
    upgraded: true,
  },
  'meteor+': {
    id: 'meteor+', name: 'Meteor+',
    description: '40 데미지.',
    type: 'attack', cost: 3, exhaust: true,
    effects: [{ type: 'damage', value: 40, target: 'single' }],
    upgraded: true,
  },
  'overcharge+': {
    id: 'overcharge+', name: 'Overcharge+',
    description: 'HP 3 소모. 에너지 3. 카드 1장 드로우.',
    type: 'skill', cost: 0,
    effects: [
      { type: 'self_damage', value: 3 },
      { type: 'gain_energy', value: 3 },
      { type: 'draw', value: 1 },
    ],
    upgraded: true,
  },
  'prism_beam+': {
    id: 'prism_beam+', name: 'Prism Beam+',
    description: '모든 적에게 14 데미지.',
    type: 'attack', cost: 2,
    effects: [{ type: 'damage', value: 14, target: 'all' }],
    upgraded: true,
  },
  'mind_shock+': {
    id: 'mind_shock+', name: 'Mind Shock+',
    description: '10 데미지. 약화 2턴 부여.',
    type: 'attack', cost: 1,
    effects: [
      { type: 'damage', value: 10, target: 'single' },
      { type: 'apply_status', value: 2, target: 'single', statusType: 'weak' },
    ],
    upgraded: true,
  },
  'rune_barrier+': {
    id: 'rune_barrier+', name: 'Rune Barrier+',
    description: '14 방어.',
    type: 'skill', cost: 1,
    effects: [{ type: 'block', value: 14 }],
    upgraded: true,
  },
  'void_pulse+': {
    id: 'void_pulse+', name: 'Void Pulse+',
    description: '21 데미지. HP 3 소모.',
    type: 'attack', cost: 2,
    effects: [
      { type: 'damage', value: 21, target: 'single' },
      { type: 'self_damage', value: 3 },
    ],
    upgraded: true,
  },
  'starfall+': {
    id: 'starfall+', name: 'Starfall+',
    description: '모든 적에게 28 데미지.',
    type: 'attack', cost: 3, exhaust: true,
    effects: [{ type: 'damage', value: 28, target: 'all' }],
    upgraded: true,
  },
  'mana_leech+': {
    id: 'mana_leech+', name: 'Mana Leech+',
    description: '10 데미지. 에너지 1 획득. 카드 1장 드로우.',
    type: 'attack', cost: 1,
    effects: [{ type: 'damage', value: 10, target: 'single' }, { type: 'gain_energy', value: 1 }, { type: 'draw', value: 1 }],
    upgraded: true,
  },
  'spell_echo+': {
    id: 'spell_echo+', name: 'Spell Echo+',
    description: '7 방어. 카드 3장 드로우.',
    type: 'skill', cost: 1,
    effects: [{ type: 'block', value: 7 }, { type: 'draw', value: 3 }],
    upgraded: true,
  },
  'ignition+': {
    id: 'ignition+', name: 'Ignition+',
    description: '13 데미지. 취약 2턴 부여.',
    type: 'attack', cost: 1,
    effects: [
      { type: 'damage', value: 13, target: 'single' },
      { type: 'apply_status', value: 2, target: 'single', statusType: 'vulnerable' },
    ],
    upgraded: true,
  },
  'glacial_spike+': {
    id: 'glacial_spike+', name: 'Glacial Spike+',
    description: '11 데미지. 약화 2턴 부여.',
    type: 'attack', cost: 1,
    effects: [
      { type: 'damage', value: 11, target: 'single' },
      { type: 'apply_status', value: 2, target: 'single', statusType: 'weak' },
    ],
    upgraded: true,
  },
  'storm_orb+': {
    id: 'storm_orb+', name: 'Storm Orb+',
    description: '7 데미지를 3회.',
    type: 'attack', cost: 2,
    effects: [
      { type: 'damage', value: 7, target: 'single' },
      { type: 'damage', value: 7, target: 'single' },
      { type: 'damage', value: 7, target: 'single' },
    ],
    upgraded: true,
  },
  // 직업별 회복 카드
  battle_recovery: {
    id: 'battle_recovery', name: 'Battle Recovery',
    description: 'HP 6 회복. 4 방어.',
    type: 'skill', cost: 1,
    effects: [{ type: 'heal', value: 6 }, { type: 'block', value: 4 }],
    upgradeId: 'battle_recovery+',
  },
  'battle_recovery+': {
    id: 'battle_recovery+', name: 'Battle Recovery+',
    description: 'HP 9 회복. 6 방어.',
    type: 'skill', cost: 1,
    effects: [{ type: 'heal', value: 9 }, { type: 'block', value: 6 }],
    upgraded: true,
  },
  herbal_remedy: {
    id: 'herbal_remedy', name: 'Herbal Remedy',
    description: 'HP 5 회복. 카드 1장 드로우.',
    type: 'skill', cost: 1,
    effects: [{ type: 'heal', value: 5 }, { type: 'draw', value: 1 }],
    upgradeId: 'herbal_remedy+',
  },
  'herbal_remedy+': {
    id: 'herbal_remedy+', name: 'Herbal Remedy+',
    description: 'HP 8 회복. 카드 1장 드로우.',
    type: 'skill', cost: 1,
    effects: [{ type: 'heal', value: 8 }, { type: 'draw', value: 1 }],
    upgraded: true,
  },
  mana_barrier: {
    id: 'mana_barrier', name: 'Mana Barrier',
    description: 'HP 4 회복. 7 방어.',
    type: 'skill', cost: 1,
    effects: [{ type: 'heal', value: 4 }, { type: 'block', value: 7 }],
    upgradeId: 'mana_barrier+',
  },
  'mana_barrier+': {
    id: 'mana_barrier+', name: 'Mana Barrier+',
    description: 'HP 6 회복. 10 방어.',
    type: 'skill', cost: 1,
    effects: [{ type: 'heal', value: 6 }, { type: 'block', value: 10 }],
    upgraded: true,
  },
  // 암살자 카드
  shadow_strike: {
    id: 'shadow_strike', name: 'Shadow Strike',
    description: '6 데미지.',
    type: 'attack', cost: 1,
    effects: [{ type: 'damage', value: 6, target: 'single' }],
    upgradeId: 'shadow_strike+',
  },
  'shadow_strike+': {
    id: 'shadow_strike+', name: 'Shadow Strike+',
    description: '9 데미지.',
    type: 'attack', cost: 1,
    effects: [{ type: 'damage', value: 9, target: 'single' }],
    upgraded: true,
  },
  evasive_step: {
    id: 'evasive_step', name: 'Evasive Step',
    description: '5 방어.',
    type: 'skill', cost: 1,
    effects: [{ type: 'block', value: 5 }],
    upgradeId: 'evasive_step+',
  },
  'evasive_step+': {
    id: 'evasive_step+', name: 'Evasive Step+',
    description: '8 방어.',
    type: 'skill', cost: 1,
    effects: [{ type: 'block', value: 8 }],
    upgraded: true,
  },
  blood_drain: {
    id: 'blood_drain', name: 'Blood Drain',
    description: '8 데미지. HP 4 회복.',
    type: 'attack', cost: 2,
    effects: [{ type: 'damage', value: 8, target: 'single' }, { type: 'heal', value: 4 }],
    upgradeId: 'blood_drain+',
  },
  'blood_drain+': {
    id: 'blood_drain+', name: 'Blood Drain+',
    description: '11 데미지. HP 6 회복.',
    type: 'attack', cost: 2,
    effects: [{ type: 'damage', value: 11, target: 'single' }, { type: 'heal', value: 6 }],
    upgraded: true,
  },
  poison_sting: {
    id: 'poison_sting', name: 'Poison Sting',
    description: '7 데미지. 약화 1턴 부여.',
    type: 'attack', cost: 1,
    effects: [
      { type: 'damage', value: 7, target: 'single' },
      { type: 'apply_status', value: 1, target: 'single', statusType: 'weak' },
    ],
    upgradeId: 'poison_sting+',
  },
  'poison_sting+': {
    id: 'poison_sting+', name: 'Poison Sting+',
    description: '10 데미지. 약화 2턴 부여.',
    type: 'attack', cost: 1,
    effects: [
      { type: 'damage', value: 10, target: 'single' },
      { type: 'apply_status', value: 2, target: 'single', statusType: 'weak' },
    ],
    upgraded: true,
  },
  smoke_veil: {
    id: 'smoke_veil', name: 'Smoke Veil',
    description: '8 방어. 카드 1장 드로우.',
    type: 'skill', cost: 1,
    effects: [{ type: 'block', value: 8 }, { type: 'draw', value: 1 }],
    upgradeId: 'smoke_veil+',
  },
  'smoke_veil+': {
    id: 'smoke_veil+', name: 'Smoke Veil+',
    description: '11 방어. 카드 1장 드로우.',
    type: 'skill', cost: 1,
    effects: [{ type: 'block', value: 11 }, { type: 'draw', value: 1 }],
    upgraded: true,
  },
  rupture_slash: {
    id: 'rupture_slash', name: 'Rupture Slash',
    description: '14 데미지. HP 5 회복.',
    type: 'attack', cost: 2,
    effects: [{ type: 'damage', value: 14, target: 'single' }, { type: 'heal', value: 5 }],
    upgradeId: 'rupture_slash+',
  },
  'rupture_slash+': {
    id: 'rupture_slash+', name: 'Rupture Slash+',
    description: '18 데미지. HP 7 회복.',
    type: 'attack', cost: 2,
    effects: [{ type: 'damage', value: 18, target: 'single' }, { type: 'heal', value: 7 }],
    upgraded: true,
  },
  night_hunt: {
    id: 'night_hunt', name: 'Night Hunt',
    description: '힘 2 증가.',
    type: 'power', cost: 1,
    effects: [{ type: 'gain_strength', value: 2 }],
    upgradeId: 'night_hunt+',
  },
  'night_hunt+': {
    id: 'night_hunt+', name: 'Night Hunt+',
    description: '힘 3 증가.',
    type: 'power', cost: 1,
    effects: [{ type: 'gain_strength', value: 3 }],
    upgraded: true,
  },
  shadow_dance: {
    id: 'shadow_dance', name: 'Shadow Dance',
    description: '카드 2장 드로우. 에너지 1 획득.',
    type: 'skill', cost: 0,
    effects: [{ type: 'draw', value: 2 }, { type: 'gain_energy', value: 1 }],
    upgradeId: 'shadow_dance+',
  },
  'shadow_dance+': {
    id: 'shadow_dance+', name: 'Shadow Dance+',
    description: '카드 3장 드로우. 에너지 1 획득.',
    type: 'skill', cost: 0,
    effects: [{ type: 'draw', value: 3 }, { type: 'gain_energy', value: 1 }],
    upgraded: true,
  },
  fatal_chain: {
    id: 'fatal_chain', name: 'Fatal Chain',
    description: '4 데미지를 3회.',
    type: 'attack', cost: 1,
    effects: [
      { type: 'damage', value: 4, target: 'single' },
      { type: 'damage', value: 4, target: 'single' },
      { type: 'damage', value: 4, target: 'single' },
    ],
    upgradeId: 'fatal_chain+',
  },
  'fatal_chain+': {
    id: 'fatal_chain+', name: 'Fatal Chain+',
    description: '5 데미지를 3회.',
    type: 'attack', cost: 1,
    effects: [
      { type: 'damage', value: 5, target: 'single' },
      { type: 'damage', value: 5, target: 'single' },
      { type: 'damage', value: 5, target: 'single' },
    ],
    upgraded: true,
  },
  execution_blade: {
    id: 'execution_blade', name: 'Execution Blade',
    description: '28 데미지.',
    type: 'attack', cost: 3, exhaust: true,
    effects: [{ type: 'damage', value: 28, target: 'single' }],
    upgradeId: 'execution_blade+',
  },
  'execution_blade+': {
    id: 'execution_blade+', name: 'Execution Blade+',
    description: '36 데미지.',
    type: 'attack', cost: 3, exhaust: true,
    effects: [{ type: 'damage', value: 36, target: 'single' }],
    upgraded: true,
  },
  siphon_strike: {
    id: 'siphon_strike', name: 'Siphon Strike',
    description: '7 데미지. HP 3 회복. 카드 1장 드로우.',
    type: 'attack', cost: 1,
    effects: [{ type: 'damage', value: 7, target: 'single' }, { type: 'heal', value: 3 }, { type: 'draw', value: 1 }],
    upgradeId: 'siphon_strike+',
  },
  'siphon_strike+': {
    id: 'siphon_strike+', name: 'Siphon Strike+',
    description: '9 데미지. HP 4 회복. 카드 1장 드로우.',
    type: 'attack', cost: 1,
    effects: [{ type: 'damage', value: 9, target: 'single' }, { type: 'heal', value: 4 }, { type: 'draw', value: 1 }],
    upgraded: true,
  },
  crimson_ritual: {
    id: 'crimson_ritual', name: 'Crimson Ritual',
    description: 'HP 3 소모. HP 10 회복.',
    type: 'skill', cost: 0, exhaust: true,
    effects: [{ type: 'self_damage', value: 3 }, { type: 'heal', value: 10 }],
    upgradeId: 'crimson_ritual+',
  },
  'crimson_ritual+': {
    id: 'crimson_ritual+', name: 'Crimson Ritual+',
    description: 'HP 2 소모. HP 13 회복.',
    type: 'skill', cost: 0, exhaust: true,
    effects: [{ type: 'self_damage', value: 2 }, { type: 'heal', value: 13 }],
    upgraded: true,
  },
  // #endregion
};

// #region 클래스별 시작 덱
/** 전사 시작 덱 */
export const STARTER_DECK: readonly string[] = [
  'strike', 'strike', 'strike', 'strike', 'strike',
  'defend', 'defend', 'defend', 'defend',
  'bash',
];

const ARCHER_STARTER_DECK: readonly string[] = [
  'quick_shot', 'quick_shot', 'quick_shot', 'quick_shot', 'quick_shot',
  'dodge', 'dodge', 'dodge', 'dodge',
  'aimed_shot',
];

const MAGE_STARTER_DECK: readonly string[] = [
  'magic_bolt', 'magic_bolt', 'magic_bolt', 'magic_bolt', 'magic_bolt',
  'arcane_barrier', 'arcane_barrier', 'arcane_barrier', 'arcane_barrier',
  'mana_blast',
];

const ASSASSIN_STARTER_DECK: readonly string[] = [
  'shadow_strike', 'shadow_strike', 'shadow_strike', 'shadow_strike', 'shadow_strike',
  'evasive_step', 'evasive_step', 'evasive_step', 'evasive_step',
  'blood_drain',
];

/** 직업별 시작 덱 반환 */
export function getStarterDeck(characterClass: CharacterClass): readonly string[] {
  if (characterClass === 'archer') return ARCHER_STARTER_DECK;
  if (characterClass === 'mage') return MAGE_STARTER_DECK;
  if (characterClass === 'assassin') return ASSASSIN_STARTER_DECK;
  return STARTER_DECK;
}
// #endregion

// #region 클래스별 보상 풀
const WARRIOR_REWARD_POOL: readonly string[] = [
  'shrug_it_off', 'pommel_strike', 'twin_strike',
  'iron_wave', 'clothesline', 'true_grit', 'battle_trance',
  'carnage', 'heavy_blade', 'bloodletting',
  'inflame', 'bludgeon', 'uppercut', 'anger',
  'impervious', 'offering', 'sword_boomerang', 'battle_recovery',
];

const ARCHER_REWARD_POOL: readonly string[] = [
  'piercing_arrow', 'evasion', 'multishot',
  'deadly_aim', 'poison_arrow', 'arrow_barrage',
  'preparation', 'smoke_bomb', 'headshot', 'herbal_remedy',
];

const MAGE_REWARD_POOL: readonly string[] = [
  'ember_lance', 'frost_shield', 'lightning_chain',
  'arcane_intellect', 'mana_surge', 'flame_wave',
  'frost_nova', 'thunder_mark', 'spell_focus',
  'mana_burst', 'crystal_wall', 'arcane_missile',
  'elemental_orb', 'rune_spear', 'blink_step',
  'meteor', 'overcharge', 'prism_beam',
  'mind_shock', 'rune_barrier', 'void_pulse',
  'starfall', 'mana_leech', 'spell_echo',
  'ignition', 'glacial_spike', 'storm_orb', 'mana_barrier',
];

const ASSASSIN_REWARD_POOL: readonly string[] = [
  'poison_sting', 'smoke_veil', 'rupture_slash',
  'night_hunt', 'shadow_dance', 'fatal_chain',
  'execution_blade', 'siphon_strike', 'crimson_ritual',
];

/** 직업별 보상 카드 랜덤 선택 (중복 없이) */
export function getRewardCards(count = 3, characterClass: CharacterClass = 'warrior'): string[] {
  const poolMap: Record<CharacterClass, readonly string[]> = {
    warrior: WARRIOR_REWARD_POOL,
    archer: ARCHER_REWARD_POOL,
    mage: MAGE_REWARD_POOL,
    assassin: ASSASSIN_REWARD_POOL,
  };
  const pool = [...poolMap[characterClass]];
  const result: string[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}
// #endregion

/** 업그레이드 가능한 카드인지 확인 */
export function canUpgrade(cardId: string): boolean {
  const def = CARD_DEFINITIONS[cardId];
  return !!def?.upgradeId;
}

/** 카드 ID → 업그레이드 ID 반환 (불가능하면 원본 반환) */
export function getUpgradedId(cardId: string): string {
  const def = CARD_DEFINITIONS[cardId];
  return def?.upgradeId ?? cardId;
}




