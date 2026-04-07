// ItemNode.tsx
import React from "react";
import { SlopeChartItem, HighlightedPair } from "@/lib/type";
import { truncateName } from "@/lib/utils";

interface ItemNodeProps {
  item: SlopeChartItem;
  xScale: (rank: number) => number;
  height: number;
  width: number;
  isTop: boolean;
  selectedItemID: number | null;
  clickedItem: string | null;
  highlightedPair: HighlightedPair;
  setSelectedItemID: (id: number | null) => void;
  toggleSelect: (id: number) => void;
  setClickedItem: (id: string | null) => void;
  onItemClick?: (id: string, event: React.MouseEvent) => void;
  maxNameLength: number;
  onItemHover?: (id: string | null) => void;
  hoveredItem?: string | null;
}

const ItemNode: React.FC<ItemNodeProps> = ({
  item,
  xScale,
  height,
  width,
  isTop,
  selectedItemID,
  clickedItem,
  highlightedPair,
  setSelectedItemID,
  toggleSelect,
  setClickedItem,
  onItemClick,
  maxNameLength,
  onItemHover,
  hoveredItem,
}) => {
  const isHovered = selectedItemID?.toString() === item.id;
  const imageSize = Math.min(40, width * 0.07); // Responsive image size
  const truncatedName = truncateName(item.name, maxNameLength);
  const isHighlighted =
    highlightedPair &&
    (highlightedPair.id1 === item.id || highlightedPair.id2 === item.id);

  const rank = isTop ? item.startRank : item.endRank;
  const yPosition = isTop ? -55 : height + 15;
  const labelYPosition = isTop ? -63 : height + 15 + imageSize + 18;

  const handleClick = (event: React.MouseEvent) => {
    if (onItemClick) {
      // Use the new handler if provided
      onItemClick(item.id, event);
    } else if (clickedItem === item.id) {
      setClickedItem(null);
    } else {
      setClickedItem(item.id);
    }
  };

  return (
    <g
      onMouseEnter={() => {
        setSelectedItemID(parseInt(item.id));
        if (onItemHover) onItemHover(item.id);
      }}
      onMouseLeave={() => {
        setSelectedItemID(null);
        if (onItemHover) onItemHover(null);
      }}
      onDoubleClick={() => toggleSelect(parseInt(item.id))}
      onClick={(e) => handleClick(e)}
    >
      {/* Highlight frame for selected/hovered items */}
      {(isHovered || isHighlighted || clickedItem === item.id) && (
        <rect
          x={xScale(rank) - imageSize / 2 - 3} // 3px larger than image on each side
          y={isTop ? -58 : height + 12} // 3px higher than image
          width={imageSize + 6} // 3px wider on each side
          height={imageSize + 6} // 3px taller on each side
          fill="none"
          stroke={
            isHovered || isHighlighted || clickedItem === item.id
              ? "#333"
              : "#ffcc00"
          }
          strokeWidth={3}
          rx={4} // rounded corners
          ry={4} // rounded corners
        />
      )}

      {/* SlopeChartItem image */}
      <image
        href={item.image}
        x={xScale(rank) - imageSize / 2}
        y={yPosition}
        width={imageSize}
        height={imageSize}
        preserveAspectRatio="xMidYMid slice"
        opacity={
          isHovered || isHighlighted || clickedItem === item.id ? 1 : 0.6
        }
        filter={
          isHovered || isHighlighted || clickedItem === item.id
            ? "none"
            : "brightness(0.7)"
        }
      />

      {/* SlopeChartItem name */}
      <text
        x={xScale(rank)}
        y={labelYPosition}
        textAnchor="middle"
        fontSize={Math.min(12, width * 0.02)}
        fontWeight="bold"
        fill={isHovered ? "#000" : "#555"}
        style={{ transition: "fill 0.3s ease" }}
      >
        {truncatedName}
      </text>
    </g>
  );
};

export default ItemNode;
