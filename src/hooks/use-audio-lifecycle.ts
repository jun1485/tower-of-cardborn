// 앱 활성 상태별 오디오 제어

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { resumeAudioContext, suspendAudioContext } from '../utils/sound';

/** 앱 활성 상태 오디오 동기화 */
export function useAudioLifecycle(): void {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) suspendAudioContext();
      else resumeAudioContext();
    };
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) resumeAudioContext();
      else suspendAudioContext();
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void listener.then((handle) => handle.remove());
    };
  }, []);
}
