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
    { title: '1. 직업 선택', body: '시작 덱과 전투 성향이 다른 직업을 선택합니다.' },
    { title: '2. 탑 등반', body: '연결된 맵 노드 중 하나를 골라 전투·휴식·상점·이벤트로 이동합니다.' },
    { title: '3. 카드 사용', body: '패의 카드를 전장으로 드래그하거나 포커스 후 Enter·Space로 사용합니다.' },
    { title: '4. 적 인텐트', body: '적 위의 아이콘은 다음 공격·방어·버프를 예고합니다. 방어도를 맞춰 피해를 막으세요.' },
    { title: '5. 덱과 유물', body: '전투 보상과 상점에서 카드를 얻고, 엘리트·보스를 처치해 영구 보너스 유물을 획득합니다.' },
    { title: '6. 액트와 승천', body: '3개 액트의 보스를 모두 처치하면 더 높은 승천 난이도가 해금됩니다.' },
  ],
  en: [
    { title: '1. Choose a class', body: 'Each class begins with a different deck and combat style.' },
    { title: '2. Climb the tower', body: 'Choose a connected map node to enter combat, rest sites, shops, or events.' },
    { title: '3. Play cards', body: 'Drag a card onto the battlefield or focus it and press Enter or Space.' },
    { title: '4. Read intents', body: 'Icons above enemies preview their next attack, defense, or buff. Build enough block before ending the turn.' },
    { title: '5. Cards and relics', body: 'Build your deck through rewards and shops, and defeat elites or bosses to earn lasting relic bonuses.' },
    { title: '6. Acts and ascension', body: 'Defeat all three act bosses to unlock a higher ascension difficulty.' },
  ],
  zh: [
    { title: '1. 选择职业', body: '每个职业都有不同的初始牌组和战斗风格。' },
    { title: '2. 攀登高塔', body: '选择相连的地图节点，进入战斗、休息处、商店或事件。' },
    { title: '3. 使用卡牌', body: '将卡牌拖到战场，或聚焦卡牌后按 Enter 或空格键。' },
    { title: '4. 观察意图', body: '敌人上方的图标会预告下一次攻击、防御或增益。结束回合前准备足够的护盾。' },
    { title: '5. 卡牌与遗物', body: '通过奖励和商店构筑牌组，击败精英或首领以获得持续生效的遗物加成。' },
    { title: '6. 章节与进阶', body: '击败三个章节的首领，即可解锁更高的进阶难度。' },
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
