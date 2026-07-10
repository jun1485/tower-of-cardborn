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
  /** 승리한 최고 승천 레벨 */
  readonly highestWonAscension: number;
  /** 최근 종료 런 */
  readonly recentRuns: readonly RunSummary[];
}

export interface RunSummary {
  readonly finishedAt: number;
  readonly won: boolean;
  readonly floor: number;
  readonly kills: number;
  readonly ascension: number;
  readonly runSeed: number | null;
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
  highestWonAscension: 0,
  recentRuns: [],
};

/** 숫자 필드 방어 병합 */
function mergeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** 메타 통계 정수 정규화 */
function mergeCount(value: unknown, fallback = 0): number {
  return Math.max(0, Math.floor(mergeNumber(value, fallback)));
}

/** 종료 런 기록 구조 확인 */
function isRunSummary(value: unknown): value is RunSummary {
  if (typeof value !== 'object' || value === null) return false;
  const run = value as Partial<RunSummary>;
  return typeof run.finishedAt === 'number' && Number.isFinite(run.finishedAt)
    && typeof run.won === 'boolean'
    && typeof run.floor === 'number' && Number.isFinite(run.floor)
    && typeof run.kills === 'number' && Number.isFinite(run.kills)
    && typeof run.ascension === 'number' && Number.isFinite(run.ascension);
}

/** 최근 런 기록 정규화 */
function normalizeRecentRuns(value: unknown): readonly RunSummary[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRunSummary).slice(0, 10).map((run) => ({
    finishedAt: Math.max(0, Math.floor(run.finishedAt)),
    won: run.won,
    floor: mergeCount(run.floor),
    kills: mergeCount(run.kills),
    ascension: Math.min(MAX_ASCENSION, mergeCount(run.ascension)),
    runSeed: typeof run.runSeed === 'number' && Number.isFinite(run.runSeed)
      ? Math.min(0xFFFFFFFF, mergeCount(run.runSeed))
      : null,
  }));
}

/** 손상된 메타 데이터 정리 */
function removeInvalidMeta(): void {
  try {
    localStorage.removeItem(META_KEY);
  } catch {
    console.error('손상된 런 통계를 정리하지 못했습니다.');
  }
}

export function loadMeta(): MetaState {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return DEFAULT_META;
    const parsed = JSON.parse(raw) as MetaData;
    if (parsed.version !== META_VERSION) return DEFAULT_META;
    const stats = parsed.stats ?? {};
    const totalRuns = mergeCount(stats.totalRuns);
    const recentRuns = normalizeRecentRuns(stats.recentRuns);
    const recentHighestWonAscension = recentRuns.reduce(
      (highest, run) => run.won ? Math.max(highest, run.ascension) : highest,
      0,
    );
    return {
      totalRuns,
      totalWins: Math.min(totalRuns, mergeCount(stats.totalWins)),
      totalKills: mergeCount(stats.totalKills),
      bestFloor: mergeCount(stats.bestFloor),
      ascensionUnlocked: Math.min(MAX_ASCENSION, mergeCount(stats.ascensionUnlocked)),
      lastAscension: Math.min(MAX_ASCENSION, mergeCount(stats.lastAscension)),
      highestWonAscension: Math.min(
        MAX_ASCENSION,
        Math.max(mergeCount(stats.highestWonAscension), recentHighestWonAscension),
      ),
      recentRuns,
    };
  } catch {
    removeInvalidMeta();
    return DEFAULT_META;
  }
}

function saveMeta(stats: MetaState): void {
  try {
    const data: MetaData = { version: META_VERSION, stats };
    localStorage.setItem(META_KEY, JSON.stringify(data));
  } catch {
    console.error('런 통계를 저장하지 못했습니다.');
  }
}

/** 런 통계 및 해금 데이터 초기화 */
export function clearMeta(): boolean {
  try {
    localStorage.removeItem(META_KEY);
    return true;
  } catch {
    console.error('런 통계를 초기화하지 못했습니다.');
    return false;
  }
}

/** 런 시작 기록 (도전 횟수 + 최근 승천 레벨 갱신) */
export function recordRunStart(ascension: number): MetaState {
  const prev = loadMeta();
  const next: MetaState = {
    ...prev,
    totalRuns: prev.totalRuns + 1,
    lastAscension: Math.min(MAX_ASCENSION, mergeCount(ascension)),
  };
  saveMeta(next);
  return next;
}

interface RunEndRecord {
  readonly won: boolean;
  readonly floor: number;
  readonly kills: number;
  readonly ascension: number;
  readonly runSeed?: number | null;
}

/** 런 종료 기록 반영 (승리 시 다음 승천 레벨 해금) */
export function recordRunEnd({ won, floor, kills, ascension, runSeed = null }: RunEndRecord): { meta: MetaState; newlyUnlocked: number | null } {
  const prev = loadMeta();
  const normalizedFloor = mergeCount(floor);
  const normalizedKills = mergeCount(kills);
  const normalizedAscension = Math.min(MAX_ASCENSION, mergeCount(ascension));
  const unlocked = won
    ? Math.max(prev.ascensionUnlocked, Math.min(normalizedAscension + 1, MAX_ASCENSION))
    : prev.ascensionUnlocked;
  const next: MetaState = {
    ...prev,
    totalWins: prev.totalWins + (won ? 1 : 0),
    totalKills: prev.totalKills + normalizedKills,
    bestFloor: Math.max(prev.bestFloor, normalizedFloor),
    ascensionUnlocked: unlocked,
    highestWonAscension: won
      ? Math.max(prev.highestWonAscension, normalizedAscension)
      : prev.highestWonAscension,
    recentRuns: [{
      finishedAt: Date.now(),
      won,
      floor: normalizedFloor,
      kills: normalizedKills,
      ascension: normalizedAscension,
      runSeed: runSeed === null ? null : Math.min(0xFFFFFFFF, mergeCount(runSeed)),
    }, ...prev.recentRuns].slice(0, 10),
  };
  saveMeta(next);
  return { meta: next, newlyUnlocked: unlocked > prev.ascensionUnlocked ? unlocked : null };
}
