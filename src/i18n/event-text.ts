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

  // ── 고대 도서관 ──
  'ancient_library.title': { ko: '고대 도서관', en: 'Ancient Library', zh: '古代图书馆' },
  'ancient_library.body': {
    ko: '먼지 쌓인 서가 사이에서 살아 움직이는 문장들이 속삭인다.',
    en: 'Living sentences whisper between rows of dust-covered shelves.',
    zh: '布满灰尘的书架之间，活着的文字低声呢喃。',
  },
  'ancient_library.c1': {
    ko: '금단의 책을 읽는다 (HP -{0}, 무작위 카드 획득)',
    en: 'Read the forbidden tome (HP -{0}, gain a random card)',
    zh: '阅读禁书（HP -{0}，获得随机卡牌）',
  },
  'ancient_library.c1.r': {
    ko: '지식이 살을 파고들었다. {0} 획득.',
    en: 'The knowledge cuts into your flesh. You gained {0}.',
    zh: '知识刺入血肉。获得 {0}。',
  },
  'ancient_library.c2': {
    ko: '사서에게 {0} 골드를 낸다 (카드 1장 강화)',
    en: 'Pay the librarian {0} Gold (upgrade 1 card)',
    zh: '向管理员支付 {0} 金币（升级1张卡牌）',
  },
  'ancient_library.c3': { ko: '책을 덮는다', en: 'Close the book', zh: '合上书本' },

  // ── 치유의 샘 ──
  'healing_fountain.title': { ko: '치유의 샘', en: 'Healing Fountain', zh: '治愈之泉' },
  'healing_fountain.body': {
    ko: '푸른 물결이 은은한 빛을 내며 상처와 욕망을 비춘다.',
    en: 'Blue water glows softly, reflecting both your wounds and your ambition.',
    zh: '泛着蓝光的泉水映照出你的伤口与欲望。',
  },
  'healing_fountain.c1': {
    ko: '물을 마신다 (HP +{0})',
    en: 'Drink the water (HP +{0})',
    zh: '饮用泉水（HP +{0}）',
  },
  'healing_fountain.c1.r': {
    ko: '차가운 기운이 상처를 감쌌다. HP +{0}.',
    en: 'A cool current wraps around your wounds. HP +{0}.',
    zh: '清凉的力量包裹伤口。HP +{0}。',
  },
  'healing_fountain.c2': {
    ko: '{0} 골드를 던진다 (최대 HP +{1})',
    en: 'Toss in {0} Gold (Max HP +{1})',
    zh: '投入 {0} 金币（最大HP +{1}）',
  },
  'healing_fountain.c2.r': {
    ko: '샘이 생명력을 되돌려 주었다. 최대 HP +{0}.',
    en: 'The fountain returns your offering as vitality. Max HP +{0}.',
    zh: '泉水将供奉化为生命力。最大HP +{0}。',
  },
  'healing_fountain.c3': { ko: '물을 건드리지 않는다', en: 'Leave the water untouched', zh: '不触碰泉水' },

  // ── 대상인의 행렬 ──
  'merchant_caravan.title': { ko: '대상인의 행렬', en: 'Merchant Caravan', zh: '商队' },
  'merchant_caravan.body': {
    ko: '탑 안에서는 볼 수 없을 것 같던 대상인들이 진귀한 물건을 펼쳐 보인다.',
    en: 'A caravan that should not exist inside the tower displays a collection of rare goods.',
    zh: '本不该出现在塔中的商队展示着各式珍奇货物。',
  },
  'merchant_caravan.c1': {
    ko: '{0} 골드로 봉인된 카드를 산다',
    en: 'Buy a sealed card for {0} Gold',
    zh: '花费 {0} 金币购买封印卡牌',
  },
  'merchant_caravan.c1.r': {
    ko: '봉인이 풀리며 {0}이 모습을 드러냈다.',
    en: 'The seal breaks, revealing {0}.',
    zh: '封印解除，显现出 {0}。',
  },
  'merchant_caravan.c2': {
    ko: '카드 1장을 팔아 {0} 골드를 받는다',
    en: 'Sell 1 card for {0} Gold',
    zh: '出售1张卡牌并获得 {0} 金币',
  },
  'merchant_caravan.c3': { ko: '행렬을 보내 준다', en: 'Let the caravan pass', zh: '让商队离开' },

  // ── 무너진 광산 ──
  'collapsed_mine.title': { ko: '무너진 광산', en: 'Collapsed Mine', zh: '坍塌的矿井' },
  'collapsed_mine.body': {
    ko: '무너진 갱도 틈으로 금빛이 반짝인다. 잔해를 파헤치면 무언가 나올 것 같다.',
    en: 'Gold glints through the rubble of a collapsed shaft. Digging might uncover something.',
    zh: '坍塌的矿道缝隙中闪着金光。挖开碎石似乎能找到什么。',
  },
  'collapsed_mine.c1': {
    ko: '맨손으로 파헤친다 (HP -{0}, 골드 {1}~{2})',
    en: 'Dig with bare hands (HP -{0}, {1}~{2} Gold)',
    zh: '徒手挖掘（HP -{0}，金币 {1}~{2}）',
  },
  'collapsed_mine.c1.r': {
    ko: '손끝이 짓무르도록 파낸 끝에 금맥 조각을 찾았다. +{0} 골드.',
    en: 'Your fingers are raw, but you pry loose a vein of gold. +{0} Gold.',
    zh: '指尖磨破，终于挖出了一块金矿。+{0} 金币。',
  },
  'collapsed_mine.c2': {
    ko: '조심스럽게 살핀다 ({0}% 확률로 +{1} 골드, 실패 시 HP -{2})',
    en: 'Search carefully ({0}% chance of +{1} Gold, or HP -{2})',
    zh: '小心搜寻（{0}% 概率 +{1} 金币，失败 HP -{2}）',
  },
  'collapsed_mine.c2.win': {
    ko: '무너지지 않은 수레에서 광석 자루를 발견했다! +{0} 골드.',
    en: 'You find an ore sack in an intact cart! +{0} Gold.',
    zh: '在完好的矿车里发现了一袋矿石！+{0} 金币。',
  },
  'collapsed_mine.c2.lose': {
    ko: '느슨한 바위가 굴러떨어졌다. HP -{0}.',
    en: 'A loose rock tumbles down onto you. HP -{0}.',
    zh: '松动的岩石滚落砸中了你。HP -{0}。',
  },
  'collapsed_mine.c3': { ko: '지나간다', en: 'Move on', zh: '继续前进' },

  // ── 방랑하는 현자 ──
  'wandering_sage.title': { ko: '방랑하는 현자', en: 'Wandering Sage', zh: '流浪贤者' },
  'wandering_sage.body': {
    ko: '지팡이를 짚은 노인이 미소 짓는다. "젊은 등반가여, 지혜를 나눠 줄까?"',
    en: 'An old sage leaning on a staff smiles. "Young climber, shall I share some wisdom?"',
    zh: '拄着法杖的老者微笑道："年轻的攀塔者，要不要听点智慧之言？"',
  },
  'wandering_sage.c1': {
    ko: '가르침을 듣는다 (무작위 카드 획득)',
    en: 'Listen to his teachings (gain a random card)',
    zh: '聆听教诲（获得随机卡牌）',
  },
  'wandering_sage.c1.r': {
    ko: '현자의 가르침이 기술로 남았다. {0} 카드를 얻었다.',
    en: "The sage's lesson takes form as a technique. Gained {0}.",
    zh: '贤者的教诲化为技艺。获得了 {0}。',
  },
  'wandering_sage.c2': {
    ko: '{0} 골드를 시주하고 카드 1장을 강화한다',
    en: 'Donate {0} Gold to upgrade 1 card',
    zh: '捐赠 {0} 金币，强化1张卡牌',
  },
  'wandering_sage.c3': { ko: '길을 재촉한다', en: 'Hurry along', zh: '赶路离开' },

  // ── 저주받은 우상 ──
  'cursed_idol.title': { ko: '저주받은 우상', en: 'Cursed Idol', zh: '被诅咒的神像' },
  'cursed_idol.body': {
    ko: '검은 돌로 깎인 우상이 낮게 웅웅거린다. 만지면 보물을, 어쩌면 저주를 줄 것이다.',
    en: 'An idol carved from black stone hums lowly. Touching it may grant treasure — or a curse.',
    zh: '黑石雕成的神像低声嗡鸣。触碰它可能得到宝物，也可能招来诅咒。',
  },
  'cursed_idol.c1': {
    ko: '우상에 손을 얹는다 ({0}% 확률로 유물, 실패 시 HP -{1}·저주 획득)',
    en: 'Touch the idol ({0}% chance of a relic, or HP -{1} and a Curse)',
    zh: '触碰神像（{0}% 概率获得遗物，失败 HP -{1}并获得诅咒）',
  },
  'cursed_idol.c1.win': {
    ko: '우상이 갈라지며 {0}을(를) 내놓았다.',
    en: 'The idol splits open, yielding {0}.',
    zh: '神像裂开，露出了 {0}。',
  },
  'cursed_idol.c1.lose': {
    ko: '검은 번개가 손을 타고 올라오며 {0} 저주가 덱에 스며들었다.',
    en: 'Black lightning surges up your arm, and the {0} curse seeps into your deck.',
    zh: '黑色闪电窜上手臂，{0}诅咒渗入了牌组。',
  },
  'cursed_idol.c2': {
    ko: '우상을 부순다 (+{0} 골드)',
    en: 'Smash the idol (+{0} Gold)',
    zh: '砸碎神像（+{0} 金币）',
  },
  'cursed_idol.c2.r': {
    ko: '부서진 돌 틈에서 금화가 쏟아졌다. +{0} 골드.',
    en: 'Coins spill from the shattered stone. +{0} Gold.',
    zh: '碎石中撒落出金币。+{0} 金币。',
  },
  'cursed_idol.c3': { ko: '눈을 돌리고 떠난다', en: 'Look away and leave', zh: '移开视线离开' },

  // ── 잊힌 무덤 ──
  'forgotten_grave.title': { ko: '잊힌 무덤', en: 'Forgotten Grave', zh: '被遗忘的坟墓' },
  'forgotten_grave.body': {
    ko: '이름이 지워진 비석 아래 흙이 봉긋하다. 무언가 묻혀 있는 것이 분명하다.',
    en: 'The earth bulges beneath a nameless headstone. Something is surely buried here.',
    zh: '无名墓碑下的泥土微微隆起。下面一定埋着什么。',
  },
  'forgotten_grave.c1': {
    ko: '무덤을 판다 ({0}% 확률로 +{1} 골드, 실패 시 HP -{2})',
    en: 'Dig up the grave ({0}% chance of +{1} Gold, or HP -{2})',
    zh: '挖开坟墓（{0}% 概率 +{1} 金币，失败 HP -{2}）',
  },
  'forgotten_grave.c1.win': {
    ko: '부장품 상자에서 금화가 나왔다. +{0} 골드.',
    en: 'A burial chest yields old coins. +{0} Gold.',
    zh: '陪葬箱中找到了金币。+{0} 金币。',
  },
  'forgotten_grave.c1.lose': {
    ko: '무덤에서 뻗어 나온 손이 발목을 할퀴었다. HP -{0}.',
    en: 'A hand reaches from the grave and rakes your ankle. HP -{0}.',
    zh: '坟墓中伸出的手抓伤了你的脚踝。HP -{0}。',
  },
  'forgotten_grave.c2': {
    ko: '예를 갖춰 기도한다 (HP +{0})',
    en: 'Pay your respects (HP +{0})',
    zh: '虔诚祈祷（HP +{0}）',
  },
  'forgotten_grave.c2.r': {
    ko: '고요한 평온이 상처를 어루만졌다. HP +{0}.',
    en: 'A quiet peace soothes your wounds. HP +{0}.',
    zh: '宁静的安详抚平了伤口。HP +{0}。',
  },
  'forgotten_grave.c3': { ko: '조용히 지나간다', en: 'Pass by quietly', zh: '安静地走过' },

  // ── 떠돌이 연금술사 ──
  'traveling_alchemist.title': { ko: '떠돌이 연금술사', en: 'Traveling Alchemist', zh: '流浪炼金术师' },
  'traveling_alchemist.body': {
    ko: '유리병이 잔뜩 매달린 수레 곁에서 연금술사가 손짓한다. "재료만 있으면 뭐든 만들지."',
    en: 'An alchemist beckons from a cart hung with glass vials. "Give me materials, and I can brew anything."',
    zh: '挂满玻璃瓶的推车旁，炼金术师招手道："只要有材料，什么都能炼。"',
  },
  'traveling_alchemist.c1': {
    ko: '피를 재료로 내준다 (HP -{0}, 무작위 카드 획득)',
    en: 'Offer your blood (HP -{0}, gain a random card)',
    zh: '献出鲜血（HP -{0}，获得随机卡牌）',
  },
  'traveling_alchemist.c1.r': {
    ko: '핏방울이 증류되며 비법이 완성됐다. {0} 카드를 얻었다.',
    en: 'Your blood distills into a secret formula. Gained {0}.',
    zh: '血滴经过蒸馏，秘方完成。获得了 {0}。',
  },
  'traveling_alchemist.c2': {
    ko: '{0} 골드로 회복약을 산다 (HP +{1})',
    en: 'Buy a tonic for {0} Gold (HP +{1})',
    zh: '花 {0} 金币购买补药（HP +{1}）',
  },
  'traveling_alchemist.c2.r': {
    ko: '쌉싸름한 약이 목을 타고 내려가자 상처가 아물었다.',
    en: 'The bitter tonic slides down your throat, and your wounds close.',
    zh: '苦涩的药水下肚，伤口愈合了。',
  },
  'traveling_alchemist.c3': { ko: '사양한다', en: 'Decline', zh: '婉拒离开' },

  // ── 고대 무기고 ──
  'ancient_armory.title': { ko: '고대 무기고', en: 'Ancient Armory', zh: '古代武器库' },
  'ancient_armory.body': {
    ko: '먼지 쌓인 무기고의 문이 반쯤 열려 있다. 선반 위 유물이 희미하게 빛난다.',
    en: 'The door of a dusty armory hangs half-open. A relic glimmers faintly on a shelf.',
    zh: '积满灰尘的武器库大门半开着。架上的遗物散发着微光。',
  },
  'ancient_armory.c1': {
    ko: '무기를 집어 든다 (무작위 카드 획득)',
    en: 'Take a weapon (gain a random card)',
    zh: '拿起武器（获得随机卡牌）',
  },
  'ancient_armory.c1.r': {
    ko: '손에 익은 무기에서 기술이 떠올랐다. {0} 카드를 얻었다.',
    en: 'The weapon feels familiar, and a technique comes to mind. Gained {0}.',
    zh: '武器十分称手，脑中浮现出技巧。获得了 {0}。',
  },
  'ancient_armory.c2': {
    ko: '{0} 골드를 두고 유물을 가져간다',
    en: 'Leave {0} Gold and take the relic',
    zh: '留下 {0} 金币，取走遗物',
  },
  'ancient_armory.c2.r': {
    ko: '선반의 {0}이(가) 새 주인을 맞이했다.',
    en: 'The {0} on the shelf welcomes its new owner.',
    zh: '架上的 {0} 迎来了新主人。',
  },
  'ancient_armory.c3': { ko: '문을 닫고 떠난다', en: 'Close the door and leave', zh: '关门离开' },

  // ── 별빛 샘 ──
  'starlit_spring.title': { ko: '별빛 샘', en: 'Starlit Spring', zh: '星光之泉' },
  'starlit_spring.body': {
    ko: '별빛이 녹아든 듯한 샘물이 은은하게 빛난다. 물에 닿기만 해도 몸이 가벼워진다.',
    en: 'A spring glows softly, as if starlight has melted into it. Even its mist makes you feel lighter.',
    zh: '仿佛溶入星光的泉水散发柔光。仅是靠近就觉得身体轻盈。',
  },
  'starlit_spring.c1': {
    ko: '{0} 골드를 바치고 몸을 담근다 (HP 전부 회복)',
    en: 'Offer {0} Gold and bathe (fully heal)',
    zh: '献上 {0} 金币入水沐浴（完全恢复HP）',
  },
  'starlit_spring.c1.r': {
    ko: '별빛이 온몸을 감싸며 모든 상처가 사라졌다.',
    en: 'Starlight envelops you, and every wound vanishes.',
    zh: '星光包裹全身，所有伤口都消失了。',
  },
  'starlit_spring.c2': {
    ko: '한 모금 마신다 (HP +{0})',
    en: 'Take a sip (HP +{0})',
    zh: '喝一口泉水（HP +{0}）',
  },
  'starlit_spring.c2.r': {
    ko: '차가운 샘물이 활력을 되돌렸다. HP +{0}.',
    en: 'The cool water restores your vigor. HP +{0}.',
    zh: '清凉的泉水恢复了活力。HP +{0}。',
  },
  'starlit_spring.c3': { ko: '샘을 지나친다', en: 'Pass the spring', zh: '绕过泉水' },

  // ── 고블린 통행세 ──
  'goblin_toll.title': { ko: '고블린 통행세', en: 'Goblin Toll', zh: '哥布林过路费' },
  'goblin_toll.body': {
    ko: '좁은 다리 위에서 고블린 무리가 창을 겨눈다. "통행세! 안 내면 못 지나간다!"',
    en: 'Goblins level their spears on a narrow bridge. "Toll! No pay, no pass!"',
    zh: '狭窄的桥上，哥布林们举起长矛："过路费！不交别想过！"',
  },
  'goblin_toll.c1': {
    ko: '{0} 골드를 낸다',
    en: 'Pay {0} Gold',
    zh: '支付 {0} 金币',
  },
  'goblin_toll.c1.r': {
    ko: '고블린들이 낄낄대며 길을 비켰다.',
    en: 'The goblins cackle and step aside.',
    zh: '哥布林们嬉笑着让开了路。',
  },
  'goblin_toll.c2': {
    ko: '몰래 지나간다 ({0}% 확률로 무사 통과, 실패 시 HP -{1})',
    en: 'Sneak past ({0}% chance to slip by, or HP -{1})',
    zh: '偷偷溜过（{0}% 概率安全通过，失败 HP -{1}）',
  },
  'goblin_toll.c2.win': {
    ko: '고블린들이 한눈을 판 사이 소리 없이 다리를 건넜다.',
    en: 'While the goblins bicker, you cross the bridge unseen.',
    zh: '趁哥布林分神，你悄无声息地过了桥。',
  },
  'goblin_toll.c2.lose': {
    ko: '들켰다! 창끝이 어깨를 스쳤다. HP -{0}.',
    en: "Spotted! A spear grazes your shoulder. HP -{0}.",
    zh: '被发现了！矛尖擦过肩膀。HP -{0}。',
  },
  'goblin_toll.c3': { ko: '왔던 길로 돌아간다', en: 'Turn back', zh: '原路返回' },

  // ── 책벌레 학자 ──
  'bookworm_scholar.title': { ko: '책벌레 학자', en: 'Bookworm Scholar', zh: '书虫学者' },
  'bookworm_scholar.body': {
    ko: '책 더미에 파묻힌 학자가 눈을 반짝인다. "그 기술 문서, 내게 팔지 않겠나?"',
    en: 'A scholar buried in books looks up eagerly. "That technique of yours — care to sell it?"',
    zh: '埋在书堆里的学者眼睛一亮："你那份技艺，卖给我如何？"',
  },
  'bookworm_scholar.c1': {
    ko: '카드 1장을 팔아 {0} 골드를 받는다',
    en: 'Sell 1 card for {0} Gold',
    zh: '出售1张卡牌换取 {0} 金币',
  },
  'bookworm_scholar.c2': {
    ko: '{0} 골드로 필사본을 산다 (무작위 카드 획득)',
    en: 'Buy a manuscript for {0} Gold (gain a random card)',
    zh: '花 {0} 金币购买手抄本（获得随机卡牌）',
  },
  'bookworm_scholar.c2.r': {
    ko: '필사본의 지식이 머릿속에 스며들었다. {0} 카드를 얻었다.',
    en: 'The manuscript’s knowledge seeps into your mind. Gained {0}.',
    zh: '手抄本的知识渗入脑海。获得了 {0}。',
  },
  'bookworm_scholar.c3': { ko: '자리를 뜬다', en: 'Take your leave', zh: '起身离开' },

  // ── 은둔자의 오두막 ──
  'hermits_hut.title': { ko: '은둔자의 오두막', en: "Hermit's Hut", zh: '隐士的小屋' },
  'hermits_hut.body': {
    ko: '연기가 피어오르는 오두막에서 은둔자가 문을 연다. "쉬어 가겠나, 아니면 일손을 보태겠나?"',
    en: 'A hermit opens the door of a smoking hut. "Rest a while, or lend a hand?"',
    zh: '炊烟袅袅的小屋里，隐士打开门："要歇歇脚，还是帮把手？"',
  },
  'hermits_hut.c1': {
    ko: '난롯가에서 쉰다 (HP +{0})',
    en: 'Rest by the hearth (HP +{0})',
    zh: '在炉边休息（HP +{0}）',
  },
  'hermits_hut.c1.r': {
    ko: '따뜻한 난롯불에 피로가 녹아내렸다. HP +{0}.',
    en: 'The warm hearth melts your fatigue away. HP +{0}.',
    zh: '温暖的炉火驱散了疲惫。HP +{0}。',
  },
  'hermits_hut.c2': {
    ko: '장작을 패 준다 (+{0} 골드, HP -{1})',
    en: 'Chop firewood (+{0} Gold, HP -{1})',
    zh: '帮忙劈柴（+{0} 金币，HP -{1}）',
  },
  'hermits_hut.c2.r': {
    ko: '온몸이 뻐근하지만 두둑한 품삯을 받았다. +{0} 골드.',
    en: 'Your muscles ache, but the pay is generous. +{0} Gold.',
    zh: '浑身酸痛，但工钱丰厚。+{0} 金币。',
  },
  'hermits_hut.c3': { ko: '길을 계속 간다', en: 'Continue on your way', zh: '继续赶路' },

  // ── 마녀의 오두막 ──
  'witch_hut.title': { ko: '마녀의 오두막', en: "Witch's Hut", zh: '女巫的小屋' },
  'witch_hut.body': {
    ko: '약초 냄새가 진동하는 오두막에서 마녀가 웃는다. "힘을 원해? 대가는 아주 작아."',
    en: 'A witch grins inside a hut reeking of herbs. "Want power? The price is oh-so-small."',
    zh: '药草味弥漫的小屋里，女巫咧嘴一笑："想要力量吗？代价可小得很。"',
  },
  'witch_hut.c1': {
    ko: '수상한 물약을 마신다 (최대 HP +{0}, 저주 획득)',
    en: 'Drink the strange potion (Max HP +{0}, gain a Curse)',
    zh: '喝下可疑的药水（最大HP +{0}，获得诅咒）',
  },
  'witch_hut.c1.r': {
    ko: '몸이 튼튼해졌지만(최대 HP +{0}) {1} 저주가 덱에 스며들었다.',
    en: 'Your body grows sturdier (Max HP +{0}), but the {1} curse seeps into your deck.',
    zh: '身体变得强健（最大HP +{0}），但{1}诅咒渗入了牌组。',
  },
  'witch_hut.c2': {
    ko: '{0} 골드로 마법 연마를 부탁한다 (카드 1장 강화)',
    en: 'Pay {0} Gold for enchantment (upgrade 1 card)',
    zh: '支付 {0} 金币请求附魔（强化1张卡牌）',
  },
  'witch_hut.c3': { ko: '오두막을 지나친다', en: 'Pass the hut', zh: '绕过小屋' },
};

/** 이벤트 텍스트 조회 + {N} 치환 */
export function getEventText(key: string, lang: Language, ...args: readonly (string | number)[]): string {
  let text = EVENT_TEXTS[key]?.[lang] ?? key;
  for (let i = 0; i < args.length; i++) {
    text = text.replace(`{${i}}`, String(args[i]));
  }
  return text;
}
