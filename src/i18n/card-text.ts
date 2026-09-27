// 카드/적 이름 번역 + 효과 기반 설명 자동 생성

import type { CardDefinition, CardEffect, CardRarity } from '@tower-of-cardborn/game-core/types/card';
import type { Enemy, StatusEffect } from '@tower-of-cardborn/game-core/types/character';
import { calculateDamage } from '@tower-of-cardborn/game-core/game/combat-engine';
import type { TFunction } from './index';
import type { Language } from './types';

// #region 카드 이름 번역 맵 (기본 카드만, 업그레이드는 자동 처리)
const CARD_NAMES: Record<string, Record<Language, string>> = {
  // 전사
  strike: { ko: '강타', en: 'Strike', zh: '打击' },
  defend: { ko: '수비', en: 'Defend', zh: '防御' },
  bash: { ko: '방패 강타', en: 'Bash', zh: '猛击' },
  cleave: { ko: '쪼개기', en: 'Cleave', zh: '劈砍' },
  shrug_it_off: { ko: '털어내기', en: 'Shrug It Off', zh: '耸肩' },
  pommel_strike: { ko: '칼자루 강타', en: 'Pommel Strike', zh: '剑柄打击' },
  twin_strike: { ko: '쌍검술', en: 'Twin Strike', zh: '双重打击' },
  iron_wave: { ko: '철의 파도', en: 'Iron Wave', zh: '铁浪' },
  uppercut: { ko: '어퍼컷', en: 'Uppercut', zh: '上勾拳' },
  impervious: { ko: '난공불락', en: 'Impervious', zh: '坚不可摧' },
  battle_trance: { ko: '전투 무아지경', en: 'Battle Trance', zh: '战斗恍惚' },
  heavy_blade: { ko: '중검', en: 'Heavy Blade', zh: '重剑' },
  offering: { ko: '제물', en: 'Offering', zh: '献祭' },
  inflame: { ko: '점화', en: 'Inflame', zh: '激怒' },
  execution_blade: { ko: '처형의 검', en: 'Execution Blade', zh: '处刑之刃' },
  carnage: { ko: '대학살', en: 'Carnage', zh: '屠杀' },
  clothesline: { ko: '빨랫줄', en: 'Clothesline', zh: '飞身扑打' },
  bludgeon: { ko: '곤봉', en: 'Bludgeon', zh: '棍击' },
  true_grit: { ko: '진정한 용기', en: 'True Grit', zh: '真正勇气' },
  bloodletting: { ko: '방혈', en: 'Bloodletting', zh: '放血' },
  sword_boomerang: { ko: '검 부메랑', en: 'Sword Boomerang', zh: '剑回旋镖' },
  anger: { ko: '분노', en: 'Anger', zh: '愤怒' },

  // 궁수
  quick_shot: { ko: '속사', en: 'Quick Shot', zh: '速射' },
  dodge: { ko: '회피', en: 'Dodge', zh: '闪避' },
  aimed_shot: { ko: '조준 사격', en: 'Aimed Shot', zh: '瞄准射击' },
  multishot: { ko: '다중 사격', en: 'Multishot', zh: '多重射击' },
  headshot: { ko: '헤드샷', en: 'Headshot', zh: '爆头' },
  evasion: { ko: '회피술', en: 'Evasion', zh: '闪避术' },
  arrow_barrage: { ko: '화살 폭격', en: 'Arrow Barrage', zh: '箭雨' },
  deadly_aim: { ko: '치명적 조준', en: 'Deadly Aim', zh: '致命瞄准' },
  poison_arrow: { ko: '독화살', en: 'Poison Arrow', zh: '毒箭' },
  rain_of_arrows: { ko: '화살비', en: 'Rain of Arrows', zh: '箭雨倾盆' },
  preparation: { ko: '준비', en: 'Preparation', zh: '准备' },
  piercing_arrow: { ko: '관통 화살', en: 'Piercing Arrow', zh: '穿刺箭' },
  smoke_bomb: { ko: '연막탄', en: 'Smoke Bomb', zh: '烟雾弹' },
  rupture_slash: { ko: '파열참', en: 'Rupture Slash', zh: '裂伤斩' },
  night_hunt: { ko: '야간 사냥', en: 'Night Hunt', zh: '夜猎' },
  fatal_chain: { ko: '치명 연쇄', en: 'Fatal Chain', zh: '致命连锁' },
  poison_sting: { ko: '독침', en: 'Poison Sting', zh: '毒刺' },
  evasive_step: { ko: '회피 스텝', en: 'Evasive Step', zh: '闪避步' },
  shadow_dance: { ko: '그림자 춤', en: 'Shadow Dance', zh: '暗影之舞' },
  shadow_strike: { ko: '그림자 일격', en: 'Shadow Strike', zh: '暗影打击' },
  smoke_veil: { ko: '연막 장막', en: 'Smoke Veil', zh: '烟幕' },

  // 마법사
  magic_bolt: { ko: '마법 화살', en: 'Magic Bolt', zh: '魔法弹' },
  arcane_barrier: { ko: '비전 장벽', en: 'Arcane Barrier', zh: '奥术屏障' },
  mana_blast: { ko: '마나 폭발', en: 'Mana Blast', zh: '法力爆破' },
  arcane_missile: { ko: '비전 미사일', en: 'Arcane Missile', zh: '奥术飞弹' },
  frost_nova: { ko: '서리 회오리', en: 'Frost Nova', zh: '霜之新星' },
  mana_surge: { ko: '마나 쇄도', en: 'Mana Surge', zh: '法力涌动' },
  spell_echo: { ko: '주문 반향', en: 'Spell Echo', zh: '法术回响' },
  spell_focus: { ko: '주문 집중', en: 'Spell Focus', zh: '法术专注' },
  mind_shock: { ko: '정신 충격', en: 'Mind Shock', zh: '精神冲击' },
  starfall: { ko: '별똥별', en: 'Starfall', zh: '星落' },
  crystal_wall: { ko: '수정 벽', en: 'Crystal Wall', zh: '水晶墙' },
  elemental_orb: { ko: '원소 구체', en: 'Elemental Orb', zh: '元素球' },
  overcharge: { ko: '과충전', en: 'Overcharge', zh: '过载' },
  rune_spear: { ko: '룬 창', en: 'Rune Spear', zh: '符文矛' },
  mana_barrier: { ko: '마나 장벽', en: 'Mana Barrier', zh: '法力屏障' },
  prism_beam: { ko: '프리즘 광선', en: 'Prism Beam', zh: '棱镜光束' },
  flame_wave: { ko: '화염의 파도', en: 'Flame Wave', zh: '火焰波' },
  ember_lance: { ko: '잔화의 창', en: 'Ember Lance', zh: '余烬之矛' },
  frost_shield: { ko: '서리 방패', en: 'Frost Shield', zh: '霜之盾' },
  glacial_spike: { ko: '빙하 쐐기', en: 'Glacial Spike', zh: '冰川尖刺' },
  lightning_chain: { ko: '연쇄 번개', en: 'Lightning Chain', zh: '闪电链' },
  storm_orb: { ko: '폭풍 구체', en: 'Storm Orb', zh: '风暴球' },
  rune_barrier: { ko: '룬 장벽', en: 'Rune Barrier', zh: '符文屏障' },
  ignition: { ko: '발화', en: 'Ignition', zh: '点燃' },
  mana_leech: { ko: '마나 흡수', en: 'Mana Leech', zh: '法力吸取' },
  arcane_intellect: { ko: '비전 지능', en: 'Arcane Intellect', zh: '奥术智慧' },
  meteor: { ko: '메테오', en: 'Meteor', zh: '流星' },
  crimson_ritual: { ko: '진홍 의식', en: 'Crimson Ritual', zh: '绯红仪式' },
  void_pulse: { ko: '공허 파동', en: 'Void Pulse', zh: '虚空脉冲' },
  thunder_mark: { ko: '천둥 인장', en: 'Thunder Mark', zh: '雷印' },
  mana_burst: { ko: '마나 작렬', en: 'Mana Burst', zh: '法力迸发' },

  // 암살자
  siphon_strike: { ko: '흡혈 타격', en: 'Siphon Strike', zh: '虹吸打击' },
  blood_drain: { ko: '흡혈', en: 'Blood Drain', zh: '吸血' },
  herbal_remedy: { ko: '약초 치료', en: 'Herbal Remedy', zh: '草药疗法' },
  battle_recovery: { ko: '전투 회복', en: 'Battle Recovery', zh: '战斗恢复' },
  blink_step: { ko: '순간이동', en: 'Blink Step', zh: '闪现步' },

  // 확장 카드 - 전사
  whirlwind: { ko: '회오리 베기', en: 'Whirlwind', zh: '旋风斩' },
  metal_skin: { ko: '강철 피부', en: 'Metal Skin', zh: '钢铁之肤' },
  demon_form: { ko: '악마의 형상', en: 'Demon Form', zh: '恶魔形态' },

  // 확장 카드 - 궁수
  crippling_shot: { ko: '마비 사격', en: 'Crippling Shot', zh: '致残射击' },
  hunters_mark: { ko: '사냥꾼의 표식', en: "Hunter's Mark", zh: '猎人印记' },
  double_tap: { ko: '연발 사격', en: 'Double Tap', zh: '两连射' },
  eagle_eye: { ko: '매의 눈', en: 'Eagle Eye', zh: '鹰眼' },
  swift_quiver: { ko: '신속한 화살통', en: 'Swift Quiver', zh: '迅捷箭袋' },
  barbed_arrow: { ko: '가시 화살', en: 'Barbed Arrow', zh: '倒刺箭' },
  wind_step: { ko: '바람 걸음', en: 'Wind Step', zh: '风之步' },
  volley: { ko: '일제 사격', en: 'Volley', zh: '齐射' },
  longshot: { ko: '원거리 저격', en: 'Longshot', zh: '远射' },

  // 저주 카드
  curse_wound: { ko: '상처', en: 'Wound', zh: '伤口' },
  curse_burden: { ko: '무거운 짐', en: 'Burden', zh: '重负' },

  // 확장 카드 - 암살자
  deadly_poison: { ko: '맹독', en: 'Deadly Poison', zh: '剧毒' },
  venom_fang: { ko: '독니', en: 'Venom Fang', zh: '毒牙' },
  toxic_cloud: { ko: '독무', en: 'Toxic Cloud', zh: '毒雾' },
  blade_flurry: { ko: '칼날 난무', en: 'Blade Flurry', zh: '刀刃乱舞' },
  backstab: { ko: '기습', en: 'Backstab', zh: '背刺' },
  cloak_of_shadows: { ko: '그림자 망토', en: 'Cloak of Shadows', zh: '暗影斗篷' },
  creeping_death: { ko: '잠식하는 죽음', en: 'Creeping Death', zh: '蔓延之死' },
  silent_kill: { ko: '소리 없는 처형', en: 'Silent Kill', zh: '无声击杀' },
  adrenaline: { ko: '아드레날린', en: 'Adrenaline', zh: '肾上腺素' },
  nimble_step: { ko: '민첩한 몸놀림', en: 'Nimble Step', zh: '灵巧身法' },
};

