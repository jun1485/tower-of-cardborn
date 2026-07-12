// 포션 보상 규칙 검증

import { afterEach, describe, expect, it } from 'vitest';
import { resetRandomSource, setRandomSource } from '../utils/random';
import { MAX_POTION_SLOTS, rollPotionReward } from './potions';

afterEach(() => {
  resetRandomSource();
});

describe('포션 보상', () => {
  it('빈 슬롯에 시드 기반 포션을 지급한다', () => {
    setRandomSource(() => 0);

    expect(rollPotionReward('combat', 0)).toBe('healing_potion');
  });

  it('보스전과 가득 찬 인벤토리에는 지급하지 않는다', () => {
    expect(rollPotionReward('boss', 0)).toBeNull();
    expect(rollPotionReward('combat', MAX_POTION_SLOTS)).toBeNull();
  });
});
