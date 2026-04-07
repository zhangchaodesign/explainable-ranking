import React from "react";
import { SlopeChartItem, HighlightedPair } from "@/lib/type";
import { getStrongerColor } from "@/lib/utils";

interface SankeyPathProps {
  item: SlopeChartItem;
  xScale: (rank: number) => number;
  height: number;
  valueScale: (value: number) => number;
  selectedItemID: number | null;
  highlightedPair: HighlightedPair;
}

const SankeyPath = ({
  item,
  xScale,
  height,
  valueScale,
  selectedItemID,
  highlightedPair,
}: SankeyPathProps) => {
  // Function to generate Sankey-style curved path with gradient width
  const sankeyPath = () => {
    const startRank = item.startRank;
    const endRank = item.endRank;
    const startValue = item.startValue;
    const endValue = item.endValue;

    const x1 = xScale(startRank);
    const y1 = 10;
    const x2 = xScale(endRank);
    const y2 = height - 10;

    // Control points for the curve
    const midY = (y1 + y2) / 2;

    // Width of path at start and end - proportional to values
    const startWidth = valueScale(startValue) / 2;
    const endWidth = valueScale(endValue) / 2;

    // Calculate offsets based on bar position
    let startX1, startX2, endX1, endX2;

    if (startValue >= 0) {
      // For positive start values
      startX1 = x1;
      startX2 = x1 + startWidth * 2;
    } else {
      // For negative start values
      startX1 = x1 - startWidth * 2;
      startX2 = x1;
    }

    if (endValue >= 0) {
      // For positive end values
      endX1 = x2;
      endX2 = x2 + endWidth * 2;
    } else {
      // For negative end values
      endX1 = x2 - endWidth * 2;
      endX2 = x2;
    }

    // Create a path that has width that transitions from start to end width
    return `M ${startX1},${y1}
            L ${startX2},${y1}
            C ${startX2},${midY} ${endX2},${midY} ${endX2},${y2}
            L ${endX1},${y2}
            C ${endX1},${midY} ${startX1},${midY} ${startX1},${y1}
            Z`;
  };

  const isHighlighted =
    highlightedPair &&
    (highlightedPair.id1 === item.id || highlightedPair.id2 === item.id);

  return (
    <path
      d={sankeyPath()}
      stroke="none"
      fill={getStrongerColor(item.rankChange)}
      opacity={
        isHighlighted ? 0.9 : selectedItemID?.toString() === item.id ? 0.6 : 0.4
      }
      strokeWidth={isHighlighted ? 2 : 0}
      strokeDasharray={isHighlighted ? "4,2" : ""}
      style={{ transition: "all 0.3s ease" }}
    />
  );
};

export default SankeyPath;