// #region 적 이름 번역 맵
const ENEMY_NAMES: Record<string, Record<Language, string>> = {
  jaw_worm: { ko: '턱 벌레', en: 'Jaw Worm', zh: '颚虫' },
  cultist: { ko: '광신도', en: 'Cultist', zh: '狂信徒' },
  louse_red: { ko: '붉은 이', en: 'Red Louse', zh: '红虱' },
  fungi_beast: { ko: '균류 야수', en: 'Fungi Beast', zh: '菌兽' },
  stone_sentinel: { ko: '석상 파수꾼', en: 'Stone Sentinel', zh: '石像哨兵' },
  void_wisp: { ko: '공허의 위습', en: 'Void Wisp', zh: '虚空幽火' },
  gremlin_nob: { ko: '그렘린 귀족', en: 'Gremlin Nob', zh: '地精贵族' },
  lagavulin: { ko: '라가불린', en: 'Lagavulin', zh: '拉格弗林' },
  arcane_golem: { ko: '비전 골렘', en: 'Arcane Golem', zh: '奥术魔像' },
  void_reaper: { ko: '공허의 수확자', en: 'Void Reaper', zh: '虚空收割者' },
  slime_boss: { ko: '슬라임 보스', en: 'Slime Boss', zh: '史莱姆Boss' },
  stone_guardian: { ko: '석상 수호자', en: 'Stone Guardian', zh: '石像守卫' },
  tower_heart: { ko: '탑의 심장', en: 'Tower Heart', zh: '高塔之心' },
  crystal_crawler: { ko: '수정 크롤러', en: 'Crystal Crawler', zh: '水晶爬虫' },
  temple_acolyte: { ko: '신전 수행자', en: 'Temple Acolyte', zh: '神殿侍僧' },
  void_husk: { ko: '공허 허물', en: 'Void Husk', zh: '虚空躯壳' },
  abyss_watcher: { ko: '심연의 감시자', en: 'Abyss Watcher', zh: '深渊注视者' },
  obsidian_knight: { ko: '흑요석 기사', en: 'Obsidian Knight', zh: '黑曜石骑士' },
  plague_herald: { ko: '역병 전령', en: 'Plague Herald', zh: '瘟疫使者' },
  gremlin_king: { ko: '그렘린 왕', en: 'Gremlin King', zh: '地精之王' },
  crystal_hydra: { ko: '수정 히드라', en: 'Crystal Hydra', zh: '水晶九头蛇' },
};
// #endregion

