// 예기치 못한 렌더링 오류 복구 화면

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { clearSave } from '../../utils/storage';

interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  /** 오류 복구 화면 전환 */
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  /** 예기치 못한 오류 기록 */
  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('예기치 못한 게임 오류가 발생했습니다.', error, info);
  }

  /** 저장 데이터 삭제 후 재시작 (세이브 유발 반복 크래시 탈출) */
  handleResetAndReload = (): void => {
    clearSave();
    window.location.reload();
  };

  /** 게임 또는 오류 복구 화면 표시 */
  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    const lang = document.documentElement.lang;
    const title = lang.startsWith('ko')
      ? '게임을 표시하는 중 문제가 발생했습니다.'
      : lang.startsWith('zh') ? '游戏显示时发生意外错误。' : 'The game encountered an unexpected error.';
    const action = lang.startsWith('ko') ? '다시 불러오기' : lang.startsWith('zh') ? '重新加载' : 'Reload';
    const resetAction = lang.startsWith('ko')
      ? '저장 삭제 후 재시작'
      : lang.startsWith('zh') ? '删除存档后重启' : 'Delete save and restart';

    return (
      <main className="error-fallback" role="alert">
        <h1>{title}</h1>
        <button type="button" onClick={() => window.location.reload()}>{action}</button>
        <button type="button" onClick={this.handleResetAndReload}>{resetAction}</button>
      </main>
    );
  }
}
