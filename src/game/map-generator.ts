// 맵 생성: 10층 단일 맵 구조 (일반전투 / 엘리트 / 휴식 / 보스)

import type { GameMap, MapNode, NodeType } from '../types/map';
import { NORMAL_ENCOUNTERS, ELITE_ENCOUNTERS, BOSS_ENCOUNTERS } from '../data/enemies';
import { generateId } from '../utils/random';

export const FLOORS_PER_MAP = 10;
export const DEFAULT_TOTAL_MAPS = 3;

/** 층별 노드 타입 결정 규칙 */
function getNodeType(floor: number): NodeType {
  if (floor === FLOORS_PER_MAP) return 'boss';
  if (floor === 5) return 'elite';
  if (floor === 7) return 'rest';
  return 'combat';
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
      return [];
  }
}

/** 10층 직선 맵 생성 */
export function generateMap(mapIndex = 1, totalMaps = DEFAULT_TOTAL_MAPS): GameMap {
  const ids = Array.from({ length: FLOORS_PER_MAP }, () => generateId());

  const nodes: MapNode[] = ids.map((id, i) => {
    const floor = i + 1;
    const type = getNodeType(floor);
    return {
      id,
      floor,
      type,
      nextNodeIds: i < FLOORS_PER_MAP - 1 ? [ids[i + 1]] : [],
      enemyIds: pickEnemies(type, mapIndex, floor),
    };
  });

  return {
    nodes,
    currentNodeId: null,
    visitedNodeIds: [],
    mapIndex,
    totalMaps,
    totalFloorsPerMap: FLOORS_PER_MAP,
  };
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
