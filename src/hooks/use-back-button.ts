// Android 뒤로가기 버튼 처리 (확인 다이얼로그 연동)

import { useCallback, useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import type { GameScreen } from '@tower-of-cardborn/game-core/types/game';
import { loadSettings } from '../utils/settings';

interface UseBackButtonParams {
  readonly screen: GameScreen;
  readonly goToTitle: () => void;
}

// Android 뒤로가기 버튼 리스너 등록 및 확인 다이얼로그 상태 관리
export function useBackButton({ screen, goToTitle }: UseBackButtonParams) {
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const listener = App.addListener('backButton', () => {
      const settings = loadSettings();

      if (screen === 'title') {
        if (settings.confirmOnExit) {
          setShowConfirm(true);
        } else {
          App.exitApp();
        }
        return;
      }

      if (settings.confirmOnExit) {
        setShowConfirm(true);
      } else {
        goToTitle();
      }
    });

    return () => {
      listener.then((handle) => handle.remove());
    };
  }, [screen, goToTitle]);

  // 확인 다이얼로그에서 확인 클릭
  const confirmBack = useCallback(() => {
    setShowConfirm(false);
    if (screen === 'title') {
      App.exitApp();
    } else {
      goToTitle();
    }
  }, [screen, goToTitle]);

  // 확인 다이얼로그에서 취소 클릭
  const cancelBack = useCallback(() => {
    setShowConfirm(false);
  }, []);

  return { showConfirm, confirmBack, cancelBack };
}
