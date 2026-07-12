// 카드 타입별 스타일 클래스 매핑

import type { CardType } from '@tower-of-cardborn/game-core/types/card';
import cardStyles from '../../styles/card.module.css';

const TYPE_CLASS_MAP: Record<CardType, string> = {
  attack: cardStyles.cardAttack,
  skill: cardStyles.cardSkill,
  power: cardStyles.cardPower,
  curse: cardStyles.cardCurse,
};

/** 카드 타입 스타일 클래스 조회 */
export function getCardTypeClass(type: CardType): string {
  return TYPE_CLASS_MAP[type];
}
