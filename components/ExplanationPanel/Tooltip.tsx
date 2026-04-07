import React from "react";
import { SlopeChartItem } from "@/lib/type";
import { getRankChangeExplanation } from "@/lib/utils";

interface TooltipProps {
  item: SlopeChartItem;
  width: number;
  height: number;
  xScale: (rank: number) => number;
}

const Tooltip = ({ item, width, height, xScale }: TooltipProps) => {
  const startX = xScale(item.startRank);
  const endX = xScale(item.endRank);
  const centerY = height / 2;

  // Responsive tooltip sizing
  const tooltipWidth = Math.min(140, width * 0.4);
  const fontSize = Math.min(12, width * 0.022);
  const lineHeight = fontSize * 1.3;
  const padding = 8;

  const explanation = getRankChangeExplanation(item.name, item.rankChange);

  // Calculate actual number of lines for explanation text
  const calculateActualLines = (
    text: string,
    maxWidth: number,
    charWidth: number,
  ) => {
    const words = text.split(" ");
    let line = "";
    let lineCount = 0;
    const adjustedMaxWidth = maxWidth - padding;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = line === "" ? word : line + " " + word;

      if (testLine.length * charWidth > adjustedMaxWidth && line !== "") {
        lineCount++;
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line.trim() !== "") {
      lineCount++;
    }

    return lineCount;
  };

  // Calculate content dimensions
  const titleHeight = lineHeight;
  const rankChangeHeight = lineHeight;
  const explanationLines = calculateActualLines(
    explanation,
    tooltipWidth,
    (fontSize - 2) * 0.55,
  );
  const explanationHeight = explanationLines * (lineHeight * 0.9);

  // Dynamic height calculation based on content
  const contentHeight =
    titleHeight + rankChangeHeight + explanationHeight + padding * 3;
  const tooltipHeight = Math.max(contentHeight, 60); // Minimum height

  // Creates wrapped text for the explanation
  const createWrappedText = (
    text: string,
    x: number,
    startY: number,
    lineHeight: number,
    maxWidth: number,
    leftPadding: number = padding / 2,
    rightPadding: number = padding / 2,
  ) => {
    const words = text.split(" ");
    let line = "";
    let tspans: JSX.Element[] = [];
    let lineCount = 0;
    const adjustedMaxWidth = maxWidth - leftPadding - rightPadding;
    const charWidthEstimate = (fontSize - 2) * 0.55;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = line === "" ? word : line + " " + word;

      if (
        testLine.length * charWidthEstimate > adjustedMaxWidth &&
        line !== ""
      ) {
        // Line is too long, add current line and start new one with current word
        tspans.push(
          <tspan
            key={lineCount}
            x={x}
            y={startY + lineCount * lineHeight * 0.9}
            fontStyle="italic"
            fontSize={fontSize - 2}
            fill="rgba(255, 255, 255, 0.9)"
            textAnchor="middle"
          >
            {line.trim()}
          </tspan>,
        );
        lineCount++;
        line = word;
      } else {
        line = testLine;
      }
    }

    // Add the final line if there's any content
    if (line.trim() !== "") {
      tspans.push(
        <tspan
          key={lineCount}
          x={x}
          y={startY + lineCount * lineHeight * 0.9}
          fontStyle="italic"
          fontSize={fontSize - 2}
          fill="rgba(255, 255, 255, 0.9)"
          textAnchor="middle"
        >
          {line.trim()}
        </tspan>,
      );
    }

    return tspans;
  };

  // Calculate positions for better organization
  const tooltipX = (startX + endX) / 2 - tooltipWidth / 2;
  const tooltipY = centerY - tooltipHeight / 2;
  const centerX = (startX + endX) / 2;

  // Organized vertical positions
  const titleY = tooltipY + padding + fontSize;
  const rankChangeY = titleY + lineHeight + padding / 2;
  const explanationY = rankChangeY + lineHeight + padding / 2;

  return (
    <g>
      {/* Main tooltip background with subtle border */}
      <rect
        x={tooltipX}
        y={tooltipY}
        width={tooltipWidth}
        height={tooltipHeight}
        rx="6"
        ry="6"
        fill="rgba(0, 0, 0, 0.85)"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth="1"
      />

      {/* Item name - main title */}
      <text
        x={centerX}
        y={titleY}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="bold"
        fill="white"
      >
        {item.name}
      </text>

      {/* Rank change information with color coding */}
      <text
        x={centerX}
        y={rankChangeY}
        textAnchor="middle"
        fontSize={fontSize - 1}
        fontWeight="500"
        fill={
          item.rankChange === 0
            ? "rgba(255, 255, 255, 0.8)"
            : item.rankChange > 0
              ? "#22c55e"
              : "#ef4444"
        }
      >
        Rank Change:{" "}
        {item.rankChange > 0 ? "+" + item.rankChange : item.rankChange}
      </text>

      {/* Divider line */}
      <line
        x1={tooltipX + padding}
        y1={rankChangeY + padding / 2}
        x2={tooltipX + tooltipWidth - padding}
        y2={rankChangeY + padding / 2}
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="0.5"
      />

      {/* Explanation text */}
      <text textAnchor="middle" fill="white">
        {createWrappedText(
          explanation,
          centerX,
          explanationY,
          lineHeight,
          tooltipWidth,
        )}
      </text>
    </g>
  );
};

export default Tooltip;
