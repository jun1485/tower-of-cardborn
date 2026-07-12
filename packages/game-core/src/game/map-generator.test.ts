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

  it('4층에 보물 상자 노드를 1개 배치한다', () => {
    setRandomSource(createSeededRandom(300));
    const map = generateMap();
    const treasureNodes = map.nodes.filter((node) => node.type === 'treasure');

    expect(treasureNodes).toHaveLength(1);
    expect(treasureNodes[0].floor).toBe(4);
    expect(treasureNodes[0].enemyIds).toHaveLength(0);
  });

  it('첫 진입과 현재 노드의 다음 경로만 활성화한다', () => {
    setRandomSource(createSeededRandom(300));
    const map = generateMap();
    const firstFloorIds = map.nodes.filter((node) => node.floor === 1).map((node) => node.id);
    const currentNode = map.nodes.find((node) => node.floor === 1);

    expect(getAvailableNodeIds(map)).toEqual(firstFloorIds);
    expect(getAvailableNodeIds({ ...map, currentNodeId: currentNode?.id ?? null })).toEqual(currentNode?.nextNodeIds);
  });

  it('액트별 고유 보스를 배치한다', () => {
    setRandomSource(createSeededRandom(400));
    const secondBoss = generateMap(2).nodes.find((node) => node.type === 'boss');
    const thirdBoss = generateMap(3).nodes.find((node) => node.type === 'boss');

    expect(secondBoss?.enemyIds).toEqual(['stone_guardian']);
    expect(thirdBoss?.enemyIds).toEqual(['tower_heart']);
  });

  it('2·3액트 일반 전투에 액트 전용 적을 배치한다', () => {
    setRandomSource(createSeededRandom(500));
    const secondMap = generateMap(2);
    const thirdMap = generateMap(3);
    const secondEnemies = secondMap.nodes.filter((node) => node.type === 'combat').flatMap((node) => node.enemyIds);
    const thirdEnemies = thirdMap.nodes.filter((node) => node.type === 'combat').flatMap((node) => node.enemyIds);

    expect(secondEnemies).toContain('stone_sentinel');
    expect(thirdEnemies).toContain('void_wisp');
  });

  it('2·3액트 엘리트 노드에 액트 전용 풀의 적을 배치한다', () => {
    setRandomSource(createSeededRandom(600));
    const secondElite = generateMap(2).nodes.find((node) => node.type === 'elite');
    const thirdElite = generateMap(3).nodes.find((node) => node.type === 'elite');

    expect(['arcane_golem', 'obsidian_knight']).toContain(secondElite?.enemyIds[0]);
    expect(['void_reaper', 'plague_herald']).toContain(thirdElite?.enemyIds[0]);
  });
});
