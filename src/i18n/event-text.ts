// 이벤트 제목/본문/선택지/결과 번역 ({N} 플레이스홀더 치환)

import type { Language } from './types';

const EVENT_TEXTS: Record<string, Record<Language, string>> = {
  // ── 피의 제단 ──
  'blood_altar.title': { ko: '피의 제단', en: 'Blood Altar', zh: '鲜血祭坛' },
  'blood_altar.body': {
    ko: '검붉은 제단이 심장처럼 고동친다. 피를 바치면 힘을 주겠다는 속삭임이 들린다.',
    en: 'A crimson altar pulses like a heartbeat. A whisper offers power in exchange for blood.',
    zh: '暗红色的祭坛如心脏般搏动。低语声承诺以鲜血换取力量。',
  },
  'blood_altar.c1': {
    ko: 'HP {0}을 바친다 (최대 HP +{1})',
    en: 'Offer {0} HP (Max HP +{1})',
    zh: '献出 {0} HP（最大HP +{1}）',
  },
  'blood_altar.c1.r': {
    ko: '제단이 피를 삼켰다. 몸 깊은 곳에서 새로운 힘이 차오른다. 최대 HP +{0}.',
    en: 'The altar drinks your blood. New strength wells up from deep within. Max HP +{0}.',
    zh: '祭坛饮下鲜血，体内深处涌起新的力量。最大HP +{0}。',
  },
  'blood_altar.c2': {
    ko: 'HP {0}을 바친다 (+{1} 골드)',
    en: 'Offer {0} HP (+{1} Gold)',
    zh: '献出 {0} HP（+{1} 金币）',
  },
  'blood_altar.c2.r': {
    ko: '떨어진 핏방울이 금화로 굳었다. +{0} 골드.',
    en: 'The fallen drops of blood harden into coins. +{0} Gold.',
    zh: '滴落的血珠凝成了金币。+{0} 金币。',
  },
  'blood_altar.c3': { ko: '떠난다', en: 'Leave', zh: '离开' },

  // ── 떠돌이 대장장이 ──
  'blacksmith.title': { ko: '떠돌이 대장장이', en: 'Wandering Blacksmith', zh: '流浪铁匠' },
  'blacksmith.body': {
    ko: '길가에 화로를 피운 대장장이가 손짓한다. "이봐, 그 카드 좀 벼려 줄까?"',
    en: 'A blacksmith tending a roadside forge waves you over. "Hey, want those cards tempered?"',
    zh: '路边生起炉火的铁匠向你招手："喂，要不要把那些卡牌淬炼一下？"',
  },
  'blacksmith.c1': {
    ko: '카드 1장을 강화한다 (무료)',
    en: 'Upgrade 1 card (free)',
    zh: '强化1张卡牌（免费）',
  },
  'blacksmith.c2': {
    ko: '{0} 골드로 카드 2장을 강화한다',
    en: 'Pay {0} Gold to upgrade 2 cards',
    zh: '支付 {0} 金币，强化2张卡牌',
  },
  'blacksmith.c3': { ko: '지나간다', en: 'Pass by', zh: '径直走过' },

  // ── 잠긴 보물상자 ──
  'locked_chest.title': { ko: '잠긴 보물상자', en: 'Locked Chest', zh: '上锁的宝箱' },
  'locked_chest.body': {
    ko: '녹슨 자물쇠가 채워진 상자가 놓여 있다. 흔들어 보니 안에서 금속이 부딪히는 소리가 난다.',
    en: 'A chest bound with a rusty lock sits before you. When you shake it, something metallic rattles inside.',
    zh: '一只挂着锈锁的箱子摆在面前。摇一摇，里面传出金属碰撞声。',
  },
  'locked_chest.c1': {
    ko: '힘으로 비틀어 연다 (HP -{0}, 골드 {1}~{2})',
    en: 'Wrench it open (HP -{0}, {1}~{2} Gold)',
    zh: '强行掰开（HP -{0}，金币 {1}~{2}）',
  },
  'locked_chest.c1.r': {
    ko: '손바닥이 찢어졌지만 상자가 열렸다. +{0} 골드.',
    en: 'Your palms are torn, but the chest gives way. +{0} Gold.',
    zh: '手掌被划破，但箱子终于打开了。金币 +{0}。',
  },
  'locked_chest.c2': {
    ko: '조심스럽게 자물쇠를 딴다 ({0}% 확률로 +{1} 골드)',
    en: 'Pick the lock carefully ({0}% chance of +{1} Gold)',
    zh: '小心撬锁（{0}% 概率获得 +{1} 金币）',
  },
  'locked_chest.c2.win': {
    ko: '자물쇠가 딸깍 열렸다! +{0} 골드.',
    en: 'The lock clicks open! +{0} Gold.',
    zh: '锁"咔哒"一声开了！金币 +{0}。',
  },
  'locked_chest.c2.lose': {
    ko: '자물쇠가 부러졌다. 상자는 끝내 열리지 않았다.',
    en: 'The lock snaps. The chest never opens.',
    zh: '锁芯断了。箱子终究没能打开。',
  },
  'locked_chest.c3': { ko: '두고 간다', en: 'Leave it', zh: '留在原地' },

  // ── 수상한 도박사 ──
  'gambler.title': { ko: '수상한 도박사', en: 'Shady Gambler', zh: '可疑的赌徒' },
  'gambler.body': {
    ko: '두건을 쓴 도박사가 컵 세 개를 늘어놓는다. "골드를 걸어 보겠나?"',
    en: 'A hooded gambler lays out three cups. "Care to wager some gold?"',
    zh: '兜帽赌徒摆出三只杯子："要不要赌一把金币？"',
  },
  'gambler.c1': {
    ko: '{0} 골드를 건다 ({1}% 확률로 +{2} 골드)',
    en: 'Bet {0} Gold ({1}% chance of +{2} Gold)',
    zh: '押 {0} 金币（{1}% 概率获得 +{2} 金币）',
  },
  'gambler.c2': {
    ko: '{0} 골드를 건다 ({1}% 확률로 +{2} 골드)',
    en: 'Bet {0} Gold ({1}% chance of +{2} Gold)',
    zh: '押 {0} 金币（{1}% 概率获得 +{2} 金币）',
  },
  'gambler.win': {
    ko: '이겼다! 도박사가 혀를 차며 {0} 골드를 내놓았다.',
    en: 'You won! The gambler clicks his tongue and hands over {0} Gold.',
    zh: '赢了！赌徒咂着舌递来 {0} 金币。',
  },
  'gambler.lose': {
    ko: '컵은 비어 있었다. 판돈만 날렸다...',
    en: 'The cup was empty. Your stake is gone...',
    zh: '杯子是空的。赌注打了水漂……',
  },
  'gambler.c3': { ko: '자리를 뜬다', en: 'Walk away', zh: '转身离开' },

  // ── 망각의 안개 ──
  'mist.title': { ko: '망각의 안개', en: 'Mist of Forgetting', zh: '遗忘之雾' },
  'mist.body': {
    ko: '차가운 안개가 기억을 어루만진다. 무엇이든 잊게 해 줄 것만 같다.',
    en: 'A cold mist brushes against your memories. It feels as if it could make you forget anything.',
    zh: '冰冷的雾气轻抚着记忆，仿佛能让你忘却一切。',
  },
  'mist.c1': {
    ko: '카드 1장을 잊는다 (HP +{0})',
    en: 'Forget 1 card (HP +{0})',
    zh: '遗忘1张卡牌（HP +{0}）',
  },
  'mist.c2': {
    ko: '안개 깊이 들어간다 (HP -{0}, 카드 {1}장 제거)',
    en: 'Walk deeper in (HP -{0}, remove {1} cards)',
    zh: '深入雾中（HP -{0}，移除 {1} 张卡牌）',
  },
  'mist.c3': { ko: '안개를 피해 간다', en: 'Skirt around the mist', zh: '绕开雾气' },

  // ── 쓰러진 용병 ──
  'wounded_mercenary.title': { ko: '쓰러진 용병', en: 'Fallen Mercenary', zh: '倒下的佣兵' },
  'wounded_mercenary.body': {
    ko: '벽에 기댄 용병이 거친 숨을 몰아쉰다. 곁에는 낡은 카드 가방이 놓여 있다.',
    en: 'A mercenary slumps against the wall, breathing hard. A worn card satchel lies at their side.',
    zh: '一名佣兵靠墙喘息，身旁放着一个破旧的卡牌行囊。',
  },
  'wounded_mercenary.c1': {
    ko: '상처를 치료해 준다 (HP -{0}, 무작위 카드 1장 획득)',
    en: 'Treat their wounds (HP -{0}, gain 1 random card)',
    zh: '为其疗伤（HP -{0}，获得1张随机卡牌）',
  },
  'wounded_mercenary.c1.r': {
    ko: '"은혜는 갚는다." 용병이 가방에서 카드 한 장을 건넸다. {0} 획득.',
    en: '"I pay my debts." The mercenary hands you a card from the satchel. You gained {0}.',
    zh: '"恩情必报。"佣兵从行囊中递出一张牌。获得 {0}。',
  },
  'wounded_mercenary.c2': {
    ko: '가방을 노린다 ({0}% 골드 +{1} / {2}% 반격 HP -{3})',
    en: 'Go for the satchel ({0}%: +{1} Gold / {2}%: counterattack, HP -{3})',
    zh: '抢夺行囊（{0}%：金币 +{1} / {2}%：遭反击 HP -{3}）',
  },
  'wounded_mercenary.c2.win': {
    ko: '용병은 저항할 힘조차 없었다. +{0} 골드.',
    en: 'They had no strength left to resist. +{0} Gold.',
    zh: '对方已无力反抗。金币 +{0}。',
  },
  'wounded_mercenary.c2.lose': {
    ko: '죽어가는 척이었다. 칼끝이 옆구리를 스쳤다. HP -{0}.',
    en: 'The dying act was a ruse. A blade grazes your side. HP -{0}.',
    zh: '垂死不过是伪装。刀锋擦过侧腹。HP -{0}。',
  },
  'wounded_mercenary.c3': { ko: '못 본 척 지나간다', en: 'Pass by as if you saw nothing', zh: '视而不见地走过' },

  // ── 풍화된 성소 ──
  'shrine.title': { ko: '풍화된 성소', en: 'Weathered Shrine', zh: '风化的圣所' },
  'shrine.body': {
    ko: '이끼 낀 여신상이 조용히 내려다본다. 발치에 낡은 헌금함이 놓여 있다.',
    en: 'A moss-covered goddess statue looks down in silence. An old offering box rests at her feet.',
    zh: '长满青苔的女神像静静俯视，脚边放着一只老旧的奉献箱。',
  },
  'shrine.c1': {
    ko: '{0} 골드를 바친다 (HP 전부 회복)',
    en: 'Offer {0} Gold (fully restore HP)',
    zh: '献上 {0} 金币（HP 全部恢复）',
  },
  'shrine.c1.r': {
    ko: '따뜻한 빛이 상처를 감쌌다. HP가 모두 회복됐다.',
    en: 'Warm light wraps around your wounds. HP fully restored.',
    zh: '温暖的光芒包裹伤口。HP已全部恢复。',
  },
  'shrine.c2': {
    ko: '조용히 기도한다 (HP +{0})',
    en: 'Pray quietly (HP +{0})',
    zh: '静静祈祷（HP +{0}）',
  },
  'shrine.c2.r': {
    ko: '여신상의 눈가에 희미한 미소가 스친 듯했다. HP +{0}.',
    en: "A faint smile seems to cross the goddess's face. HP +{0}.",
    zh: '女神像的眼角似乎掠过一丝微笑。HP +{0}。',
  },
  'shrine.c3': { ko: '지나간다', en: 'Pass by', zh: '径直走过' },
};

/** 이벤트 텍스트 조회 + {N} 치환 */
export function getEventText(key: string, lang: Language, ...args: readonly (string | number)[]): string {
  let text = EVENT_TEXTS[key]?.[lang] ?? key;
  for (let i = 0; i < args.length; i++) {
    text = text.replace(`{${i}}`, String(args[i]));
  }
  return text;
}
