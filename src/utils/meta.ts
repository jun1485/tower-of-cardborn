// 런 간 유지되는 메타 통계 저장/복원 래퍼 (런 세이브와 분리)

import { MAX_ASCENSION } from '@tower-of-cardborn/game-core/data/ascension';
import type { CharacterClass } from '@tower-of-cardborn/game-core/types/game';
import { addShards, calculateShardReward } from './equipment';

const META_KEY = 'tower-of-cardborn-meta';
const META_VERSION = 1;

/** 메타 구조 버전 승격 함수 (fromVersion → fromVersion+1) */
type MetaMigration = (stats: unknown) => unknown;

// 버전별 순차 마이그레이션 체인 — 메타 버전 상향 시 직전 버전 항목 등록 필수
const META_MIGRATIONS: Readonly<Record<number, MetaMigration>> = {};

/** 구버전 메타 데이터 현행 버전 승격 */
function migrateMeta(version: number, stats: unknown): unknown {
  let migrated = stats;
  for (let from = version; from < META_VERSION; from += 1) {
    const migrate = META_MIGRATIONS[from];
    if (!migrate) return null;
    migrated = migrate(migrated);
  }
  return migrated;
}

/** JSON 객체 형태 확인 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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
  /** 일일 도전 누적 승리 수 */
  readonly totalDailyWins: number;
  /** 최근 일일 도전 기록 */
  readonly lastDaily: DailyRecord | null;
  /** 최근 종료 런 */
  readonly recentRuns: readonly RunSummary[];
  /** 점수 상위 런 (인게임 순위표) */
  readonly bestRuns: readonly RunSummary[];
}

export interface DailyRecord {
  /** UTC 날짜 (YYYY-MM-DD) */
  readonly date: string;
  readonly won: boolean;
}

export interface RunSummary {
  readonly finishedAt: number;
  readonly won: boolean;
  readonly floor: number;
  readonly kills: number;
  readonly ascension: number;
  readonly runSeed: number | null;
  readonly characterClass: CharacterClass | null;
  /** 런 종합 점수 (순위표 기준) */
  readonly score: number;
  /** 일일 도전 런 여부 */
  readonly isDaily: boolean;
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
  totalDailyWins: 0,
  lastDaily: null,
  recentRuns: [],
  bestRuns: [],
};

/** 순위표 보관 상한 */
const BEST_RUNS_LIMIT = 10;
const BEST_RUNS_STORAGE_LIMIT = BEST_RUNS_LIMIT * 2;

/** 런 종합 점수 산정 */
export function calculateRunScore(run: { floor: number; kills: number; won: boolean; ascension: number }): number {
  const base = Math.max(0, Math.floor(run.floor)) * 15 + Math.max(0, Math.floor(run.kills)) * 3;
  return base + (run.won ? 100 + Math.min(MAX_ASCENSION, Math.max(0, run.ascension)) * 50 : 0);
}

/** UTC 기준 일일 도전 날짜 문자열 */
export function getUTCDateString(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** 일일 도전 기록 정규화 */
function normalizeLastDaily(value: unknown): DailyRecord | null {
  if (!isRecord(value) || typeof value.date !== 'string' || typeof value.won !== 'boolean') return null;
  return { date: value.date, won: value.won };
}

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

/** 최근 런 기록 정규화 (score 미기록 구버전은 재산정) */
function normalizeRunList(value: unknown, limit: number): readonly RunSummary[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRunSummary).slice(0, limit).map((run) => {
    const won = run.won;
    const floor = mergeCount(run.floor);
    const kills = mergeCount(run.kills);
    const ascension = Math.min(MAX_ASCENSION, mergeCount(run.ascension));
    return {
      finishedAt: Math.max(0, Math.floor(run.finishedAt)),
      won,
      floor,
      kills,
      ascension,
      runSeed: typeof run.runSeed === 'number' && Number.isFinite(run.runSeed)
        ? Math.min(0xFFFFFFFF, mergeCount(run.runSeed))
        : null,
      characterClass: run.characterClass === 'warrior' || run.characterClass === 'archer'
        || run.characterClass === 'mage' || run.characterClass === 'assassin'
        ? run.characterClass
        : null,
      score: typeof run.score === 'number' && Number.isFinite(run.score)
        ? mergeCount(run.score)
        : calculateRunScore({ floor, kills, won, ascension }),
      isDaily: run.isDaily === true,
    };
  });
}

