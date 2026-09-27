// 데미지/방어 플로팅 숫자 컴포넌트 (자동 소멸)

import { useEffect, useRef, useState } from 'react';
import styles from '../../styles/combat.module.css';

interface FloatingEntry {
  readonly id: number;
  readonly value: number;
  readonly type: 'damage' | 'block' | 'heal';
}

interface FloatingNumberProps {
  /** 변경 감지용 트리거값 (HP, block 등) */
  readonly currentValue: number;
  readonly previousValue: number;
  readonly mode: 'damage' | 'block' | 'hp';
}

let nextId = 0;

function resolveFloatingClass(type: FloatingEntry['type']): string {
  if (type === 'damage') return styles.floatingDamage;
  if (type === 'heal') return styles.floatingHeal;
  return styles.floatingBlock;
}

export function FloatingNumber({ currentValue, previousValue, mode }: FloatingNumberProps) {
  const [entries, setEntries] = useState<FloatingEntry[]>([]);
  // 엔트리별 소멸 타이머 (무관한 리렌더에 취소되지 않도록 언마운트 시에만 정리)
  const timersRef = useRef(new Set<number>());

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    const diff = mode === 'hp' ? currentValue - previousValue : previousValue - currentValue;
    if (mode === 'hp' ? diff === 0 : diff <= 0) return;

    const entry: FloatingEntry = {
      id: nextId++,
      value: Math.abs(diff),
      type: mode === 'hp' ? (diff > 0 ? 'heal' : 'damage') : mode,
    };
    setEntries((prev) => [...prev, entry]);

    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    }, 800);
    timersRef.current.add(timer);
  }, [currentValue, previousValue, mode]);

  return (
    <div className={styles.floatingContainer} aria-hidden="true">
      {entries.map((entry) => (
        <span
          key={entry.id}
          className={`${styles.floatingNumber} ${resolveFloatingClass(entry.type)}`}
        >
          {entry.type === 'damage' ? `-${entry.value}` : `+${entry.value}`}
        </span>
      ))}
    </div>
  );
}

