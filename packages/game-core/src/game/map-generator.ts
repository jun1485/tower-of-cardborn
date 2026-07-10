// 맵 생성: 층당 2~3갈래 분기 맵 구조 (전투 / 엘리트 / 휴식 / 상점 / 보스)

import type { GameMap, MapNode, NodeType } from '../types/map';
import { NORMAL_ENCOUNTERS, ELITE_ENCOUNTERS, BOSS_ENCOUNTERS } from '../data/enemies';
import { generateId } from '../utils/random';

export const FLOORS_PER_MAP = 10;
export const DEFAULT_TOTAL_MAPS = 3;

const ELITE_FLOOR = 5;
const SHOP_FLOOR = 6;
const MID_REST_FLOOR = 3;
const PRE_BOSS_REST_FLOOR = FLOORS_PER_MAP - 1;

/** 이벤트 배치 후보 층 (특수층 3/5/6/9/10 비겹침) */
const EVENT_CANDIDATE_FLOORS: readonly number[] = [2, 4, 7, 8];
const EVENT_CHANCE = 0.4;
const MAX_EVENTS_PER_MAP = 3;
const FORCED_EVENT_FLOOR = 7;

/** 층별 노드 개수 결정 */
function getFloorNodeCount(floor: number): number {
  if (floor === FLOORS_PER_MAP) return 1;
  if (floor === 1 || floor === PRE_BOSS_REST_FLOOR) return 2;
  return 2 + Math.floor(Math.random() * 2);
}

/** 층별 노드 타입 배열 결정 */
function getFloorNodeTypes(floor: number, count: number): NodeType[] {
  if (floor === FLOORS_PER_MAP) return ['boss'];
  if (floor === PRE_BOSS_REST_FLOOR) return Array.from({ length: count }, () => 'rest');

  const types: NodeType[] = Array.from({ length: count }, () => 'combat');
  const specialIndex = Math.floor(Math.random() * count);

  // 특수 층: 엘리트 1개 보장(추가 확률), 상점 1개 보장, 중반 휴식 1개 보장
  if (floor === ELITE_FLOOR) {
    types[specialIndex] = 'elite';
    for (let i = 0; i < count; i++) {
      if (i !== specialIndex && Math.random() < 0.4) types[i] = 'elite';
    }
  } else if (floor === SHOP_FLOOR) {
    types[specialIndex] = 'shop';
  } else if (floor === MID_REST_FLOOR) {
    types[specialIndex] = 'rest';
  }

  return types;
}

/** 노드 타입 기반 적 목록 선택 */
function pickEnemies(type: NodeType, mapIndex: number, floor: number): string[] {
  const progressionFloor = (mapIndex - 1) * FLOORS_PER_MAP + floor;
  switch (type) {
    case 'combat': {
      const pool = NORMAL_ENCOUNTERS;
      const maxGroupSize = progressionFloor >= 10 ? 3 : progressionFloor >= 4 ? 2 : 1;
      const sizedPool = pool.filter((encounter) => encounter.length <= maxGroupSize);
      const targetPool = sizedPool.length > 0 ? sizedPool : pool;
      return [...targetPool[Math.floor(Math.random() * targetPool.length)]];
    }
    case 'elite': {
      const pool = ELITE_ENCOUNTERS;
      return [...pool[Math.floor(Math.random() * pool.length)]];
    }
    case 'boss': {
      const pool = BOSS_ENCOUNTERS;
      return [...pool[Math.floor(Math.random() * pool.length)]];
    }
    case 'rest':
    case 'shop':
    case 'event':
      return [];
  }
}

/** 간선 (i→j)와 기존 간선들의 X자 교차 여부 판정 */
function crossesAny(linkSets: readonly Set<number>[], i: number, j: number): boolean {
  return linkSets.some((set, i2) =>
    i2 !== i && [...set].some((j2) => (i - i2) * (j - j2) < 0),
  );
}

