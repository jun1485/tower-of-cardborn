// 맵 화면: 층별 노드 표시 + 다음 노드 선택

import type { GameMap, MapNode, NodeType } from '@tower-of-cardborn/game-core/types/map';
import { getAvailableNodeIds } from '@tower-of-cardborn/game-core/game/map-generator';
import styles from '../../styles/map.module.css';

interface MapScreenProps {
  readonly map: GameMap;
  readonly playerHp: number;
  readonly playerMaxHp: number;
  readonly deckSize: number;
  readonly onSelectNode: (nodeId: string) => void;
}

const NODE_ICON: Record<NodeType, string> = {
  combat: '⚔️',
  elite: '🔥',
  rest: '🏕️',
  boss: '💀',
};

const NODE_LABEL: Record<NodeType, string> = {
  combat: '전투',
  elite: '엘리트',
  rest: '휴식',
  boss: '보스',
};

export function MapScreen({ map, playerHp, playerMaxHp, deckSize, onSelectNode }: MapScreenProps) {
  const availableIds = getAvailableNodeIds(map);

  return (
    <div className={styles.mapScreen}>
      <div className={styles.mapHeader}>
        <span className={styles.headerStat}>❤️ {playerHp}/{playerMaxHp}</span>
        <span className={styles.headerStat}>
          <img className={styles.headerIcon} src="/assets/ui/deck.png" alt="덱" />
          덱 {deckSize}장
        </span>
      </div>

      <div className={styles.mapContainer}>
        {map.nodes.map((node) => {
          const isAvailable = availableIds.includes(node.id);
          const isVisited = map.visitedNodeIds.includes(node.id);
          const isCurrent = map.currentNodeId === node.id;

          return (
            <MapNodeButton
              key={node.id}
              node={node}
              isAvailable={isAvailable}
              isVisited={isVisited}
              isCurrent={isCurrent}
              onSelect={onSelectNode}
            />
          );
        })}
      </div>
    </div>
  );
}

interface MapNodeButtonProps {
  readonly node: MapNode;
  readonly isAvailable: boolean;
  readonly isVisited: boolean;
  readonly isCurrent: boolean;
  readonly onSelect: (nodeId: string) => void;
}

function MapNodeButton({ node, isAvailable, isVisited, isCurrent, onSelect }: MapNodeButtonProps) {
  const stateClass = isCurrent
    ? styles.nodeCurrent
    : isAvailable
      ? styles.nodeAvailable
      : isVisited
        ? styles.nodeVisited
        : styles.nodeLocked;

  return (
    <button
      className={`${styles.mapNode} ${stateClass}`}
      disabled={!isAvailable}
      onClick={() => onSelect(node.id)}
    >
      <span className={styles.nodeFloor}>{node.floor}F</span>
      <span className={styles.nodeIcon}>{NODE_ICON[node.type]}</span>
      <span className={styles.nodeLabel}>{NODE_LABEL[node.type]}</span>
    </button>
  );
}
