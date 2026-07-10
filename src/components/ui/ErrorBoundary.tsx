// 예기치 못한 렌더링 오류 복구 화면

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

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

  /** 게임 또는 오류 복구 화면 표시 */
  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    const lang = document.documentElement.lang;
    const title = lang.startsWith('ko')
      ? '게임을 표시하는 중 문제가 발생했습니다.'
      : lang.startsWith('zh') ? '游戏显示时发生意外错误。' : 'The game encountered an unexpected error.';
    const action = lang.startsWith('ko') ? '다시 불러오기' : lang.startsWith('zh') ? '重新加载' : 'Reload';

    return (
      <main className="error-fallback" role="alert">
        <h1>{title}</h1>
        <button type="button" onClick={() => window.location.reload()}>{action}</button>
      </main>
    );
  }
}