/** 전체·일일 상위 기록 동시 보존 */
function selectBestRuns(runs: readonly RunSummary[]): readonly RunSummary[] {
  const sorted = [...runs].sort((a, b) => b.score - a.score);
  const overall = sorted.slice(0, BEST_RUNS_LIMIT);
  const daily = sorted.filter((run) => run.isDaily).slice(0, BEST_RUNS_LIMIT);
  return [...overall, ...daily.filter((run) => !overall.some((entry) => entry.finishedAt === run.finishedAt))]
    .sort((a, b) => b.score - a.score);
}

/** 순위표 필터별 상위 기록 조회 */
export function getRankedRuns(runs: readonly RunSummary[], dailyOnly = false): readonly RunSummary[] {
  return runs.filter((run) => !dailyOnly || run.isDaily).slice(0, BEST_RUNS_LIMIT);
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
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)
      || typeof parsed.version !== 'number'
      || !Number.isInteger(parsed.version)
      || parsed.version < 1) {
      removeInvalidMeta();
      return DEFAULT_META;
    }
    // 미래 버전 메타는 삭제하지 않고 기본값으로만 동작
    if (parsed.version > META_VERSION) return DEFAULT_META;
    const migrated = parsed.version === META_VERSION
      ? parsed.stats
      : migrateMeta(parsed.version, parsed.stats);
    const stats: Record<string, unknown> = isRecord(migrated) ? migrated : {};
    const recentRuns = normalizeRunList(stats.recentRuns, 10);
    const totalRuns = Math.max(mergeCount(stats.totalRuns), recentRuns.length);
    const bestRuns = selectBestRuns(normalizeRunList(stats.bestRuns, BEST_RUNS_STORAGE_LIMIT));
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
      totalDailyWins: mergeCount(stats.totalDailyWins),
      lastDaily: normalizeLastDaily(stats.lastDaily),
      recentRuns,
      bestRuns,
    };
  } catch {
    removeInvalidMeta();
    return DEFAULT_META;
  }
}

