// 루트 컴포넌트: 화면 라우팅

import { useGame } from './hooks/use-game';
import { CombatScreen } from './components/combat/CombatScreen';
import { RewardScreen } from './components/combat/RewardScreen';
import { MapScreen } from './components/map/MapScreen';
import { RestScreen } from './components/map/RestScreen';
import { UpgradeScreen } from './components/map/UpgradeScreen';
import type { CharacterClass } from './types/game';
import styles from './styles/app.module.css';

const CLASS_IMAGE: Record<CharacterClass, string> = {
  warrior: '/assets/classes/warrior.png?v=4',
  archer: '/assets/classes/archer.png?v=4',
  mage: '/assets/classes/mage.png?v=4',
  assassin: '/assets/classes/assassin.png?v=4',
};

function App() {
  const {
    screen, combat, deck, playerHp, playerMaxHp, map, characterClass, rewardCards,
    startNewGame, selectMapNode, handlePlayCard, handleEndTurn,
    pickRewardCard, skipReward, rest, goToUpgrade, upgradeCard, skipUpgrade, skipRest, goToTitle,
  } = useGame();

  switch (screen) {
    case 'title':
      return (
        <div className={styles.titleScreen}>
          <h1 className={styles.title}>루멘폴 크로니클</h1>
          <p className={styles.subtitle}>직업을 선택하세요</p>
          <div className={styles.classSelection}>
            <button className={styles.classCard} onClick={() => startNewGame('warrior')}>
              <img className={styles.classIcon} src={CLASS_IMAGE.warrior} alt="전사" />
              <span className={styles.className}>전사</span>
              <span className={styles.classDeck}>Strike x5 · Defend x4 · Bash x1</span>
            </button>
            <button className={styles.classCard} onClick={() => startNewGame('archer')}>
              <img className={styles.classIcon} src={CLASS_IMAGE.archer} alt="궁수" />
              <span className={styles.className}>궁수</span>
              <span className={styles.classDeck}>Quick Shot x5 · Dodge x4 · Aimed Shot x1</span>
            </button>
            <button className={styles.classCard} onClick={() => startNewGame('mage')}>
              <img className={styles.classIcon} src={CLASS_IMAGE.mage} alt="마법사" />
              <span className={styles.className}>마법사</span>
              <span className={styles.classDeck}>Magic Bolt x5 · Arcane Barrier x4 · Mana Blast x1</span>
            </button>
            <button className={styles.classCard} onClick={() => startNewGame('assassin')}>
              <img className={styles.classIcon} src={CLASS_IMAGE.assassin} alt="암살자" />
              <span className={styles.className}>암살자</span>
              <span className={styles.classDeck}>Shadow Strike x5 · Evasive Step x4 · Blood Drain x1</span>
            </button>
          </div>
        </div>
      );

    case 'map':
      if (!map) return null;
      return (
        <MapScreen
          map={map}
          playerHp={playerHp}
          playerMaxHp={playerMaxHp}
          deckSize={deck.length}
          onSelectNode={selectMapNode}
        />
      );

    case 'combat':
      if (!combat) return null;
      return (
        <CombatScreen
          combat={combat}
          characterClass={characterClass}
          onPlayCard={handlePlayCard}
          onEndTurn={handleEndTurn}
        />
      );

    case 'combat_reward':
      return (
        <RewardScreen
          rewardCards={rewardCards}
          onPick={pickRewardCard}
          onSkip={skipReward}
        />
      );

    case 'rest':
      return (
        <RestScreen
          playerHp={playerHp}
          playerMaxHp={playerMaxHp}
          onRest={rest}
          onUpgrade={goToUpgrade}
          onSkip={skipRest}
        />
      );

    case 'upgrade':
      return (
        <UpgradeScreen
          deck={deck}
          onUpgrade={upgradeCard}
          onSkip={skipUpgrade}
        />
      );

    case 'victory':
      return (
        <div className={styles.resultScreen}>
          <h1 className={`${styles.resultTitle} ${styles.victoryTitle}`}>게임 클리어!</h1>
          <p className={styles.subtitle}>덱 {deck.length}장 · HP {playerHp}/{playerMaxHp}</p>
          <button className={styles.resultBtn} onClick={() => startNewGame(characterClass)}>
            새 게임
          </button>
          <button className={styles.resultBtn} onClick={goToTitle}>
            타이틀로
          </button>
        </div>
      );

    case 'game_over':
      return (
        <div className={styles.resultScreen}>
          <h1 className={`${styles.resultTitle} ${styles.defeatTitle}`}>패배...</h1>
          <button className={styles.resultBtn} onClick={() => startNewGame(characterClass)}>
            다시 시작
          </button>
          <button className={styles.resultBtn} onClick={goToTitle}>
            타이틀로
          </button>
        </div>
      );
  }
}

export default App;

