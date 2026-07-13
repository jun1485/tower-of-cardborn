// 맵 화면: 분기 그래프 렌더 + 다음 노드 선택

import { useEffect, useMemo, useRef } from 'react';
import type { GameMap, MapNode, NodeType } from '@tower-of-cardborn/game-core/types/map';
import { getAvailableNodeIds } from '@tower-of-cardborn/game-core/game/map-generator';
import { useLanguage, useTranslation } from '../../i18n';
import { RELIC_DEFINITIONS } from '@tower-of-cardborn/game-core/data/relics';
import type { RelicId } from '@tower-of-cardborn/game-core/types/relic';
import { getRelicName } from '../../i18n/relic-text';
import { POTION_DEFINITIONS } from '@tower-of-cardborn/game-core/data/potions';
import type { PotionId } from '@tower-of-cardborn/game-core/types/potion';
import { getPotionName } from '../../i18n/potion-text';
import styles from '../../styles/map.module.css';

interface MapScreenProps {
  readonly map: GameMap;
  readonly playerHp: number;
  readonly playerMaxHp: number;
  readonly deck: readonly string[];
  readonly relics: readonly RelicId[];
  readonly potions: readonly PotionId[];
  readonly gold: number;
  readonly ascension: number;
  readonly runSeed: number | null;
  readonly onSelectNode: (nodeId: string) => void;
  readonly onOpenDeck: () => void;
  readonly onOpenRelics: () => void;
  readonly onOpenPotions: () => void;
}

const NODE_ICON: Record<NodeType, string> = {
  combat: '⚔️',
  elite: '🔥',
  rest: '🏕️',
  shop: '🛒',
  event: '❓',
  boss: '💀',
  treasure: '🎁',
};

const NODE_LABEL_KEY: Record<NodeType, 'nodecombat' | 'nodeElite' | 'nodeRest' | 'nodeShop' | 'nodeEvent' | 'nodeBoss' | 'nodeTreasure'> = {
  combat: 'nodecombat',
  elite: 'nodeElite',
  rest: 'nodeRest',
  shop: 'nodeShop',
  event: 'nodeEvent',
  boss: 'nodeBoss',
  treasure: 'nodeTreasure',
};

/** 층 높이(rem)·그래프 좌표 상수 */
const FLOOR_ROW_REM = 5.5;

interface MapEdge {
  readonly from: MapNode;
  readonly to: MapNode;
}

/** 노드 중심 SVG 좌표 산출 (viewBox 0 0 100 100 기준) */
function getNodeCoords(node: MapNode, floors: number): { x: number; y: number } {
  return {
    x: node.pos * 100,
    y: 100 - ((node.floor - 0.5) / floors) * 100,
  };
}