/** 카드 이름 반환 (언어별, 업그레이드 카드는 '+' 자동 추가) */
export function getCardName(cardId: string, lang: Language): string {
  const isUpgraded = cardId.endsWith('+');
  const baseId = isUpgraded ? cardId.slice(0, -1) : cardId;
  const nameMap = CARD_NAMES[baseId];
  if (!nameMap) return cardId;
  const name = nameMap[lang];
  return isUpgraded ? `${name}+` : name;
}

/** 적 이름 반환 (언어별) */
export function getEnemyName(enemyDefId: string, lang: Language): string {
  return ENEMY_NAMES[enemyDefId]?.[lang] ?? enemyDefId;
}

/** 카드 타입 번역 키 매핑 */
const CARD_TYPE_KEY: Record<string, 'cardTypeAttack' | 'cardTypeSkill' | 'cardTypePower' | 'cardTypeCurse'> = {
  attack: 'cardTypeAttack',
  skill: 'cardTypeSkill',
  power: 'cardTypePower',
  curse: 'cardTypeCurse',
};

/** 카드 타입 번역 반환 */
export function getCardTypeName(type: string, t: TFunction): string {
  const key = CARD_TYPE_KEY[type];
  return key ? t(key) : type;
}

/** 카드 희귀도 번역 반환 */
export function getCardRarityName(rarity: CardRarity, t: TFunction): string {
  const keyMap = {
    starter: 'rarityStarter',
    common: 'rarityCommon',
    uncommon: 'rarityUncommon',
    rare: 'rarityRare',
  } as const;
  return t(keyMap[rarity]);
}

