// 이전 렌더의 값을 추적하는 hook

import { useEffect, useRef } from 'react';

export function usePrevious<T>(value: T): T {
  const ref = useRef<T>(value);
  useEffect(() => {
    ref.current = value;
  });
  // 이전 렌더 값 노출이 목적인 의도된 렌더 중 ref 조회
  // eslint-disable-next-line react-hooks/refs
  return ref.current;
}
