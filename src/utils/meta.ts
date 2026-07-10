// 런 간 유지되는 메타 통계 저장/복원 래퍼 (런 세이브와 분리)

import { MAX_ASCENSION } from '@tower-of-cardborn/game-core/data/ascension';

const META_KEY = 'tower-of-cardborn-meta';
const META_VERSION = 1;

export interface MetaState {
  /** 시작한 런 수 (포기 포함) */
  readonly totalRuns: number;
  readonly totalWins: number;
  /** 종료된 런의 처치 누계 */
  readonly totalKills: number;
  /** 최고 누적 도달 층 */
  readonly bestFloor: number;
  /** 해금된 최고 승천 레벨 */
  readonly ascensionUnlocked: number;
  /** 최근 선택 승천 레벨 (타이틀 초기값) */
  readonly lastAscension: number;
}

interface MetaData {
  readonly version: number;
  readonly stats: Partial<MetaState>;
}

const DEFAULT_META: MetaState = {
  totalRuns: 0,
  totalWins: 0,
  totalKills: 0,
  bestFloor: 0,
  ascensionUnlocked: 0,
  lastAscension: 0,
};

/** 숫자 필드 방어 병합 */
function mergeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function loadMeta(): MetaState {
  const raw = localStorage.getItem(META_KEY);
  if (!raw) return DEFAULT_META;
  try {
    const parsed = JSON.parse(raw) as MetaData;
    const stats = parsed.stats ?? {};
    return {
      totalRuns: mergeNumber(stats.totalRuns, 0),
      totalWins: mergeNumber(stats.totalWins, 0),
      totalKills: mergeNumber(stats.totalKills, 0),
      bestFloor: mergeNumber(stats.bestFloor, 0),
      ascensionUnlocked: Math.max(0, Math.min(MAX_ASCENSION, mergeNumber(stats.ascensionUnlocked, 0))),
      lastAscension: Math.max(0, Math.min(MAX_ASCENSION, mergeNumber(stats.lastAscension, 0))),
    };
  } catch {
    localStorage.removeItem(META_KEY);
    return DEFAULT_META;
  }
}

function saveMeta(stats: MetaState): void {
  const data: MetaData = { version: META_VERSION, stats };
  localStorage.setItem(META_KEY, JSON.stringify(data));
}

/** 런 시작 기록 (도전 횟수 + 최근 승천 레벨 갱신) */
export function recordRunStart(ascension: number): MetaState {
  const prev = loadMeta();
  const next: MetaState = {
    ...prev,
    totalRuns: prev.totalRuns + 1,
    lastAscension: Math.max(0, Math.min(MAX_ASCENSION, ascension)),
  };
  saveMeta(next);
  return next;
}

interface RunEndRecord {
  readonly won: boolean;
  readonly floor: number;
  readonly kills: number;
  readonly ascension: number;
}

/** 런 종료 기록 반영 (승리 시 다음 승천 레벨 해금) */
export function recordRunEnd({ won, floor, kills, ascension }: RunEndRecord): { meta: MetaState; newlyUnlocked: number | null } {
  const prev = loadMeta();
  const unlocked = won
    ? Math.max(prev.ascensionUnlocked, Math.min(ascension + 1, MAX_ASCENSION))
    : prev.ascensionUnlocked;
  const next: MetaState = {
    ...prev,
    totalWins: prev.totalWins + (won ? 1 : 0),
    totalKills: prev.totalKills + kills,
    bestFloor: Math.max(prev.bestFloor, floor),
    ascensionUnlocked: unlocked,
  };
  saveMeta(next);
  return { meta: next, newlyUnlocked: unlocked > prev.ascensionUnlocked ? unlocked : null };
}
