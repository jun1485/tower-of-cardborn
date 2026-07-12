// 카드 효과 키워드 설명 추출 (카드/보상 화면 공용)

import type { CardDefinition } from '@tower-of-cardborn/game-core/types/card';
import type { TFunction } from './index';

/** 카드 효과에서 키워드 설명 추출 */
export function getCardKeywords(def: CardDefinition, t: TFunction): string[] {
  const keywords: string[] = [];
  const push = (text: string) => {
    if (!keywords.includes(text)) keywords.push(text);
  };
  for (const effect of def.effects) {
    if (effect.statusType === 'vulnerable') push(t('kwVulnerable'));
    if (effect.statusType === 'weak') push(t('kwWeak'));
    if (effect.statusType === 'poison') push(t('kwPoison'));
    if (effect.statusType === 'frail') push(t('kwFrail'));
    if (effect.type === 'gain_strength') push(t('kwStrength'));
    if (effect.type === 'gain_dexterity') push(t('kwDexterity'));
  }
  if (def.exhaust) push(t('kwExhaust'));
  if (def.type === 'power') push(t('kwPower'));
  if (def.type === 'curse') push(t('kwCurse'));
  return keywords;
}
