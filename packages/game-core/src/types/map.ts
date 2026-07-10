// 맵 시스템 타입 정의

export type NodeType = 'combat' | 'elite' | 'rest' | 'shop' | 'event' | 'boss';

export interface MapNode {
  readonly id: string;
  readonly floor: number;
  /** 층 내 가로 위치 비율 (0~1, 렌더링용) */
  readonly pos: number;
  readonly type: NodeType;
  /** 이 노드에서 이동 가능한 다음 노드 ID */
  readonly nextNodeIds: readonly string[];
  /** 전투 노드일 경우 적 ID 목록 */
  readonly enemyIds: readonly string[];
}

export interface GameMap {
  readonly nodes: readonly MapNode[];
  readonly currentNodeId: string | null;
  readonly visitedNodeIds: readonly string[];
  readonly mapIndex: number;
  readonly totalMaps: number;
  readonly totalFloorsPerMap: number;
}
