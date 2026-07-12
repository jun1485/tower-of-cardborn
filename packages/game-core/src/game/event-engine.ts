// 이벤트 로직: 선택지 조건 검증, 효과 적용, 이벤트 추첨

import type { EventChoice, EventEffect, EventResult, GameEvent } from '../types/event';
import type { CharacterClass } from '../types/game';
import type { RelicId } from '../types/relic';
import { EVENTS } from '../data/events';
import { getRewardCards } from '../data/cards';
import { getRelicReward } from '../data/relics';
import { random } from '../utils/random';

export interface EventChoiceContext {
  readonly hp: number;
  readonly maxHp: number;
  readonly gold: number;
  readonly deckSize: number;
  readonly upgradableCount: number;
  /** 미보유 유물 후보 존재 여부 */
  readonly relicCandidateAvailable?: boolean;
}

export interface EventResolveContext {
  readonly hp: number;
  readonly maxHp: number;
  readonly gold: number;
  readonly characterClass: CharacterClass;
  readonly relics?: readonly RelicId[];
}

export interface EventOutcome {
  readonly hp: number;
  readonly maxHp: number;
  readonly gold: number;
  /** random_card 효과로 획득한 카드 ID */
  readonly gainedCardId: string | null;
  /** gain_relic 효과로 획득한 유물 ID */
  readonly gainedRelicId: RelicId | null;
  /** 카드 제거/강화 후속 화면 지시 */
  readonly followUp: { readonly type: 'remove' | 'upgrade'; readonly count: number } | null;
  readonly result: EventResult | null;
}

/** 선택지 활성 조건 충족 여부 판정 */
export function isChoiceAvailable(choice: EventChoice, ctx: EventChoiceContext): boolean {
  const cond = choice.condition;
  if (!cond) return true;
  if (cond.minGold !== undefined && ctx.gold < cond.minGold) return false;
  if (cond.minHp !== undefined && ctx.hp < cond.minHp) return false;
  if (cond.minDeckSize !== undefined && ctx.deckSize < cond.minDeckSize) return false;
  if (cond.minUpgradable !== undefined && ctx.upgradableCount < cond.minUpgradable) return false;
  if (cond.requiresMissingHp && ctx.hp >= ctx.maxHp) return false;
  if (cond.requiresRelicCandidate && !(ctx.relicCandidateAvailable ?? false)) return false;
  return true;
}

/** 효과 목록 순차 적용 + 결과 표시 인자 수집 */
interface ApplyState {
  hp: number;
  maxHp: number;
  gold: number;
  gainedCardId: string | null;
  gainedRelicId: RelicId | null;
  ownedRelics: readonly RelicId[];
  followUp: EventOutcome['followUp'];
}

function applyEffects(
  effects: readonly EventEffect[],
  state: ApplyState,
  characterClass: CharacterClass,
): (string | number)[] {
  const args: (string | number)[] = [];

  for (const effect of effects) {
    switch (effect.type) {
      case 'hp': {
        // 음수: 사망 방지 하한 1, 양수: 최대 HP 상한
        const before = state.hp;
        state.hp = effect.value < 0
          ? Math.max(1, state.hp + effect.value)
          : Math.min(state.maxHp, state.hp + effect.value);
        // 단일 효과 선택지만 클램프 반영 실제 변화량을 결과 인자로 노출
        if (effects.length === 1) args.push(Math.abs(state.hp - before));
        break;
      }
      case 'max_hp': {
        state.maxHp += effect.value;
        state.hp = Math.min(state.maxHp, state.hp + effect.value);
        args.push(effect.value);
        break;
      }
      case 'heal_full': {
        state.hp = state.maxHp;
        break;
      }
      case 'gold': {
        const rolled = effect.variance !== undefined
          ? effect.value + Math.floor(random() * (effect.variance + 1))
          : effect.value;
        state.gold = Math.max(0, state.gold + rolled);
        if (rolled > 0) args.push(rolled);
        break;
      }
      case 'random_card': {
        const cardId = getRewardCards(1, characterClass)[0];
        if (cardId) {
          state.gainedCardId = cardId;
          args.push(`card:${cardId}`);
        }
        break;
      }
      case 'gain_relic': {
        const relicId = getRelicReward(state.ownedRelics);
        if (relicId) {
          state.gainedRelicId = relicId;
          state.ownedRelics = [...state.ownedRelics, relicId];
          args.push(`relic:${relicId}`);
        }
        break;
      }
      case 'curse_card': {
        state.gainedCardId = effect.cardId;
        args.push(`card:${effect.cardId}`);
        break;
      }
      case 'remove_card': {
        state.followUp = { type: 'remove', count: effect.count };
        break;
      }
      case 'upgrade_card': {
        state.followUp = { type: 'upgrade', count: effect.count };
        break;
      }
      case 'gamble':
        break;
    }
  }

  return args;
}

/** 선택지 효과 적용 결과 산출 */
export function resolveEventChoice(
  event: GameEvent,
  choice: EventChoice,
  ctx: EventResolveContext,
): EventOutcome {
  const state: ApplyState = {
    hp: ctx.hp,
    maxHp: ctx.maxHp,
    gold: ctx.gold,
    gainedCardId: null,
    gainedRelicId: null,
    ownedRelics: ctx.relics ?? [],
    followUp: null,
  };

  const mainEffects = choice.effects.filter((effect) => effect.type !== 'gamble');
  const gamble = choice.effects.find((effect) => effect.type === 'gamble');
  const mainArgs = applyEffects(mainEffects, state, ctx.characterClass);

  // 도박 효과: 판정 후 해당 분기 효과·결과문 적용
  if (gamble && gamble.type === 'gamble') {
    const won = random() < gamble.chance;
    const branch = won ? gamble.win : gamble.lose;
    const branchArgs = applyEffects(branch, state, ctx.characterClass);
    return {
      hp: state.hp,
      maxHp: state.maxHp,
      gold: state.gold,
      gainedCardId: state.gainedCardId,
      gainedRelicId: state.gainedRelicId,
      followUp: state.followUp,
      result: { key: `${event.id}.${won ? gamble.winKey : gamble.loseKey}`, args: branchArgs },
    };
  }

  return {
    hp: state.hp,
    maxHp: state.maxHp,
    gold: state.gold,
    gainedCardId: state.gainedCardId,
    gainedRelicId: state.gainedRelicId,
    followUp: state.followUp,
    result: choice.resultKey
      ? { key: `${event.id}.${choice.resultKey}`, args: mainArgs }
      : null,
  };
}

/** 미열람 우선 이벤트 추첨 (액트 전용 풀 + 풀 소진 시 리셋) */
export function pickRandomEvent(seenEventIds: readonly string[], mapIndex = 1): GameEvent {
  const actPool = EVENTS.filter((event) => !event.acts || event.acts.includes(mapIndex));
  const unseen = actPool.filter((event) => !seenEventIds.includes(event.id));
  const pool = unseen.length > 0 ? unseen : actPool;
  return pool[Math.floor(random() * pool.length)];
}
