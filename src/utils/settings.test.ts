// 게임 설정 정규화와 저장 실패 처리 검증

import { beforeEach, describe, expect, it } from 'vitest';
import { loadSettings, resetSettings, saveSettings } from './settings';

const values = new Map<string, string>();
const storage: Storage = {
  get length() { return values.size; },
  clear: () => values.clear(),
  getItem: (key) => values.get(key) ?? null,
  key: (index) => [...values.keys()][index] ?? null,
  removeItem: (key) => values.delete(key),
  setItem: (key, value) => values.set(key, value),
};

beforeEach(() => {
  values.clear();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
});

describe('게임 설정', () => {
  it('기본 음악과 효과음 볼륨을 반환한다', () => {
    expect(loadSettings()).toMatchObject({ musicVolume: 30, sfxVolume: 80 });
  });

  it('구버전 설정에 음악 볼륨 기본값을 보완한다', () => {
    localStorage.setItem('tower-of-cardborn-settings', JSON.stringify({ sfxVolume: 55, language: 'en' }));

    expect(loadSettings()).toMatchObject({ musicVolume: 30, sfxVolume: 55, language: 'en' });
  });

  it('볼륨 범위를 0에서 100 사이로 제한한다', () => {
    localStorage.setItem('tower-of-cardborn-settings', JSON.stringify({ musicVolume: 140, sfxVolume: -20 }));

    expect(loadSettings()).toMatchObject({ musicVolume: 100, sfxVolume: 0 });
  });

  it('설정 저장과 초기화를 반영한다', () => {
    expect(saveSettings({ musicVolume: 45, sfxVolume: 60, confirmOnExit: false, language: 'zh' })).toBe(true);
    expect(loadSettings()).toMatchObject({ musicVolume: 45, sfxVolume: 60, confirmOnExit: false, language: 'zh' });
    expect(resetSettings()).toBe(true);
    expect(loadSettings()).toMatchObject({ musicVolume: 30, sfxVolume: 80 });
  });
});