function saveMeta(stats: MetaState): boolean {
  try {
    const data: MetaData = { version: META_VERSION, stats };
    localStorage.setItem(META_KEY, JSON.stringify(data));
    return true;
  } catch {
    console.error('런 통계를 저장하지 못했습니다.');
    return false;
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
export function recordRunStart(ascension: number): { meta: MetaState; saved: boolean } {
  const prev = loadMeta();
  const next: MetaState = {
    ...prev,
    totalRuns: prev.totalRuns + 1,
    lastAscension: Math.min(MAX_ASCENSION, mergeCount(ascension)),
  };
  return { meta: next, saved: saveMeta(next) };
}

interface RunEndRecord {
  readonly won: boolean;
  readonly floor: number;
  readonly kills: number;
  readonly ascension: number;
  readonly runSeed?: number | null;
  readonly characterClass?: CharacterClass | null;
  readonly isDaily?: boolean;
}

/** 런 종료 기록 반영 (승리 시 다음 승천 레벨 해금) */
export function recordRunEnd({
  won,
  floor,
  kills,
  ascension,
  runSeed = null,
  characterClass = null,
  isDaily = false,
}: RunEndRecord): { meta: MetaState; newlyUnlocked: number | null; recordedAt: number; saved: boolean } {
  const prev = loadMeta();
  const normalizedFloor = mergeCount(floor);
  const normalizedKills = mergeCount(kills);
  const normalizedAscension = Math.min(MAX_ASCENSION, mergeCount(ascension));
  const unlocked = won
    ? Math.max(prev.ascensionUnlocked, Math.min(normalizedAscension + 1, MAX_ASCENSION))
    : prev.ascensionUnlocked;
  const today = getUTCDateString();
  const latestFinishedAt = prev.recentRuns.reduce((latest, run) => Math.max(latest, run.finishedAt), -1);
  const summary: RunSummary = {
    finishedAt: Math.max(Date.now(), latestFinishedAt + 1),
    won,
    floor: normalizedFloor,
    kills: normalizedKills,
    ascension: normalizedAscension,
    runSeed: runSeed === null ? null : Math.min(0xFFFFFFFF, mergeCount(runSeed)),
    characterClass,
    score: calculateRunScore({ floor: normalizedFloor, kills: normalizedKills, won, ascension: normalizedAscension }),
    isDaily,
  };
  const next: MetaState = {
    ...prev,
    // 종료 기록 단독 호출 시 도전 수 보정
    totalRuns: Math.max(prev.totalRuns, prev.recentRuns.length + 1),
    totalWins: prev.totalWins + (won ? 1 : 0),
    totalKills: prev.totalKills + normalizedKills,
    bestFloor: Math.max(prev.bestFloor, normalizedFloor),
    ascensionUnlocked: unlocked,
    highestWonAscension: won
      ? Math.max(prev.highestWonAscension, normalizedAscension)
      : prev.highestWonAscension,
    totalDailyWins: prev.totalDailyWins + (isDaily && won ? 1 : 0),
    // 같은 날 재도전 시 승리 기록 유지
    lastDaily: isDaily
      ? { date: today, won: won || (prev.lastDaily?.date === today && prev.lastDaily.won) }
      : prev.lastDaily,
    recentRuns: [summary, ...prev.recentRuns].slice(0, 10),
    bestRuns: selectBestRuns([...prev.bestRuns, summary]),
  };
  // 런 종료 강화석 지급
  const shardResult = addShards(calculateShardReward(normalizedFloor, won, isDaily));
  const saved = saveMeta(next) && shardResult.saved;
  return {
    meta: next,
    newlyUnlocked: unlocked > prev.ascensionUnlocked ? unlocked : null,
    recordedAt: summary.finishedAt,
    saved,
  };
}

/** 기록된 종료 런 조회 */
export function findRecordedRun(recordedAt: number | null | undefined): RunSummary | null {
  if (recordedAt == null) return null;
  const meta = loadMeta();
  return meta.recentRuns.find((run) => run.finishedAt === recordedAt)
    ?? meta.bestRuns.find((run) => run.finishedAt === recordedAt)
    ?? null;
}

/** 이번 런 최고 기록 여부 판정 */
export function isTopRunRecord(recordedAt: number | null | undefined, dailyOnly = false): boolean {
  return recordedAt != null && getRankedRuns(loadMeta().bestRuns, dailyOnly)[0]?.finishedAt === recordedAt;
}

interface EndlessProgress {
  readonly floor: number;
  readonly kills: number;
  readonly ascension: number;
}

/** 기록된 승리 런의 엔들리스 진행분 갱신 (통계 중복 가산 없이 층·점수만 상향) */
export function updateRecordedRun(recordedAt: number, progress: EndlessProgress): boolean {
  const prev = loadMeta();
  const target = prev.recentRuns.find((run) => run.finishedAt === recordedAt)
    ?? prev.bestRuns.find((run) => run.finishedAt === recordedAt);
  if (!target) return true;
  const floor = Math.max(target.floor, mergeCount(progress.floor));
  const kills = Math.max(target.kills, mergeCount(progress.kills));
  if (floor === target.floor && kills === target.kills) return true;
  const updated: RunSummary = {
    ...target,
    floor,
    kills,
    score: calculateRunScore({
      floor,
      kills,
      won: target.won,
      ascension: Math.min(MAX_ASCENSION, mergeCount(progress.ascension)),
    }),
  };
  const replace = (runs: readonly RunSummary[]) =>
    runs.map((run) => run.finishedAt === recordedAt ? updated : run);
  // 상향된 점수로 순위표 재진입 허용
  const replacedBest = replace(prev.bestRuns);
  const bestWithUpdate = replacedBest.some((run) => run.finishedAt === recordedAt)
    ? replacedBest
    : [...replacedBest, updated];
  const next: MetaState = {
    ...prev,
    bestFloor: Math.max(prev.bestFloor, floor),
    recentRuns: replace(prev.recentRuns),
    bestRuns: selectBestRuns(bestWithUpdate),
  };
  // 엔들리스 추가 층수만큼 강화석 지급
  const shardResult = addShards(calculateShardReward(
    Math.max(0, floor - target.floor),
    false,
    target.isDaily,
  ));
  return saveMeta(next) && shardResult.saved;
}
