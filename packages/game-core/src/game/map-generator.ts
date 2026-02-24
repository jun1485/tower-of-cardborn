// 맵 생성: 15층 구조 (일반전투 / 엘리트 / 휴식 / 보스)

import type { GameMap, MapNode, NodeType } from '../types/map';
import { NORMAL_ENCOUNTERS, ELITE_ENCOUNTERS, BOSS_ENCOUNTERS } from '../data/enemies';
import { generateId } from '../utils/random';

const TOTAL_FLOORS = 15;

/** 층별 노드 타입 결정 규칙 */
function getNodeType(floor: number): NodeType {
  if (floor === TOTAL_FLOORS) return 'boss';
  if (floor === 1) return 'combat';
  // 7층, 12층: 휴식
  if (floor === 7 || floor === 12) return 'rest';
  // 5층, 10층: 엘리트
  if (floor === 5 || floor === 10) return 'elite';
  return 'combat';
}

/** 노드 타입에 맞는 적 ID 목록 선택 */
function pickEnemies(type: NodeType, floor: number): string[] {
  switch (type) {
    case 'combat': {
      const pool = NORMAL_ENCOUNTERS;
      const maxGroupSize = floor >= 10 ? 3 : floor >= 4 ? 2 : 1;
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

/** 1~15층 직선 맵 생성 */
export function generateMap(): GameMap {
  // ID를 미리 생성하여 nextNodeIds 연결에 사용
  const ids = Array.from({ length: TOTAL_FLOORS }, () => generateId());

  const nodes: MapNode[] = ids.map((id, i) => {
    const floor = i + 1;
    const type = getNodeType(floor);
    return {
      id,
      floor,
      type,
      nextNodeIds: i < TOTAL_FLOORS - 1 ? [ids[i + 1]] : [],
      enemyIds: pickEnemies(type, floor),
    };
  });

  return {
    nodes,
    currentNodeId: null,
    visitedNodeIds: [],
    totalFloors: TOTAL_FLOORS,
  };
}

/** 현재 선택 가능한 노드 ID 목록 */
export function getAvailableNodeIds(map: GameMap): string[] {
  // 첫 진입: 1층 노드만 선택 가능
  if (!map.currentNodeId) {
    return map.nodes.filter((n) => n.floor === 1).map((n) => n.id);
  }
  const current = map.nodes.find((n) => n.id === map.currentNodeId);
  if (!current) return [];
  return [...current.nextNodeIds];
}
