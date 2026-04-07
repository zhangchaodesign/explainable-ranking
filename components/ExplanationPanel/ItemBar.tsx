import React from "react";
import { SlopeChartItem } from "@/lib/type";
import { getBarFill } from "@/lib/utils";

interface ItemBarProps {
  item: SlopeChartItem;
  xScale: (rank: number) => number;
  height: number;
  valueScale: (value: number) => number;
  isTop: boolean;
  selectedItemID: number | null;
  clickedItem: string | null;
  setSelectedItemID: (id: number | null) => void;
}

const ItemBar = ({
  item,
  xScale,
  height,
  valueScale,
  isTop,
  selectedItemID,
  clickedItem,
  setSelectedItemID,
}: ItemBarProps) => {
  // Function to position bars with proper alignment
  const getBarPosition = (value: number, rank: number) => {
    const barWidth = valueScale(value);
    const x = xScale(rank);

    if (value >= 0) {
      // For positive values, start from center point and extend right
      return { x: x, width: barWidth };
    } else {
      // For negative values, start from center point and extend left
      return { x: x - barWidth, width: barWidth };
    }
  };

  const barHeight = Math.min(20, height * 0.2); // Responsive bar height
  const position = getBarPosition(
    isTop ? item.startValue : item.endValue,
    isTop ? item.startRank : item.endRank,
  );
  const isHovered = selectedItemID?.toString() === item.id;

  return (
    <rect
      x={position.x}
      y={isTop ? 0 - barHeight / 2 : height - barHeight / 2}
      width={position.width}
      height={barHeight}
      fill={getBarFill(isTop ? item.startValue : item.endValue)}
      opacity={isHovered || clickedItem === item.id ? 1 : 0.6}
      onMouseEnter={() => setSelectedItemID(parseInt(item.id))}
      onMouseLeave={() => setSelectedItemID(null)}
      style={{ transition: "all 0.3s ease" }}
    />
  );
};

export default ItemBar;
