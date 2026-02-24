// 전투 상태 관리 hook

import { useCallback, useState } from 'react';
import type { CombatState } from '@tower-of-cardborn/game-core/types/combat';
import { endPlayerTurn, initCombat, playCard } from '@tower-of-cardborn/game-core/game/combat-engine';

interface UseCombatReturn {
  readonly combat: CombatState | null;
  readonly startCombat: (deckIds: readonly string[], enemyIds: readonly string[], hp?: number, maxHp?: number) => void;
  readonly handlePlayCard: (cardInstanceId: string, targetEnemyId?: string) => void;
  readonly handleEndTurn: () => void;
  readonly clearCombat: () => void;
}

export function useCombat(initialState?: CombatState | null): UseCombatReturn {
  const [combat, setCombat] = useState<CombatState | null>(initialState ?? null);

  const startCombat = useCallback((deckIds: readonly string[], enemyIds: readonly string[], hp?: number, maxHp?: number) => {
    setCombat(initCombat(deckIds, enemyIds, hp, maxHp));
  }, []);

  const handlePlayCard = useCallback((cardInstanceId: string, targetEnemyId?: string) => {
    setCombat((prev) => {
      if (!prev) return prev;
      return playCard(prev, cardInstanceId, targetEnemyId);
    });
  }, []);

  const handleEndTurn = useCallback(() => {
    setCombat((prev) => {
      if (!prev) return prev;
      return endPlayerTurn(prev);
    });
  }, []);

  const clearCombat = useCallback(() => {
    setCombat(null);
  }, []);

  return { combat, startCombat, handlePlayCard, handleEndTurn, clearCombat };
}
