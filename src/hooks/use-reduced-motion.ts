// 시스템·게임 설정 모션 최소화 연동

import { useEffect, useState } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const MOTION_ATTRIBUTE = 'data-reduced-motion';
const MOTION_SETTING_EVENT = 'tower-of-cardborn:motion-setting';

/** 시스템 또는 게임 설정 모션 최소화 여부 */
function isReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
    || document.documentElement.hasAttribute(MOTION_ATTRIBUTE);
}

/** 게임 설정 모션 최소화 적용 */
export function applyMotionSetting(enabled: boolean): void {
  document.documentElement.toggleAttribute(MOTION_ATTRIBUTE, enabled);
  window.dispatchEvent(new Event(MOTION_SETTING_EVENT));
}

/** 시스템·게임 설정 모션 최소화 상태 추적 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(isReducedMotion);

  useEffect(() => {
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const handleChange = () => setReducedMotion(isReducedMotion());
    mediaQuery.addEventListener('change', handleChange);
    window.addEventListener(MOTION_SETTING_EVENT, handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener(MOTION_SETTING_EVENT, handleChange);
    };
  }, []);

  return reducedMotion;
}
