import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  useItemDataStore,
  useWeightPanelStore,
  useSharedConfigStore,
  useInfoPanelConfigStore,
  useCriteriaDataStore,
} from "@/lib/store";
import { aggregateScore } from "@/lib/svm";
import { SlopeChartItem } from "@/lib/type";
import { ChartScales } from "./ChartScales";
import ItemNode from "./ItemNode";
import * as d3 from "d3";

// @ts-expect-error
const categoryColor = d3.schemeObservable10;

interface ExplainableStackedBarChartProps {
  rankBy: string;
  weights: { [key: string]: number };
  className?: string;
  hoveredCriterion?: string | null;
  onCriterionHover?: (criterion: string | null) => void;
}

const ExplainableStackedBarChart = ({
  rankBy,
  weights,
  className = "",
  hoveredCriterion: externalHoveredCriterion = null,
  onCriterionHover,
}: ExplainableStackedBarChartProps) => {
  const [clickedItem, setClickedItem] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const hoveredCriterion = externalHoveredCriterion;
  const setHoveredCriterion = onCriterionHover || (() => {});
  const [hoveredFinalScore, setHoveredFinalScore] = useState<boolean>(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { rankItems } = useItemDataStore();
  const { weightSort } = useWeightPanelStore();
  const { selectedItemID, setSelectedItemID, nameKey } = useSharedConfigStore();
  const { setInfoId, setIsInfoOpen, setHighlightedPair, highlightedPair } =
    useInfoPanelConfigStore();
  const { criteriaData } = useCriteriaDataStore();
  const numberKeys = useSharedConfigStore((state) => state.numberKeys).filter(
    (key) => key !== "id" && key !== "order",
  );

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

  // Process data - same as SlopeChart to maintain positioning
  const data = useMemo(() => {
    let _data: SlopeChartItem[];

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
        image: item.image ? (item.image as string) : "",
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
        image: item.image ? (item.image as string) : "",
      }));
    }

    // Sort by endValue to determine endRank (higher value = better rank)
    const endSorted = [..._data].sort((a, b) => b.endValue - a.endValue);
    endSorted.forEach((item, index) => {
      const foundItem = _data.find((d) => d.id === item.id);
      if (foundItem) {
        foundItem.endRank = index + 1;
        foundItem.rankChange = -(foundItem.startRank - foundItem.endRank);
      }
    });

    return _data;
  }, [rankItems, weights, weightSort, nameKey, rankBy]);

  // Get individual criterion scores for stacked bars
  const stackedData = useMemo(() => {
    return data.map((item) => {
      const itemData = rankItems.find((r) => r.id.toString() === item.id);
      if (!itemData) return { ...item, criterionScores: {} };

      const scores =
        weights === weightSort
          ? aggregateScore(itemData).weightedScores
          : aggregateScore(itemData, weights).weightedScores;

      return {
        ...item,
        criterionScores: scores,
      };
    });
  }, [data, rankItems, weights, weightSort]);

  // Calculate dimensions and scales - same as SlopeChart
  const margin = { top: 100, right: 60, bottom: 110, left: 60 };
  const width = Math.max(0, dimensions.width - margin.left - margin.right);
  const height = Math.max(0, dimensions.height - margin.top - margin.bottom);
  const shouldRender = width > 0 && height > 0 && stackedData.length > 0;

  // Create scales object using the same logic as SlopeChart
  const scales = useMemo(() => {
    return new ChartScales(width, height, data);
  }, [width, height, data]);

  // If nodes need more space than available, expand the SVG width
  const svgContentWidth = scales.requiredWidth > width
    ? scales.requiredWidth + margin.left + margin.right
    : dimensions.width;

  // Get criteria colors - using same scheme as Item.tsx
  const criteriaNames = Object.keys(weights);

  // Handler for opening item popup/info when clicked
  const handleItemClick = (id: string) => {
    setClickedItem(id);
  };

  // Calculate max name length based on available space
  const maxNameLength = useMemo(() => {
    return scales.calculateMaxNameLength();
  }, [scales]);

  // Calculate max bar height for scaling
  const maxTotalPositiveScore = Math.max(
    ...stackedData.map((item) =>
      Object.entries(item.criterionScores).reduce(
        (sum, [criterionName, score]) => {
          const weight = weights[criterionName] || 0;
          return sum + Math.max(0, score * weight);
        },
        0,
      ),
    ),
  );

  const maxTotalNegativeScore = Math.max(
    ...stackedData.map((item) =>
      Math.abs(
        Object.entries(item.criterionScores).reduce(
          (sum, [criterionName, score]) => {
            const weight = weights[criterionName] || 0;
            return sum + Math.min(0, score * weight);
          },
          0,
        ),
      ),
    ),
  );

  const maxTotalScore = Math.max(maxTotalPositiveScore, maxTotalNegativeScore);

  // Calculate available space above and below 0-level, accounting for item images at bottom
  const zeroLevelPosition = height * 0.4; // Position 0-level higher to leave more space for item images
  const spaceAboveZero = zeroLevelPosition * 0.98; // Use 98% of space above zero level
  const spaceBelowZero = (height - zeroLevelPosition - 50) * 0.95; // Reserve 50px for item images, use 95% of remaining space
  const maxBarHeight = Math.max(spaceAboveZero, spaceBelowZero) * 1.2; // Use the larger space and multiply by 1.2 for more prominent bars

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
            {/* Chart title */}
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

            {/* Alternating background stripes for each item */}
            {stackedData.map((item, index) => {
              const x = scales.xScale(item.endRank);
              const bgColor = "#d8d8d8"; // Dark gray alternating pattern
              const barSpacing = 50; // Width of each stripe

              return (
                <rect
                  key={`bg-stripe-${item.id}`}
                  x={x - barSpacing / 2} // Center the stripe on the x position
                  y={-60}
                  width={barSpacing}
                  height={height + 60}
                  fill={bgColor}
                  opacity={0.1}
                />
              );
            })}

            {/* Zero-level axis line */}
            <line
              x1={-40}
              y1={zeroLevelPosition}
              x2={width + 40}
              y2={zeroLevelPosition}
              stroke="#ccc"
              strokeWidth={1}
              opacity={0.5}
            />

            {/* Zero-level label */}
            <text
              x={-40}
              y={zeroLevelPosition - 5}
              textAnchor="start"
              fontSize={10}
              fill="#ccc"
            >
              0
            </text>

            {/* Vertical stacked bars positioned above each item */}
            {stackedData.map((item) => {
              const x = scales.xScale(item.endRank);
              const criteriaBarWidth = 20; // Width for criteria bars
              const finalScoreBarWidth = 25; // Width for final score bars

              // Calculate positive and negative criterion scores separately
              const positiveCriteriaScores: { [key: string]: number } = {};
              const negativeCriteriaScores: { [key: string]: number } = {};
              let totalPositiveCriteria = 0;
              let totalNegativeCriteria = 0;

              Object.entries(item.criterionScores).forEach(
                ([criterionName, score]) => {
                  const weight = weights[criterionName] || 0;
                  const weightedScore = score * weight;
                  if (weightedScore > 0) {
                    positiveCriteriaScores[criterionName] = weightedScore;
                    totalPositiveCriteria += weightedScore;
                  } else if (weightedScore < 0) {
                    negativeCriteriaScores[criterionName] =
                      Math.abs(weightedScore);
                    totalNegativeCriteria += Math.abs(weightedScore);
                  }
                },
              );

              // Calculate final score
              const finalScore = totalPositiveCriteria - totalNegativeCriteria;

              // Calculate bar heights based on maximum values
              const positiveBarHeight =
                totalPositiveCriteria > 0
                  ? (totalPositiveCriteria / maxTotalScore) * maxBarHeight
                  : 0;
              const negativeBarHeight =
                totalNegativeCriteria > 0
                  ? (totalNegativeCriteria / maxTotalScore) * maxBarHeight
                  : 0;
              const finalScoreBarHeight =
                Math.abs(finalScore) > 0
                  ? (Math.abs(finalScore) / maxTotalScore) * maxBarHeight
                  : 0;

              // Set consistent 0-level at the middle of available height
              const zeroLevel = zeroLevelPosition; // Use the pre-calculated zero level position

              return (
                <g key={`stacked-bar-${item.id}`}>
                  {/* Positive criteria bars (above 0-level) */}
                  {(() => {
                    let yOffset = zeroLevel - positiveBarHeight;
                    return criteriaNames.map((criterionName) => {
                      const weightedScore =
                        positiveCriteriaScores[criterionName];
                      if (!weightedScore || weightedScore <= 0) return null;

                      const segmentHeight =
                        totalPositiveCriteria > 0
                          ? (weightedScore / totalPositiveCriteria) *
                            positiveBarHeight
                          : 0;

                      const isHighlighted =
                        hoveredCriterion === criterionName ||
                        hoveredItem === item.id;
                      const isDimmed =
                        ((hoveredCriterion !== null &&
                          hoveredCriterion !== criterionName) ||
                          hoveredFinalScore ||
                          (hoveredItem !== null && hoveredItem !== item.id)) &&
                        !isHighlighted;

                      const rect = (
                        <rect
                          key={`positive-criteria-${item.id}-${criterionName}`}
                          x={x - criteriaBarWidth - 2} // Position criteria bars to the left of center
                          y={yOffset}
                          width={criteriaBarWidth}
                          height={segmentHeight}
                          fill={
                            categoryColor[
                              numberKeys.indexOf(criterionName) %
                                categoryColor.length
                            ]
                          }
                          stroke="#fff"
                          strokeWidth={1}
                          opacity={isDimmed ? 0.1 : isHighlighted ? 0.6 : 0.25}
                          className="cursor-pointer"
                          style={{
                            transition:
                              "opacity 0.2s ease-in-out, height 0.3s ease-in-out, y 0.3s ease-in-out",
                          }}
                          onMouseEnter={() =>
                            setHoveredCriterion(criterionName)
                          }
                          onMouseLeave={() => setHoveredCriterion(null)}
                        >
                          <title>
                            {item.name} - {criterionName}:{" "}
                            {(
                              weightedScore / (weights[criterionName] || 1)
                            ).toFixed(2)}{" "}
                            (weighted: {weightedScore.toFixed(2)})
                          </title>
                        </rect>
                      );

                      yOffset += segmentHeight;
                      return rect;
                    });
                  })()}

                  {/* Negative criteria bars (below 0-level) */}
                  {(() => {
                    let yOffset = zeroLevel;
                    return criteriaNames.map((criterionName) => {
                      const weightedScore =
                        negativeCriteriaScores[criterionName];
                      if (!weightedScore || weightedScore <= 0) return null;

                      const segmentHeight =
                        totalNegativeCriteria > 0
                          ? (weightedScore / totalNegativeCriteria) *
                            negativeBarHeight
                          : 0;

                      const isHighlighted =
                        hoveredCriterion === criterionName ||
                        hoveredItem === item.id;
                      const isDimmed =
                        ((hoveredCriterion !== null &&
                          hoveredCriterion !== criterionName) ||
                          hoveredFinalScore ||
                          (hoveredItem !== null && hoveredItem !== item.id)) &&
                        !isHighlighted;

                      const rect = (
                        <rect
                          key={`negative-criteria-${item.id}-${criterionName}`}
                          x={x - criteriaBarWidth - 2} // Position criteria bars to the left of center
                          y={yOffset}
                          width={criteriaBarWidth}
                          height={segmentHeight}
                          fill={
                            categoryColor[
                              numberKeys.indexOf(criterionName) %
                                categoryColor.length
                            ]
                          }
                          stroke="#fff"
                          strokeWidth={1}
                          opacity={isDimmed ? 0.05 : isHighlighted ? 0.5 : 0.2}
                          className="cursor-pointer"
                          style={{
                            transition:
                              "opacity 0.2s ease-in-out, height 0.3s ease-in-out, y 0.3s ease-in-out",
                          }}
                          onMouseEnter={() =>
                            setHoveredCriterion(criterionName)
                          }
                          onMouseLeave={() => setHoveredCriterion(null)}
                        >
                          <title>
                            {item.name} - {criterionName}:{" "}
                            {(
                              -weightedScore / (weights[criterionName] || 1)
                            ).toFixed(2)}{" "}
                            (weighted: {-weightedScore.toFixed(2)})
                          </title>
                        </rect>
                      );

                      yOffset += segmentHeight;
                      return rect;
                    });
                  })()}

                  {/* Final score bars (positioned on the right) */}
                  {finalScoreBarHeight > 0 && (
                    <g key={`final-score-group-${item.id}`}>
                      {finalScore > 0 ? (
                        // Positive final score bar (above 0-level, on the right)
                        <rect
                          key={`final-score-positive-${item.id}`}
                          x={x} // Position final score bars to the right
                          y={zeroLevel - finalScoreBarHeight}
                          width={finalScoreBarWidth}
                          height={finalScoreBarHeight}
                          fill="#00bafe"
                          stroke="#fff"
                          strokeWidth={2}
                          opacity={
                            hoveredFinalScore || hoveredItem === item.id
                              ? 1.0
                              : hoveredCriterion !== null ||
                                  hoveredItem !== null
                                ? 0.5
                                : 0.9
                          }
                          className="cursor-pointer"
                          style={{
                            transition:
                              "opacity 0.2s ease-in-out, height 0.3s ease-in-out, y 0.3s ease-in-out",
                          }}
                          onMouseEnter={() => setHoveredFinalScore(true)}
                          onMouseLeave={() => setHoveredFinalScore(false)}
                        >
                          <title>
                            {item.name} - Final Score: {finalScore.toFixed(2)}
                          </title>
                        </rect>
                      ) : (
                        // Negative final score bar (below 0-level, on the right)
                        <rect
                          key={`final-score-negative-${item.id}`}
                          x={x} // Position final score bars to the right of center
                          y={zeroLevel}
                          width={finalScoreBarWidth}
                          height={finalScoreBarHeight}
                          fill="#ff627d"
                          stroke="#fff"
                          strokeWidth={2}
                          opacity={
                            hoveredFinalScore || hoveredItem === item.id
                              ? 1.0
                              : hoveredCriterion !== null ||
                                  hoveredItem !== null
                                ? 0.5
                                : 0.9
                          }
                          className="cursor-pointer"
                          style={{
                            transition:
                              "opacity 0.2s ease-in-out, height 0.3s ease-in-out, y 0.3s ease-in-out",
                          }}
                          onMouseEnter={() => setHoveredFinalScore(true)}
                          onMouseLeave={() => setHoveredFinalScore(false)}
                        >
                          <title>
                            {item.name} - Final Score: {finalScore.toFixed(2)}
                          </title>
                        </rect>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Bottom row item nodes (Dataset 2) - preserve original design */}
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
                onItemHover={setHoveredItem}
                hoveredItem={hoveredItem}
              />
            ))}
          </g>
        </svg>
      )}
    </div>
  );
};

export default ExplainableStackedBarChart;
