// 셔플/랜덤 유틸리티

/** Fisher-Yates 셔플 (불변 배열 반환) */
export function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 고유 인스턴스 ID 생성 */
export function generateId(): string {
  return crypto.randomUUID();
}
