// SlopeChart.tsx
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  useItemDataStore,
  useSVMResultStore,
  useWeightPanelStore,
  useSharedConfigStore,
  useInfoPanelConfigStore,
  useCriteriaDataStore,
} from "@/lib/store";
import { aggregateScore } from "@/lib/svm";
import { eventTracker } from "@/lib/utils";

// Import subcomponents
import SankeyPath from "./SankeyPath";
import ItemBar from "./ItemBar";
import ItemNode from "./ItemNode";
import Intersection from "./Intersection";
import Tooltip from "./Tooltip";
import ItemPopup from "../RankingPanel/ItemPopup";

// Import utilities
import { ChartScales } from "./ChartScales";
import { IntersectionDetector } from "./IntersectionDetector";
import {
  SlopeChartItem,
  Intersection as IntersectionType,
  HighlightedPair,
} from "@/lib/type";

interface SlopeChartProps {
  rankBy: string;
  weights: { [key: string]: number };
  className?: string;
}

const SlopeChart = ({ rankBy, weights, className = "" }: SlopeChartProps) => {
  const [clickedItem, setClickedItem] = useState<string | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [popupItem, setPopupItem] = useState<SlopeChartItem | null>(null);

  const {
    setInfoId,
    setIsInfoOpen,
    setCrossingPairs,
    setHighlightedPair,
    highlightedPair,
    setSelectedIDs,
  } = useInfoPanelConfigStore();
  const { criteriaData } = useCriteriaDataStore();

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const { rankItems } = useItemDataStore();
  const { svmScores } = useSVMResultStore();
  const { weightSort, weightSortState } = useWeightPanelStore();
  const { selectedItemID, setSelectedItemID, nameKey, imageKey, setConflictingIds } =
    useSharedConfigStore();

  const [higherGroup, setHigherGroup] = useState<number[]>([]);
  const [lowerGroup, setLowerGroup] = useState<number[]>([]);
  const [intersections, setIntersections] = useState<IntersectionType[]>([]);

  const toggleSelect = (id: number | null) => {
    setInfoId(id);
    setIsInfoOpen(true);
  };

  // Handle resize events to make the chart responsive
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    let resizeObserver: ResizeObserver;

    // Use ResizeObserver for more accurate dimension tracking
    if (containerRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          setDimensions({ width, height });
        }
      });

      resizeObserver.observe(containerRef.current);
    }

    // Fallback for initial render with slight delay
    const timeoutId = setTimeout(() => {
      updateDimensions();
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Process data and calculate ranks
  const data = useMemo(() => {
    // Create initial data array with all properties
    let _data;
    if (weights === weightSort) {
      _data = rankItems.map((item) => ({
        id: item.id.toString(),
        name: item[nameKey] as string,
        startRank: rankItems.indexOf(item) + 1,
        endRank: 0,
        startValue:
          rankBy === "aggregated score"
            ? aggregateScore(item).score
            : aggregateScore(item).weightedScores[rankBy],
        endValue:
          rankBy === "aggregated score"
            ? aggregateScore(item).score
            : aggregateScore(item).weightedScores[rankBy],
        rankChange: 0,
        image: imageKey && item[imageKey] ? (item[imageKey] as string) : "",
      }));
    } else {
      _data = rankItems.map((item) => ({
        id: item.id.toString(),
        name: item[nameKey] as string,
        startRank: rankItems.indexOf(item) + 1,
        endRank: 0,
        startValue:
          rankBy === "aggregated score"
            ? aggregateScore(item, weights).score
            : aggregateScore(item, weights).weightedScores[rankBy],
        endValue:
          rankBy === "aggregated score"
            ? aggregateScore(item, weights).score
            : aggregateScore(item, weights).weightedScores[rankBy],
        rankChange: 0,
        image: imageKey && item[imageKey] ? (item[imageKey] as string) : "",
      }));
    }

    const higherGroup: number[] = [];
    const lowerGroup: number[] = [];

    // Sort by endValue to determine endRank (higher value = better rank)
    // Use item ID as secondary sort to maintain stable sorting when endValues are equal
    const endSorted = [..._data].sort((a, b) => {
      const valueDiff = b.endValue - a.endValue;
      if (valueDiff !== 0) return valueDiff;
      // When endValues are equal, use item ID for consistent ordering
      return parseInt(a.id) - parseInt(b.id);
    });
    endSorted.forEach((item, index) => {
      const foundItem = _data.find((d) => d.id === item.id);
      if (foundItem) {
        foundItem.endRank = index + 1;
        // Calculate rankChange (positive means improved rank)
        foundItem.rankChange = -(foundItem.startRank - foundItem.endRank);

        if (foundItem.rankChange > 0) {
          higherGroup.push(parseInt(foundItem.id));
        } else if (foundItem.rankChange < 0) {
          lowerGroup.push(parseInt(foundItem.id));
        }
      }
    });

    setHigherGroup(higherGroup);
    setLowerGroup(lowerGroup);

    eventTracker({
      action: "track explanability",
      data: {
        data: _data,
        explanability: higherGroup.length + lowerGroup.length === 0,
      },
    });

    return _data;
  }, [rankItems, svmScores, weights, weightSortState, nameKey, rankBy]);

  // Update conflicting IDs when groups change
  useEffect(() => {
    setConflictingIds({
      higher: higherGroup,
      lower: lowerGroup,
    });
  }, [higherGroup, lowerGroup, setConflictingIds]);

  // Responsive chart dimensions
  const margin = { top: 100, right: 60, bottom: 110, left: 60 };

  // Calculate actual drawing area based on container size
  const width = Math.max(0, dimensions.width - margin.left - margin.right);
  const height = Math.max(0, dimensions.height - margin.top - margin.bottom);

  // Only render chart if we have dimensions and data
  const shouldRender = width > 0 && height > 0 && data.length > 0;

  // Create scales object for calculations
  const scales = useMemo(() => {
    return new ChartScales(width, height, data);
  }, [width, height, data]);

  // If nodes need more space than available, expand the SVG width
  const svgContentWidth = scales.requiredWidth > width
    ? scales.requiredWidth + margin.left + margin.right
    : dimensions.width;

  // Calculate max name length based on available space
  const maxNameLength = useMemo(() => {
    return scales.calculateMaxNameLength();
  }, [scales]);

  // Detect intersections between paths
  const detectIntersections = useCallback(() => {
    if (!data.length || width <= 0 || height <= 0) return;

    const detector = new IntersectionDetector(data, scales);
    const { intersections, crossingPairs } = detector.detectIntersections();

    setIntersections(intersections);
    setCrossingPairs(crossingPairs);
  }, [data, width, height, scales, setCrossingPairs]);

  // Calculate intersections when data or dimensions change
  useEffect(() => {
    detectIntersections();
  }, [detectIntersections]);

  // Handler function for clicking on intersections
  const handleIntersectionClick = (id1: string, id2: string) => {
    const item1 = data.find((item) => item.id === id1);
    const item2 = data.find((item) => item.id === id2);

    if (item1 && item2) {
      console.log(`Intersection between: ${item1.name} and ${item2.name}`);
      setSelectedIDs([parseInt(id1), parseInt(id2)]);
      setIsInfoOpen(true);
    }
  };

  // Handler for opening the popup when an item is clicked
  const handleItemClick = (id: string, event: React.MouseEvent) => {
    // First, find the item data
    const item = data.find((item) => item.id === id);
    if (!item) return;

    // Set position for the popup based on click coordinates
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get click coordinates
    let viewportX = event.clientX;
    let viewportY = event.clientY;

    // Adjust position to ensure popup stays in viewport
    // Keep some padding (160px = half of popup max width)
    const rightEdgePadding = 300;
    const bottomEdgePadding = 100;

    // Check right edge
    if (viewportX + rightEdgePadding > viewportWidth) {
      viewportX = viewportWidth - rightEdgePadding;
    }

    // Check left edge
    if (viewportX - rightEdgePadding < 0) {
      viewportX = rightEdgePadding;
    }

    // Check bottom edge
    if (viewportY + bottomEdgePadding > viewportHeight) {
      viewportY = viewportHeight - bottomEdgePadding;
    }

    // Check top edge
    if (viewportY - bottomEdgePadding < 0) {
      viewportY = bottomEdgePadding;
    }

    setPopupItem(item);
    setPopupPosition({
      x: viewportX,
      y: viewportY,
    });
    setPopupOpen(true);

    // Also update the clicked item state
    setClickedItem(id);
  };

  // Close the popup
  const closePopup = () => {
    setPopupOpen(false);
    setPopupItem(null);
  };

  return (
    <div
      ref={containerRef}
      className={`relative cursor-pointer bg-slate-50 w-full overflow-x-auto ${className}`}
    >
      {shouldRender && (
        <svg
          width={svgContentWidth}
          height={dimensions.height}
          viewBox={`0 0 ${svgContentWidth} ${dimensions.height}`}
        >
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Chart title labels for top and bottom sections */}
            <text
              x={-40}
              y={-85}
              textAnchor="start"
              fontSize={14}
              fontWeight="bold"
              fill="#333"
            >
              ⬇️ Manual Rank
            </text>
            <text
              x={-40}
              y={height + 103}
              textAnchor="start"
              fontSize={14}
              fontWeight="bold"
              fill="#333"
            >
              ⬆️ Explainable Rank
            </text>

            {/* Sankey-style paths connecting the positions */}
            {data.map((item, i) => (
              <SankeyPath
                key={`path-${i}`}
                item={item}
                xScale={scales.xScale}
                height={height}
                valueScale={scales.valueScale}
                selectedItemID={selectedItemID}
                highlightedPair={highlightedPair}
              />
            ))}

            {/* Intersection points between crossing paths */}
            {intersections.map((intersection, idx) => {
              const item1 = data.find((item) => item.id === intersection.id1);
              const item2 = data.find((item) => item.id === intersection.id2);

              if (!item1 || !item2) return null;

              return (
                <Intersection
                  key={`intersection-${idx}`}
                  intersection={intersection}
                  item1Name={item1.name}
                  item2Name={item2.name}
                  clickedItem={clickedItem}
                  highlightedPair={highlightedPair}
                  handleIntersectionClick={handleIntersectionClick}
                  setHighlightedPair={setHighlightedPair}
                />
              );
            })}

            {/* Top row rectangles (Dataset 1) */}
            {data.map((item, i) => (
              <ItemBar
                key={`top-bar-${i}`}
                item={item}
                xScale={scales.xScale}
                height={height}
                valueScale={scales.valueScale}
                isTop={true}
                selectedItemID={selectedItemID}
                clickedItem={clickedItem}
                setSelectedItemID={setSelectedItemID}
              />
            ))}

            {/* Bottom row rectangles (Dataset 2) */}
            {data.map((item, i) => (
              <ItemBar
                key={`bottom-bar-${i}`}
                item={item}
                xScale={scales.xScale}
                height={height}
                valueScale={scales.valueScale}
                isTop={false}
                selectedItemID={selectedItemID}
                clickedItem={clickedItem}
                setSelectedItemID={setSelectedItemID}
              />
            ))}

            {/* Top row item nodes (Dataset 1) */}
            {data.map((item, i) => (
              <ItemNode
                key={`top-node-${i}`}
                item={item}
                xScale={scales.xScale}
                height={height}
                width={width}
                isTop={true}
                selectedItemID={selectedItemID}
                clickedItem={clickedItem}
                highlightedPair={highlightedPair}
                setSelectedItemID={setSelectedItemID}
                toggleSelect={toggleSelect}
                setClickedItem={setClickedItem}
                onItemClick={handleItemClick}
                maxNameLength={maxNameLength}
              />
            ))}

            {/* Bottom row item nodes (Dataset 2) */}
            {data.map((item, i) => (
              <ItemNode
                key={`bottom-node-${i}`}
                item={item}
                xScale={scales.xScale}
                height={height}
                width={width}
                isTop={false}
                selectedItemID={selectedItemID}
                clickedItem={clickedItem}
                highlightedPair={highlightedPair}
                setSelectedItemID={setSelectedItemID}
                toggleSelect={toggleSelect}
                setClickedItem={setClickedItem}
                onItemClick={handleItemClick}
                maxNameLength={maxNameLength}
              />
            ))}

            {/* Tooltip for hovered item */}
            {selectedItemID?.toString() &&
              (() => {
                const item = data.find(
                  (item) => item.id === selectedItemID.toString(),
                );
                if (!item) return null;

                return (
                  <Tooltip
                    item={item}
                    width={width}
                    height={height}
                    xScale={scales.xScale}
                  />
                );
              })()}

            {/* Center vertical lines */}
            {data.map((item, i) => (
              <line
                key={`center-line-${i}`}
                x1={scales.xScale(item.startRank)}
                y1={-10}
                x2={scales.xScale(item.startRank)}
                y2={10}
                stroke="#d1d5db"
                strokeWidth={3}
                opacity={0.5}
              />
            ))}
            {data.map((item, i) => (
              <line
                key={`center-line2-${i}`}
                x1={scales.xScale(item.endRank)}
                y1={height - 10}
                x2={scales.xScale(item.endRank)}
                y2={height + 10}
                stroke="#d1d5db"
                strokeWidth={3}
              />
            ))}
          </g>
        </svg>
      )}

      {/* SlopeChartItem Popup */}
      {/* {criteriaData.length > 0 && (
        <ItemPopup
          item={popupItem}
          isOpen={popupOpen}
          onClose={closePopup}
          position={popupPosition}
        />
      )} */}
    </div>
  );
};

export default SlopeChart;
