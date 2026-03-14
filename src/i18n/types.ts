// 다국어 타입 정의

export type Language = 'ko' | 'en' | 'zh';

export interface Translations {
  // 공통
  confirm: string;
  cancel: string;
  skip: string;
  titleBack: string;
  newGame: string;
  retry: string;

  // 타이틀
  gameTitle: string;
  selectClass: string;
  warrior: string;
  archer: string;
  mage: string;
  assassin: string;

  // 전투
  turn: string;
  deck: string;
  endTurn: string;
  noCards: string;
  drawPile: string;
  discardPile: string;
  exhaustPile: string;
  energy: string;
  player: string;
  enemy: string;

  // 상태효과
  vulnerable: string;
  vulnerableDesc: string;
  weak: string;
  weakDesc: string;
  strength: string;
  strengthDesc: string;
  turnsLeft: string;
  permanent: string;
  block: string;

  // 보상
  victory: string;
  selectCard: string;

  // 키워드 설명
  kwVulnerable: string;
  kwWeak: string;
  kwStrength: string;
  kwExhaust: string;
  kwPower: string;

  // 맵
  nodecombat: string;
  nodeElite: string;
  nodeRest: string;
  nodeBoss: string;
  mapLabel: string;
  deckCount: string;
  floor: string;

  // 휴식
  restTitle: string;
  restHeal: string;
  upgradeOption: string;

  // 강화
  upgradeTitle: string;
  upgradeSelect: string;
  alreadyUpgraded: string;

  // 결과
  victoryTitle: string;
  defeatTitle: string;
  deckStat: string;

  // 설정
  settings: string;
  bgmVolume: string;
  sfxVolume: string;
  confirmOnExit: string;
  resetSave: string;
  resetSaveWarning: string;
  deleteSave: string;
  resetSettings: string;
  language: string;

  // 카드 공통
  exhaust: string;
  cardArt: string;
  cardTypeAttack: string;
  cardTypeSkill: string;
  cardTypePower: string;

  // 카드 설명 템플릿 ({0}=값, {1}=횟수)
  cdDamage: string;
  cdDamageAll: string;
  cdMultiHit: string;
  cdBlock: string;
  cdDraw: string;
  cdVulnerable: string;
  cdWeak: string;
  cdStrength: string;
  cdEnergy: string;
  cdSelfDamage: string;
  cdHeal: string;
  cdDamageWord: string;

  // 뒤로가기 확인
  exitConfirm: string;
  backToTitleConfirm: string;
  exit: string;
}