export function MapScreen({ map, playerHp, playerMaxHp, deck, relics, potions, gold, ascension, runSeed, onSelectNode, onOpenDeck, onOpenRelics, onOpenPotions }: MapScreenProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const availableIds = getAvailableNodeIds(map);
  const themeIndex = (map.mapIndex - 1) % 3;
  const mapThemeClass = [styles.mapTheme1, styles.mapTheme2, styles.mapTheme3][themeIndex] ?? styles.mapTheme1;
  const containerRef = useRef<HTMLDivElement>(null);
  const floors = map.totalFloorsPerMap;

  // 간선 목록 파생
  const edges = useMemo<MapEdge[]>(() => {
    const nodeById = new Map(map.nodes.map((node) => [node.id, node]));
    return map.nodes.flatMap((node) =>
      node.nextNodeIds
        .map((nextId) => nodeById.get(nextId))
        .filter((next): next is MapNode => !!next)
        .map((next) => ({ from: node, to: next })),
    );
  }, [map.nodes]);

  // 맵 진입 시 선택 가능 노드 위치로 자동 스크롤
  useEffect(() => {
    const target = containerRef.current?.querySelector('[data-focus-node]');
    target?.scrollIntoView({ block: 'center' });
  }, [map.currentNodeId]);

  /** 간선 상태 클래스 결정 */
  const getEdgeClass = (edge: MapEdge): string => {
    const fromIndex = map.visitedNodeIds.indexOf(edge.from.id);
    const toIndex = map.visitedNodeIds.indexOf(edge.to.id);
    if (fromIndex >= 0 && toIndex === fromIndex + 1) return styles.edgeTraveled;
    if (edge.from.id === map.currentNodeId && availableIds.includes(edge.to.id)) return styles.edgeActive;
    return styles.edge;
  };

  return (
    <div className={`${styles.mapScreen} ${mapThemeClass}`}>
      <div className={styles.mapHeader}>
        <span className={styles.headerStat}>❤️ {playerHp}/{playerMaxHp}</span>
        <span className={styles.headerStat}>💰 {gold}</span>
        {ascension > 0 && <span className={styles.headerStat}>⛰️ {t('ascensionLabel', ascension)}</span>}
        <span className={styles.headerStat}>🗺️ {t('mapLabel')} {map.mapIndex}/{map.totalMaps}</span>
        {runSeed !== null && <span className={styles.headerStat}>{t('runSeedLabel', runSeed)}</span>}
        <button className={`${styles.headerStat} ${styles.headerButton}`} onClick={onOpenDeck}>
          <img className={styles.headerIcon} src="/assets/ui/deck.png" alt="" />
          {t('deck')} {deck.length}{t('deckCount')}
        </button>
        {relics.length > 0 && (
          <button
            className={`${styles.headerStat} ${styles.headerButton}`}
            aria-label={`${t('relics')} ${relics.map((relicId) => getRelicName(relicId, lang)).join(', ')}`}
            onClick={onOpenRelics}
          >
            {relics.map((relicId) => (
              <span key={relicId} title={getRelicName(relicId, lang)} aria-hidden="true">
                {RELIC_DEFINITIONS[relicId].emoji}
              </span>
            ))}
          </button>
        )}
        {potions.length > 0 && (
          <button
            className={`${styles.headerStat} ${styles.headerButton}`}
            aria-label={`${t('potions')} ${potions.map((potionId) => getPotionName(potionId, lang)).join(', ')}`}
            onClick={onOpenPotions}
          >
            {potions.map((potionId, index) => (
              <span key={`${potionId}-${index}`} title={getPotionName(potionId, lang)} aria-hidden="true">
                {POTION_DEFINITIONS[potionId].emoji}
              </span>
            ))}
          </button>
        )}
      </div>

      <div className={styles.mapContainer} ref={containerRef}>
        <div className={styles.mapGraph} style={{ height: `calc(${floors} * max(72px, ${FLOOR_ROW_REM}rem))` }}>
          <svg className={styles.mapEdges} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {edges.map((edge) => {
              const from = getNodeCoords(edge.from, floors);
              const to = getNodeCoords(edge.to, floors);
              return (
                <line
                  key={`${edge.from.id}-${edge.to.id}`}
                  className={getEdgeClass(edge)}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          {Array.from({ length: floors }, (_, i) => (
            <span
              key={i}
              className={styles.floorTick}
              style={{ bottom: `${((i + 0.5) / floors) * 100}%` }}
            >
              {i + 1}{t('floor')}
            </span>
          ))}

          {map.nodes.map((node) => (
            <MapNodeButton
              key={node.id}
              node={node}
              floors={floors}
              isAvailable={availableIds.includes(node.id)}
              isVisited={map.visitedNodeIds.includes(node.id)}
              isCurrent={map.currentNodeId === node.id}
              onSelect={onSelectNode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface MapNodeButtonProps {
  readonly node: MapNode;
  readonly floors: number;
  readonly isAvailable: boolean;
  readonly isVisited: boolean;
  readonly isCurrent: boolean;
  readonly onSelect: (nodeId: string) => void;
}

function MapNodeButton({ node, floors, isAvailable, isVisited, isCurrent, onSelect }: MapNodeButtonProps) {
  const t = useTranslation();
  const stateClass = isCurrent
    ? styles.nodeCurrent
    : isAvailable
      ? styles.nodeAvailable
      : isVisited
        ? styles.nodeVisited
        : styles.nodeLocked;

  return (
    <button
      className={`${styles.graphNode} ${stateClass} ${node.type === 'boss' ? styles.bossNode : ''}`}
      style={{
        left: `${node.pos * 100}%`,
        bottom: `${((node.floor - 0.5) / floors) * 100}%`,
      }}
      disabled={!isAvailable}
      data-focus-node={isAvailable ? '' : undefined}
      aria-current={isCurrent ? 'location' : undefined}
      aria-label={`${t(NODE_LABEL_KEY[node.type])} · ${node.floor}${t('floor')}`}
      onClick={() => onSelect(node.id)}
    >
      <span className={styles.nodeCircle}>{NODE_ICON[node.type]}</span>
      <span className={styles.graphNodeLabel}>{t(NODE_LABEL_KEY[node.type])}</span>
    </button>
  );
}
