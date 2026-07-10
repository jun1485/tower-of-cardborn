// 맵 생성 구조 규칙 검증

import { afterEach, describe, expect, it } from 'vitest';
import { createSeededRandom, resetRandomSource, setRandomSource } from '../utils/random';
import { FLOORS_PER_MAP, generateMap, getAvailableNodeIds } from './map-generator';

afterEach(() => {
  resetRandomSource();
});

describe('맵 생성', () => {
  it('모든 층과 최종 보스 노드를 생성한다', () => {
    setRandomSource(createSeededRandom(100));
    const map = generateMap();

    for (let floor = 1; floor <= FLOORS_PER_MAP; floor++) {
      expect(map.nodes.some((node) => node.floor === floor)).toBe(true);
    }
    expect(map.nodes.filter((node) => node.floor === FLOORS_PER_MAP)).toHaveLength(1);
    expect(map.nodes.find((node) => node.floor === FLOORS_PER_MAP)?.type).toBe('boss');
  });

  it('모든 다음 층 노드에 진입 경로를 생성한다', () => {
    setRandomSource(createSeededRandom(200));
    const map = generateMap();
    const linkedNodeIds = new Set(map.nodes.flatMap((node) => node.nextNodeIds));

    expect(map.nodes.filter((node) => node.floor > 1).every((node) => linkedNodeIds.has(node.id))).toBe(true);
  });

  it('첫 진입과 현재 노드의 다음 경로만 활성화한다', () => {
    setRandomSource(createSeededRandom(300));
    const map = generateMap();
    const firstFloorIds = map.nodes.filter((node) => node.floor === 1).map((node) => node.id);
    const currentNode = map.nodes.find((node) => node.floor === 1);

    expect(getAvailableNodeIds(map)).toEqual(firstFloorIds);
    expect(getAvailableNodeIds({ ...map, currentNodeId: currentNode?.id ?? null })).toEqual(currentNode?.nextNodeIds);
  });

  it('2·3액트 보스전에 지원 몬스터를 추가한다', () => {
    setRandomSource(createSeededRandom(400));
    const secondBoss = generateMap(2).nodes.find((node) => node.type === 'boss');
    const thirdBoss = generateMap(3).nodes.find((node) => node.type === 'boss');

    expect(secondBoss?.enemyIds).toHaveLength(2);
    expect(thirdBoss?.enemyIds).toHaveLength(3);
  });
});