/** 카드 효과 배열에서 다국어 설명 자동 생성 */
export function generateCardDescription(def: CardDefinition, t: TFunction): string {
  if (def.unplayable) return t('cdUnplayable');
  const parts: string[] = [];
  const effects = def.effects;
  let i = 0;

  while (i < effects.length) {
    const effect = effects[i];
    const segment = describeEffect(effect, effects, i, t);
    if (segment.text && !parts.includes(segment.text)) {
      parts.push(segment.text);
    }
    i += segment.consumed;
  }

  return parts.join(' ');
}

interface EffectSegment {
  readonly text: string;
  readonly consumed: number;
}

/** 개별 효과 → 텍스트 변환 (연속 동일 데미지는 멀티히트 처리) */
function describeEffect(
  effect: CardEffect,
  allEffects: readonly CardEffect[],
  index: number,
  t: TFunction,
): EffectSegment {
  switch (effect.type) {
    case 'damage': {
      const hitCount = countConsecutiveSame(allEffects, index);
      if (hitCount > 1) {
        return { text: t('cdMultiHit', String(effect.value), String(hitCount)), consumed: hitCount };
      }
      if (effect.target === 'all') {
        return { text: t('cdDamageAll', String(effect.value)), consumed: 1 };
      }
      return { text: t('cdDamage', String(effect.value)), consumed: 1 };
    }
    case 'block':
      return { text: t('cdBlock', String(effect.value)), consumed: 1 };
    case 'draw':
      return { text: t('cdDraw', String(effect.value)), consumed: 1 };
    case 'apply_status':
      if (effect.statusType === 'vulnerable') return { text: t('cdVulnerable', String(effect.value)), consumed: 1 };
      if (effect.statusType === 'weak') {
        return { text: t(effect.target === 'all' ? 'cdWeakAll' : 'cdWeak', String(effect.value)), consumed: 1 };
      }
      if (effect.statusType === 'poison') {
        return { text: t(effect.target === 'all' ? 'cdPoisonAll' : 'cdPoison', String(effect.value)), consumed: 1 };
      }
      if (effect.statusType === 'frail') return { text: t('cdFrail', String(effect.value)), consumed: 1 };
      return { text: '', consumed: 1 };
    case 'gain_strength':
      return { text: t('cdStrength', String(effect.value)), consumed: 1 };
    case 'gain_dexterity':
      return { text: t('cdDexterity', String(effect.value)), consumed: 1 };
    case 'add_power':
      if (effect.powerType === 'turn_start_block') return { text: t('cdPowerBlock', String(effect.value)), consumed: 1 };
      if (effect.powerType === 'turn_start_strength') return { text: t('cdPowerStrength', String(effect.value)), consumed: 1 };
      if (effect.powerType === 'turn_start_draw') return { text: t('cdPowerDraw', String(effect.value)), consumed: 1 };
      return { text: '', consumed: 1 };
    case 'gain_energy':
      return { text: t('cdEnergy', String(effect.value)), consumed: 1 };
    case 'self_damage':
      return { text: t('cdSelfDamage', String(effect.value)), consumed: 1 };
    case 'heal':
      return { text: t('cdHeal', String(effect.value)), consumed: 1 };
    default:
      return { text: '', consumed: 1 };
  }
}

