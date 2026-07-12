// 전투 상태 관리 hook (효과음 통합 + 종료 콜백)

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CombatState } from '@tower-of-cardborn/game-core/types/combat';
import type { RelicCombatBonuses } from '@tower-of-cardborn/game-core/types/relic';
import type { PotionId } from '@tower-of-cardborn/game-core/types/potion';
import { CARD_DEFINITIONS } from '@tower-of-cardborn/game-core/data/cards';
import { endPlayerTurn, initCombat, playCard, usePotion as applyPotionEffect } from '@tower-of-cardborn/game-core/game/combat-engine';
import { playSfx } from '../utils/sound';
import { useReducedMotion } from './use-reduced-motion';

interface UseCombatReturn {
  readonly combat: CombatState | null;
  readonly startCombat: (
    deckIds: readonly string[],
    enemyIds: readonly string[],
    hp?: number,
    maxHp?: number,
    ascension?: number,
    mapIndex?: number,
    relicBonuses?: RelicCombatBonuses,
  ) => void;
  readonly handlePlayCard: (cardInstanceId: string, targetEnemyId?: string) => void;
  readonly handleEndTurn: () => void;
  readonly handleUsePotion: (potionId: PotionId, targetEnemyId?: string) => boolean;
  readonly clearCombat: () => void;
}

export function useCombat(
  initialState?: CombatState | null,
  onResult?: (finished: CombatState) => void,
): UseCombatReturn {
  const reducedMotion = useReducedMotion();
  const [combat, setCombat] = useState<CombatState | null>(initialState ?? null);
  const combatRef = useRef(combat);
  const onResultRef = useRef(onResult);
  const sfxTimerRef = useRef<number | null>(null);
  const resultTimerRef = useRef<number | null>(null);

  useEffect(() => {
    combatRef.current = combat;
  }, [combat]);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // 적 행동 효과음·결과 통지 타이머 정리
  useEffect(() => () => {
    if (sfxTimerRef.current !== null) window.clearTimeout(sfxTimerRef.current);
    if (resultTimerRef.current !== null) window.clearTimeout(resultTimerRef.current);
  }, []);

  /** 전투 상태 갱신 + 종료 결과 통지 (승리는 처치 연출 노출 후 지연 통지) */
  const applyCombat = useCallback((next: CombatState) => {
    combatRef.current = next;
    setCombat(next);
    if (next.result === 'ongoing') return;
    if (next.result === 'victory' && !reducedMotion) {
      if (resultTimerRef.current !== null) window.clearTimeout(resultTimerRef.current);
      resultTimerRef.current = window.setTimeout(() => {
        resultTimerRef.current = null;
        onResultRef.current?.(next);
      }, 550);
      return;
    }
    onResultRef.current?.(next);
  }, [reducedMotion]);

  const startCombat = useCallback((
    deckIds: readonly string[],
    enemyIds: readonly string[],
    hp?: number,
    maxHp?: number,
    ascension?: number,
    mapIndex?: number,
    relicBonuses?: RelicCombatBonuses,
  ) => {
    const next = initCombat(deckIds, enemyIds, hp, maxHp, ascension, mapIndex, relicBonuses);
    combatRef.current = next;
    setCombat(next);
  }, []);

  // 카드 사용 시 타입별 효과음 재생
  const handlePlayCard = useCallback((cardInstanceId: string, targetEnemyId?: string) => {
    const prev = combatRef.current;
    // 종료된 전투 재처리 차단 (지연 타이머 경유 중복 통지 방지)
    if (!prev || prev.result !== 'ongoing') return;

    const cardInst = prev.hand.find((c) => c.instanceId === cardInstanceId);
    const next = playCard(prev, cardInstanceId, targetEnemyId);
    if (next === prev) return;
    if (cardInst) {
      const def = CARD_DEFINITIONS[cardInst.definitionId];
      if (def) {
        const sfx = def.type === 'attack' ? 'card_attack' : def.type === 'skill' ? 'card_skill' : 'card_power';
        playSfx(sfx);
      }
    }
    const enemyHpBefore = prev.enemies.reduce((sum, enemy) => sum + enemy.hp, 0);
    const enemyHpAfter = next.enemies.reduce((sum, enemy) => sum + enemy.hp, 0);
    if (enemyHpAfter < enemyHpBefore) playSfx('enemy_hit');

    applyCombat(next);
  }, [applyCombat]);

  // 턴 종료 효과음 + 적 공격 피격음
  const handleEndTurn = useCallback(() => {
    const prev = combatRef.current;
    // 종료된 전투 재처리 차단 (지연 타이머 경유 중복 통지 방지)
    if (!prev || prev.result !== 'ongoing') return;

    playSfx('turn_end');
    const hpBefore = prev.player.hp;
    const blockBefore = prev.player.block;
    const hadEnemyAttack = prev.enemies.some((enemy) => enemy.intent.type === 'attack');
    const next = endPlayerTurn(prev);
    // 적 공격 후 피격/방어 효과음 (약간 딜레이)
    if (sfxTimerRef.current !== null) window.clearTimeout(sfxTimerRef.current);
    const playImpactSfx = () => {
      if (next.player.hp < hpBefore) playSfx('player_hit');
      else if (hadEnemyAttack && blockBefore > 0) playSfx('block');
      sfxTimerRef.current = null;
    };
    if (reducedMotion) playImpactSfx();
    else sfxTimerRef.current = window.setTimeout(playImpactSfx, 400);

    applyCombat(next);
  }, [applyCombat, reducedMotion]);

  /** 전투 포션 사용과 효과음 처리 */
  const handleUsePotion = useCallback((potionId: PotionId, targetEnemyId?: string) => {
    const prev = combatRef.current;
    if (!prev) return false;
    const next = applyPotionEffect(prev, potionId, targetEnemyId);
    if (next === prev) return false;

    if (potionId === 'healing_potion') playSfx('heal');
    else if (potionId === 'block_potion') playSfx('block');
    else if (potionId === 'energy_potion' || potionId === 'strength_potion') playSfx('card_power');
    else {
      playSfx('card_attack');
      playSfx('enemy_hit');
    }
    applyCombat(next);
    return true;
  }, [applyCombat]);

  const clearCombat = useCallback(() => {
    if (resultTimerRef.current !== null) {
      window.clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
    }
    combatRef.current = null;
    setCombat(null);
  }, []);

  return { combat, startCombat, handlePlayCard, handleEndTurn, handleUsePotion, clearCombat };
}
