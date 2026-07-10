// 게임 설정 localStorage 저장/복원

import type { Language } from '../i18n/types';

const SETTINGS_KEY = 'tower-of-cardborn-settings';

export interface GameSettings {
  readonly sfxVolume: number;
  readonly confirmOnExit: boolean;
  readonly language: Language;
}

// 기본 설정값 반환
function getDefaultSettings(): GameSettings {
  return { sfxVolume: 80, confirmOnExit: true, language: 'ko' };
}

/** 볼륨 범위 정규화 */
function normalizeVolume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(100, value))
    : fallback;
}

// 설정 불러오기
export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return getDefaultSettings();
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    const defaults = getDefaultSettings();
    return {
      sfxVolume: normalizeVolume(parsed.sfxVolume, defaults.sfxVolume),
      confirmOnExit: typeof parsed.confirmOnExit === 'boolean' ? parsed.confirmOnExit : defaults.confirmOnExit,
      language: parsed.language === 'ko' || parsed.language === 'en' || parsed.language === 'zh'
        ? parsed.language
        : defaults.language,
    };
  } catch {
    return getDefaultSettings();
  }
}

/** 게임 설정 저장 */
export function saveSettings(settings: GameSettings): boolean {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    console.error('게임 설정을 저장하지 못했습니다.');
    return false;
  }
}

/** 게임 설정 초기화 */
export function resetSettings(): boolean {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    return true;
  } catch {
    console.error('게임 설정을 초기화하지 못했습니다.');
    return false;
  }
}