/** 같은 종류/값/타겟의 연속 데미지 효과 카운트 (멀티히트 감지) */
function countConsecutiveSame(effects: readonly CardEffect[], startIndex: number): number {
  const base = effects[startIndex];
  let count = 1;
  while (startIndex + count < effects.length) {
    const next = effects[startIndex + count];
    if (next.type !== base.type || next.value !== base.value || next.target !== base.target) break;
    count++;
  }
  return count;
}

// #region 데미지 프리뷰 (다국어)

/** 상태효과 활성 여부 확인 */
function hasActiveStatus(statusEffects: readonly StatusEffect[], type: StatusEffect['type']): boolean {
  return statusEffects.some((s) => s.type === type && s.duration > 0);
}

/** 상태효과 수치 추출 */
function getStatusAmount(statusEffects: readonly StatusEffect[], type: StatusEffect['type']): number {
  const status = statusEffects.find((s) => s.type === type);
  return status ? status.duration : 0;
}

/** 대상 적 결정 */
function resolveTargetEnemy(enemies: readonly Enemy[], targetEnemyId?: string): Enemy | null {
  if (enemies.length === 0) return null;
  if (!targetEnemyId) return enemies[0];
  return enemies.find((e) => e.id === targetEnemyId) ?? enemies[0];
}

/** 데미지 값 포맷 (프리뷰가 기본값과 다르면 `기본(프리뷰)` 형태) */
function formatDamageValue(base: number, preview: number): string {
  return preview === base ? String(base) : `${base}(${preview})`;
}

/** 데미지 프리뷰 포함 카드 설명 생성 (다국어) */
export function generatePreviewDescription(
  def: CardDefinition,
  t: TFunction,
  playerStatusEffects: readonly StatusEffect[],
  enemies: readonly Enemy[],
  targetEnemyId?: string,
): string {
  const damageEffects = def.effects.filter((e) => e.type === 'damage');
  if (damageEffects.length === 0) return generateCardDescription(def, t);

  const strength = getStatusAmount(playerStatusEffects, 'strength');
  const attackerWeak = hasActiveStatus(playerStatusEffects, 'weak');
  const targetEnemy = resolveTargetEnemy(enemies, targetEnemyId);

  const parts: string[] = [];
  const effects = def.effects;
  let i = 0;

  while (i < effects.length) {
    const effect = effects[i];
    if (effect.type === 'damage') {
      const targetVulnerable = targetEnemy ? hasActiveStatus(targetEnemy.statusEffects, 'vulnerable') : false;
      const preview = calculateDamage(effect.value, strength, attackerWeak, targetVulnerable);
      const dmg = formatDamageValue(effect.value, preview);
      const hitCount = countConsecutiveSame(effects, i);

      let text: string;
      if (hitCount > 1) {
        text = t('cdMultiHit', dmg, String(hitCount));
      } else if (effect.target === 'all') {
        text = t('cdDamageAll', dmg);
      } else {
        text = t('cdDamage', dmg);
      }
      if (!parts.includes(text)) parts.push(text);
      i += hitCount;
    } else {
      const segment = describeEffect(effect, effects, i, t);
      if (segment.text && !parts.includes(segment.text)) parts.push(segment.text);
      i += segment.consumed;
    }
  }

  return parts.join(' ');
}
// #endregion
