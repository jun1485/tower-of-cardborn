// 데미지/방어 플로팅 숫자 컴포넌트 (자동 소멸)

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (mode === 'hp') {
      if (previousValue === currentValue) return;
      const hpDiff = currentValue - previousValue;
      const entry: FloatingEntry = {
        id: nextId++,
        value: Math.abs(hpDiff),
        type: hpDiff > 0 ? 'heal' : 'damage',
      };
      setEntries((prev) => [...prev, entry]);

      const timer = setTimeout(() => {
        setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      }, 800);
      return () => clearTimeout(timer);
    }

    const diff = previousValue - currentValue;
    if (diff <= 0) return;

    const entry: FloatingEntry = { id: nextId++, value: diff, type: mode };
    setEntries((prev) => [...prev, entry]);

    const timer = setTimeout(() => {
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    }, 800);

    return () => clearTimeout(timer);
  }, [currentValue, previousValue, mode]);

  return (
    <div className={styles.floatingContainer}>
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

