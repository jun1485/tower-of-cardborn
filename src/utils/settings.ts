// 게임 설정 localStorage 저장/복원

import type { Language } from '../i18n/types';

const SETTINGS_KEY = 'tower-of-cardborn-settings';

export interface GameSettings {
  readonly bgmVolume: number;
  readonly sfxVolume: number;
  readonly confirmOnExit: boolean;
  readonly language: Language;
}

// 기본 설정값 반환
function getDefaultSettings(): GameSettings {
  return { bgmVolume: 80, sfxVolume: 80, confirmOnExit: true, language: 'ko' };
}

// 설정 불러오기
export function loadSettings(): GameSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return getDefaultSettings();
  try {
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    const defaults = getDefaultSettings();
    const validLangs: Language[] = ['ko', 'en', 'zh'];
    return {
      bgmVolume: typeof parsed.bgmVolume === 'number' ? parsed.bgmVolume : defaults.bgmVolume,
      sfxVolume: typeof parsed.sfxVolume === 'number' ? parsed.sfxVolume : defaults.sfxVolume,
      confirmOnExit: typeof parsed.confirmOnExit === 'boolean' ? parsed.confirmOnExit : defaults.confirmOnExit,
      language: validLangs.includes(parsed.language as Language) ? parsed.language as Language : defaults.language,
    };
  } catch {
    return getDefaultSettings();
  }
}

// 설정 저장
export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// 설정 초기화
export function resetSettings(): void {
  localStorage.removeItem(SETTINGS_KEY);
}
