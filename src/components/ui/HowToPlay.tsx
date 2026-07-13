// 다국어 게임 방법 모달

import { useLanguage, useTranslation } from '../../i18n';
import type { Language } from '../../i18n';
import { useModalKeyboard } from '../../hooks/use-modal-keyboard';
import styles from '../../styles/app.module.css';

interface HowToPlayProps {
  readonly onClose: () => void;
}

const GUIDE_CONTENT: Record<Language, readonly { readonly title: string; readonly body: string }[]> = {
  ko: [
    { title: '1. 직업 선택', body: '시작 덱과 전투 성향이 다른 직업을 선택합니다. 암살자는 독, 궁수는 다단히트, 전사는 광역과 지속 파워가 특기입니다.' },
    { title: '2. 탑 등반', body: '연결된 맵 노드 중 하나를 골라 전투·휴식·상점·이벤트로 이동합니다.' },
    { title: '3. 카드와 포션 사용', body: '터치 화면에서는 손패를 한 번 펼친 뒤 카드를 탭하거나 드래그하고, 키보드에서는 Enter·Space로 사용합니다. 보유 포션은 화면 버튼 또는 숫자 1·2로 사용합니다.' },
    { title: '4. 적 인텐트', body: '적 위의 아이콘은 다음 공격·방어·강화·상태이상을 예고합니다. 행동에 맞춰 카드를 선택하세요.' },
    { title: '5. 상태이상과 파워', body: '취약·약화·독·손상은 턴마다 감소하고, 힘·민첩은 영구 유지됩니다. 독은 턴 시작 시 중첩만큼 피해를 주고, 파워 카드는 매 턴 자동 발동 효과를 남깁니다. 저주 카드는 사용할 수 없으니 제거로 정리하세요.' },
    { title: '6. 덱·유물·포션', body: '카드로 덱을 구성하고 영구 보너스 유물을 모으세요. 상점에서는 카드·유물·포션 구매와 카드 강화·제거가 가능합니다.' },
    { title: '7. 장비와 강화석', body: '런이 끝나면 도달 층수만큼 강화석을 얻습니다. 타이틀의 장비 메뉴에서 무기·갑옷·장신구·신발·반지·부적 6종 장비를 강화해 다음 런부터 영구히 강해집니다.' },
    { title: '8. 일일 도전과 순위표', body: '일일 도전은 모두가 같은 시드·직업으로 겨루며 장비 효과가 적용되지 않습니다. 런 점수는 순위표에 기록됩니다.' },
    { title: '9. 액트와 승천', body: '3개 액트의 보스를 모두 처치하면 더 높은 승천 난이도가 해금됩니다. 높은 승천은 엘리트 증가·상점 가격 인상 등 규칙도 달라집니다. 클리어 후에는 엔들리스 등반으로 점수를 계속 올릴 수 있습니다.' },
  ],
  en: [
    { title: '1. Choose a class', body: 'Each class begins with a different deck and combat style. Assassins excel at Poison, Archers at multi-hits, Warriors at AoE and lasting Powers.' },
    { title: '2. Climb the tower', body: 'Choose a connected map node to enter combat, rest sites, shops, or events.' },
    { title: '3. Use cards and potions', body: 'On touch screens, open your hand once, then tap or drag cards. With a keyboard, press Enter or Space while focused. Use potion buttons or the 1 and 2 number keys.' },
    { title: '4. Read intents', body: 'Icons above enemies preview attacks, defense, buffs, or debuffs. Choose cards that answer the next action.' },
    { title: '5. Statuses and Powers', body: 'Vulnerable, Weak, Poison, and Frail tick down each turn; Strength and Dexterity are permanent. Poison deals damage equal to its stacks at turn start, and Power cards leave effects that trigger every turn. Curse cards are unplayable — remove them when you can.' },
    { title: '6. Cards, relics, and potions', body: 'Build a deck and collect lasting relic bonuses. Shops sell cards, relics, and potions, and offer card upgrades and removal.' },
    { title: '7. Equipment and Shards', body: 'Each run grants Shards equal to floors climbed. Upgrade six pieces of gear — weapon, armor, pendant, boots, ring, and talisman — from the title screen to grow permanently stronger.' },
    { title: '8. Daily Challenge and Rankings', body: 'Daily Challenges pit everyone against the same seed and class, with equipment disabled for fairness. Run scores are recorded on the ranking board.' },
    { title: '9. Acts and ascension', body: 'Defeat all three act bosses to unlock higher ascension difficulties, which also change rules like extra elites and higher shop prices. After clearing, keep climbing in Endless mode to push your score.' },
  ],
  zh: [
    { title: '1. 选择职业', body: '每个职业都有不同的初始牌组和战斗风格。刺客擅长中毒，弓手擅长多段攻击，战士擅长群攻与持续能力。' },
    { title: '2. 攀登高塔', body: '选择相连的地图节点，进入战斗、休息处、商店或事件。' },
    { title: '3. 使用卡牌与药水', body: '触摸屏先展开一次手牌，再点击或拖动卡牌；键盘可聚焦后按 Enter、空格键。药水可点击按钮或按数字键1、2使用。' },
    { title: '4. 观察意图', body: '敌人上方的图标会预告攻击、防御、强化或减益。根据下一步行动选择卡牌。' },
    { title: '5. 状态与能力', body: '易伤、虚弱、中毒、脆弱每回合递减；力量与敏捷永久保留。中毒在回合开始时造成等同层数的伤害，能力卡会留下每回合自动触发的效果。诅咒卡无法使用，请尽快移除。' },
    { title: '6. 卡牌、遗物与药水', body: '构筑牌组并收集持续生效的遗物。商店出售卡牌、遗物与药水，并提供强化与删卡服务。' },
    { title: '7. 装备与强化石', body: '每次冒险结束后按到达层数获得强化石。在标题画面的装备菜单强化武器、铠甲、项链、靴子、戒指与护符六件装备，使自己永久变强。' },
    { title: '8. 每日挑战与排行榜', body: '每日挑战让所有人使用相同的种子与职业，且不适用装备效果。冒险得分会记录在排行榜上。' },
    { title: '9. 章节与进阶', body: '击败三个章节的首领即可解锁更高的进阶难度。高进阶还会改变规则，如精英增多、商店涨价等。通关后可在无尽模式中继续攀登刷新分数。' },
  ],
};

export function HowToPlay({ onClose }: HowToPlayProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const modalRef = useModalKeyboard(onClose);

  return (
    <div className={styles.policyOverlay} onClick={onClose}>
      <div
        className={styles.policyModal}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-play-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.policyHeader}>
          <h2 id="how-to-play-title">{t('howToPlay')}</h2>
          <button className={styles.policyCloseBtn} aria-label={t('close')} onClick={onClose}>×</button>
        </div>
        <div className={styles.policyContent}>
          {GUIDE_CONTENT[lang].map((step) => (
            <section key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
