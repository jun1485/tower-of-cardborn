// 전투 상태 관리 hook (효과음 통합 + 종료 콜백)

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CombatState } from '@tower-of-cardborn/game-core/types/combat';
import { CARD_DEFINITIONS } from '@tower-of-cardborn/game-core/data/cards';
import { endPlayerTurn, initCombat, playCard } from '@tower-of-cardborn/game-core/game/combat-engine';
import { playSfx } from '../utils/sound';

interface UseCombatReturn {
  readonly combat: CombatState | null;
  readonly startCombat: (deckIds: readonly string[], enemyIds: readonly string[], hp?: number, maxHp?: number, ascension?: number) => void;
  readonly handlePlayCard: (cardInstanceId: string, targetEnemyId?: string) => void;
  readonly handleEndTurn: () => void;
  readonly clearCombat: () => void;
}

export function useCombat(
  initialState?: CombatState | null,
  onResult?: (finished: CombatState) => void,
): UseCombatReturn {
  const [combat, setCombat] = useState<CombatState | null>(initialState ?? null);
  const combatRef = useRef(combat);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    combatRef.current = combat;
  }, [combat]);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  /** 전투 상태 갱신 + 종료 결과 통지 */
  const applyCombat = useCallback((next: CombatState) => {
    combatRef.current = next;
    setCombat(next);
    if (next.result !== 'ongoing') {
      onResultRef.current?.(next);
    }
  }, []);

  const startCombat = useCallback((deckIds: readonly string[], enemyIds: readonly string[], hp?: number, maxHp?: number, ascension?: number) => {
    const next = initCombat(deckIds, enemyIds, hp, maxHp, ascension);
    combatRef.current = next;
    setCombat(next);
  }, []);

  // 카드 사용 시 타입별 효과음 재생
  const handlePlayCard = useCallback((cardInstanceId: string, targetEnemyId?: string) => {
    const prev = combatRef.current;
    // 종료된 전투 재처리 차단 (지연 타이머 경유 중복 통지 방지)
    if (!prev || prev.result !== 'ongoing') return;

    const cardInst = prev.hand.find((c) => c.instanceId === cardInstanceId);
    if (cardInst) {
      const def = CARD_DEFINITIONS[cardInst.definitionId];
      if (def) {
        const sfx = def.type === 'attack' ? 'card_attack' : def.type === 'skill' ? 'card_skill' : 'card_power';
        playSfx(sfx);
      }
    }

    applyCombat(playCard(prev, cardInstanceId, targetEnemyId));
  }, [applyCombat]);

  // 턴 종료 효과음 + 적 공격 피격음
  const handleEndTurn = useCallback(() => {
    const prev = combatRef.current;
    // 종료된 전투 재처리 차단 (지연 타이머 경유 중복 통지 방지)
    if (!prev || prev.result !== 'ongoing') return;

    playSfx('turn_end');
    const hpBefore = prev.player.hp;
    const blockBefore = prev.player.block;
    const next = endPlayerTurn(prev);
    // 적 공격 후 피격/방어 효과음 (약간 딜레이)
    setTimeout(() => {
      if (next.player.hp < hpBefore) playSfx('player_hit');
      else if (blockBefore > 0 && next.player.block < blockBefore) playSfx('block');
    }, 400);

    applyCombat(next);
  }, [applyCombat]);

  const clearCombat = useCallback(() => {
    combatRef.current = null;
    setCombat(null);
  }, []);

  return { combat, startCombat, handlePlayCard, handleEndTurn, clearCombat };
}
