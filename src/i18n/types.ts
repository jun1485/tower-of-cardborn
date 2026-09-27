// 다국어 타입 정의

export type Language = 'ko' | 'en' | 'zh';

export interface Translations {
  // 공통
  confirm: string;
  cancel: string;
  close: string;
  skip: string;
  skipCard: string;
  titleBack: string;
  newGame: string;
  retry: string;

  // 타이틀
  gameTitle: string;
  appDescription: string;
  selectClass: string;
  warrior: string;
  archer: string;
  mage: string;
  assassin: string;
  warriorDesc: string;
  archerDesc: string;
  mageDesc: string;
  assassinDesc: string;
  dailyChallenge: string;
  dailyChallengeDesc: string;
  dailyRetryUnranked: string;
  howToPlay: string;
  privacyPolicy: string;
  relicReward: string;
  relics: string;
  potionReward: string;
  potions: string;

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
  intentAttack: string;
  intentDefend: string;
  intentBuff: string;
  intentDebuff: string;

  // 상태효과
  vulnerable: string;
  vulnerableDesc: string;
  weak: string;
  weakDesc: string;
  strength: string;
  strengthDesc: string;
  poison: string;
  poisonDesc: string;
  frail: string;
  frailDesc: string;
  dexterity: string;
  dexterityDesc: string;
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
  kwPoison: string;
  kwFrail: string;
  kwDexterity: string;
  kwExhaust: string;
  kwPower: string;
  kwCurse: string;

  // 맵
  nodecombat: string;
  nodeElite: string;
  nodeRest: string;
  nodeShop: string;
  nodeEvent: string;
  nodeBoss: string;
  nodeTreasure: string;
  treasureTitle: string;
  mapLabel: string;
  deckCount: string;
  floor: string;

  // 이벤트
  eventContinue: string;

  // 승천
  ascensionLabel: string;
  ascensionNormal: string;
  ascensionDecrease: string;
  ascensionIncrease: string;
  ascDesc0: string;
  ascDesc1: string;
  ascDesc2: string;
  ascDesc3: string;
  ascDesc4: string;
  ascDesc5: string;
  ascensionUnlockedMsg: string;

  // 휴식
  restTitle: string;
  restHeal: string;
  upgradeOption: string;
  removeOption: string;

  // 카드 제거
  removeTitle: string;
  removeSelect: string;

  // 상점
  shopTitle: string;
  shopSelect: string;
  shopRemoveService: string;
  shopLeave: string;

  // 골드/보상
  goldReward: string;

  // 강화
  upgradeTitle: string;
  upgradeSelect: string;
  alreadyUpgraded: string;

  // 결과
  victoryTitle: string;
  defeatTitle: string;
  deckStat: string;
  runStats: string;
  runSeedLabel: string;

  // 메타 통계
  metaStats: string;
  runHistory: string;
  noRunHistory: string;
  runHistoryItem: string;
  runWon: string;
  runLost: string;
  achievements: string;
  achievementFirstWin: string;
  achievementSlayer: string;
  achievementTowerClear: string;
  achievementAscensionMaster: string;
  achievementDailyChampion: string;
  achievementVeteran: string;
  achievementHighScorer: string;

  // 설정
  settings: string;
  sfxVolume: string;
  musicVolume: string;
  confirmOnExit: string;
  reduceMotion: string;
  resetSave: string;
  resetSaveWarning: string;
  deleteSave: string;
  resetSettings: string;
  language: string;
  saveError: string;
  saveRestoreFailed: string;
  settingsSaveError: string;

  // 카드 공통
  exhaust: string;
  cardArt: string;
  cardTypeAttack: string;
  cardTypeSkill: string;
  cardTypePower: string;
  cardTypeCurse: string;
  rarityStarter: string;
  rarityCommon: string;
  rarityUncommon: string;
  rarityRare: string;

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
  cdPoison: string;
  cdPoisonAll: string;
  cdFrail: string;
  cdWeakAll: string;
  cdDexterity: string;
  cdPowerBlock: string;
  cdPowerStrength: string;
  cdPowerDraw: string;
  cdPowerHeal: string;
  cdUnplayable: string;

  // 상점 확장
  shopRelicSoldOut: string;
  shopBuy: string;
  shopUpgradeService: string;

  // 결과 공유
  shareResult: string;
  shareCopied: string;

  // 엔들리스
  continueEndless: string;

  // 일일 도전/시드
  dailyCompleted: string;
  seedInputLabel: string;
  seedInputPlaceholder: string;

  // 순위표
  ranking: string;
  noRanking: string;
  rankingScore: string;
  rankDaily: string;
  rankingAll: string;
  runScoreLabel: string;
  newRecord: string;

  // 장비
  equipment: string;
  shards: string;
  shardsEarnedLabel: string;
  equipWeapon: string;
  equipArmor: string;
  equipAccessory: string;
  equipBoots: string;
  equipRing: string;
  equipTalisman: string;
  equipWeaponEffect: string;
  equipArmorEffect: string;
  equipAccessoryEffect: string;
  equipBootsEffect: string;
  equipRingEffect: string;
  equipTalismanEffect: string;
  equipUpgradeCost: string;
  equipMaxLevel: string;
  equipDailyNote: string;

  // 뒤로가기 확인
  exitConfirm: string;
  backToTitleConfirm: string;
  exit: string;
}
