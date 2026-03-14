// 전투 상태 관리 hook (효과음 통합)

import { useCallback, useRef, useState } from 'react';
import type { CombatState } from '@tower-of-cardborn/game-core/types/combat';
import { CARD_DEFINITIONS } from '@tower-of-cardborn/game-core/data/cards';
import { endPlayerTurn, initCombat, playCard } from '@tower-of-cardborn/game-core/game/combat-engine';
import { playSfx } from '../utils/sound';

interface UseCombatReturn {
  readonly combat: CombatState | null;
  readonly startCombat: (deckIds: readonly string[], enemyIds: readonly string[], hp?: number, maxHp?: number) => void;
  readonly handlePlayCard: (cardInstanceId: string, targetEnemyId?: string) => void;
  readonly handleEndTurn: () => void;
  readonly clearCombat: () => void;
}

export function useCombat(initialState?: CombatState | null): UseCombatReturn {
  const [combat, setCombat] = useState<CombatState | null>(initialState ?? null);
  const combatRef = useRef(combat);
  combatRef.current = combat;

  const startCombat = useCallback((deckIds: readonly string[], enemyIds: readonly string[], hp?: number, maxHp?: number) => {
    setCombat(initCombat(deckIds, enemyIds, hp, maxHp));
  }, []);

  // 카드 사용 시 타입별 효과음 재생
  const handlePlayCard = useCallback((cardInstanceId: string, targetEnemyId?: string) => {
    const prev = combatRef.current;
    if (prev) {
      const cardInst = prev.hand.find((c) => c.instanceId === cardInstanceId);
      if (cardInst) {
        const def = CARD_DEFINITIONS[cardInst.definitionId];
        if (def) {
          const sfx = def.type === 'attack' ? 'card_attack' : def.type === 'skill' ? 'card_skill' : 'card_power';
          playSfx(sfx);
        }
      }
    }
    setCombat((p) => {
      if (!p) return p;
      return playCard(p, cardInstanceId, targetEnemyId);
    });
  }, []);

  // 턴 종료 효과음 + 적 공격 피격음
  const handleEndTurn = useCallback(() => {
    playSfx('turn_end');
    setCombat((prev) => {
      if (!prev) return prev;
      const hpBefore = prev.player.hp;
      const blockBefore = prev.player.block;
      const next = endPlayerTurn(prev);
      // 적 공격 후 피격/방어 효과음 (약간 딜레이)
      setTimeout(() => {
        if (next.player.hp < hpBefore) playSfx('player_hit');
        else if (blockBefore > 0 && next.player.block < blockBefore) playSfx('block');
      }, 400);
      return next;
    });
  }, []);

  const clearCombat = useCallback(() => {
    setCombat(null);
  }, []);

  return { combat, startCombat, handlePlayCard, handleEndTurn, clearCombat };
}