/** 층 간 연결 생성 (교차 없는 인덱스 비례 매핑 + 도달 불가 노드 보정) */
function connectFloors(current: MapNode[], next: MapNode[]): MapNode[] {
  const n = current.length;
  const m = next.length;
  const linkSets: Set<number>[] = current.map(() => new Set<number>());

  for (let i = 0; i < n; i++) {
    const primary = n === 1 ? 0 : Math.round((i * (m - 1)) / (n - 1));
    linkSets[i].add(primary);
  }

  // 인접 노드 추가 연결로 경로 선택지 확장 (교차 간선 제외)
  for (let i = 0; i < n; i++) {
    if (Math.random() >= 0.4) continue;
    const primary = n === 1 ? 0 : Math.round((i * (m - 1)) / (n - 1));
    const alt = primary + (Math.random() < 0.5 ? -1 : 1);
    if (alt >= 0 && alt < m && !crossesAny(linkSets, i, alt)) linkSets[i].add(alt);
  }

  // 들어오는 연결이 없는 다음 층 노드 → 가장 가까운 현재 층 노드에서 연결
  for (let j = 0; j < m; j++) {
    const reachable = linkSets.some((set) => set.has(j));
    if (!reachable) {
      const nearest = m === 1 ? 0 : Math.round((j * (n - 1)) / (m - 1));
      linkSets[nearest].add(j);
    }
  }

  return current.map((node, i) => ({
    ...node,
    nextNodeIds: [...linkSets[i]].sort((a, b) => a - b).map((j) => next[j].id),
  }));
}

/** 10층 분기 맵 생성 */
export function generateMap(mapIndex = 1, totalMaps = DEFAULT_TOTAL_MAPS): GameMap {
  // 층별 노드 생성 (후보 층 확률 이벤트 배치, 맵당 상한 적용)
  const floorNodes: MapNode[][] = [];
  let eventCount = 0;
  for (let floor = 1; floor <= FLOORS_PER_MAP; floor++) {
    const count = getFloorNodeCount(floor);
    const types = getFloorNodeTypes(floor, count);
    if (EVENT_CANDIDATE_FLOORS.includes(floor) && eventCount < MAX_EVENTS_PER_MAP && Math.random() < EVENT_CHANCE) {
      types[Math.floor(Math.random() * count)] = 'event';
      eventCount++;
    }
    const nodes: MapNode[] = types.map((type, i) => ({
      id: generateId(),
      floor,
      pos: count === 1 ? 0.5 : (i + 1) / (count + 1),
      type,
      nextNodeIds: [],
      enemyIds: pickEnemies(type, mapIndex, floor),
    }));
    floorNodes.push(nodes);
  }

  // 이벤트 미배치 맵 보정: 강제 배치 층 노드 1개 치환
  if (eventCount === 0) {
    const forcedFloor = floorNodes[FORCED_EVENT_FLOOR - 1];
    const idx = Math.floor(Math.random() * forcedFloor.length);
    forcedFloor[idx] = { ...forcedFloor[idx], type: 'event', enemyIds: [] };
  }

  // 층 간 연결
  for (let i = 0; i < floorNodes.length - 1; i++) {
    floorNodes[i] = connectFloors(floorNodes[i], floorNodes[i + 1]);
  }

  return {
    nodes: floorNodes.flat(),
    currentNodeId: null,
    visitedNodeIds: [],
    mapIndex,
    totalMaps,
    totalFloorsPerMap: FLOORS_PER_MAP,
  };
}

/** 런 통산 도달 층 산출 */
export function getFloorsClimbed(map: GameMap | null): number {
  return map ? (map.mapIndex - 1) * map.totalFloorsPerMap + map.visitedNodeIds.length : 0;
}

/** 현재 선택 가능한 노드 ID 목록 */
export function getAvailableNodeIds(map: GameMap): string[] {
  if (!map.currentNodeId) {
    return map.nodes.filter((node) => node.floor === 1).map((node) => node.id);
  }
  const current = map.nodes.find((node) => node.id === map.currentNodeId);
  if (!current) return [];
  return [...current.nextNodeIds];
}
