// localStorage 저장/복원 래퍼 (버전 관리 포함)

import type { GameState } from '@tower-of-cardborn/game-core/types/game';

const SAVE_KEY = 'tower-of-cardborn-save';

/** 저장 포맷 버전 — 타입/구조 변경 시 숫자를 올리면 이전 세이브 자동 무효화 */
const SAVE_VERSION = 3;

interface SaveData {
  readonly version: number;
  readonly state: GameState;
}

export function saveGame(state: GameState): void {
  const data: SaveData = { version: SAVE_VERSION, state };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SaveData;
    // 버전 불일치 또는 구버전 포맷 → 삭제 후 null 반환
    if (!parsed.version || parsed.version !== SAVE_VERSION) {
      localStorage.removeItem(SAVE_KEY);
      return null;
    }
    return parsed.state;
  } catch {
    localStorage.removeItem(SAVE_KEY);
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
