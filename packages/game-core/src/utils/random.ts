// 셔플/랜덤 유틸리티

export type RandomSource = () => number;

let randomSource: RandomSource = Math.random;
let seededState: number | null = null;

/** 게임 난수 생성 */
export function random(): number {
  return randomSource();
}

/** 게임 난수 소스 교체 */
export function setRandomSource(source: RandomSource): void {
  seededState = null;
  randomSource = source;
}

/** 게임 난수 소스 초기화 */
export function resetRandomSource(): void {
  seededState = null;
  randomSource = Math.random;
}

/** 런 시드 난수 소스 설정 */
export function setRandomSeed(seed: number): void {
  seededState = seed >>> 0;
  randomSource = () => {
    seededState = ((seededState ?? 0) + 0x6D2B79F5) >>> 0;
    let value = seededState;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

/** 런 난수 상태 조회 */
export function getRandomState(): number | null {
  return seededState;
}

/** 런 난수 상태 복원 */
export function restoreRandomState(state: number | null): void {
  if (state === null) resetRandomSource();
  else setRandomSeed(state);
}

/** 새 런 시드 생성 */
export function generateRandomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

/** UTC 날짜별 일일 도전 시드 생성 */
export function getDailySeed(date = new Date()): number {
  const dateNumber = date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
  return (dateNumber ^ 0xC4A2B07) >>> 0;
}

/** 시드 기반 난수 소스 생성 */
export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates 셔플 (불변 배열 반환) */
export function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 고유 인스턴스 ID 생성 */
export function generateId(): string {
  return crypto.randomUUID();
}
