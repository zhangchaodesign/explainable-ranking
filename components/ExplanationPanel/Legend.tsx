import React from "react";
import { useSharedConfigStore } from "@/lib/store";
import * as d3 from "d3";

// @ts-expect-error
const categoryColor = d3.schemeObservable10;

interface LegendProps {
  criteriaNames: string[];
  hoveredCriterion: string | null;
  setHoveredCriterion: (criterion: string | null) => void;
  hoveredFinalScore: boolean;
  setHoveredFinalScore: (hovered: boolean) => void;
  className?: string;
}

const Legend = ({
  criteriaNames,
  hoveredCriterion,
  setHoveredCriterion,
  hoveredFinalScore,
  setHoveredFinalScore,
  className = "",
}: LegendProps) => {
  const numberKeys = useSharedConfigStore((state) => state.numberKeys).filter(
    (key) => key !== "id" && key !== "order",
  );

  const isDimmed = hoveredCriterion !== null || hoveredFinalScore;

  return (
    <div className={`flex flex-wrap gap-4 items-center ${className}`}>
      {/* Final Score Legend - More Prominent */}
      <div
        key="legend-final-score"
        className="flex items-center gap-2 cursor-pointer"
        onMouseEnter={() => setHoveredFinalScore(true)}
        onMouseLeave={() => setHoveredFinalScore(false)}
      >
        <div className="flex gap-1">
          {/* Positive Final Score */}
          <div
            className="w-4 h-4 border-2 border-white transition-all duration-200"
            style={{
              backgroundColor: "#00bafe",
              opacity: hoveredFinalScore ? 1.0 : isDimmed ? 0.5 : 0.9,
              border: "1px solid #E4E4E7",
            }}
          />
          {/* Negative Final Score */}
          <div
            className="w-4 h-4 border-2 border-white transition-all duration-200"
            style={{
              backgroundColor: "#ff627d",
              opacity: hoveredFinalScore ? 1.0 : isDimmed ? 0.5 : 0.9,
              border: "1px solid #E4E4E7",
            }}
          />
        </div>
        <span
          className="text-sm text-gray-900 transition-all duration-200"
          style={{
            fontWeight: hoveredFinalScore ? "bold" : "600",
            fontSize: hoveredFinalScore ? "14px" : "13px",
          }}
        >
          Final Score
        </span>
      </div>

      {/* Criteria Legend Items - Less Prominent */}
      {criteriaNames.map((criterionName) => (
        <div
          key={`legend-${criterionName}`}
          className="flex items-center gap-2 cursor-pointer"
          onMouseEnter={() => setHoveredCriterion(criterionName)}
          onMouseLeave={() => setHoveredCriterion(null)}
        >
          <div
            className="w-3 h-3 transition-opacity duration-200"
            style={{
              backgroundColor:
                categoryColor[
                  numberKeys.indexOf(criterionName) % categoryColor.length
                ],
              opacity:
                hoveredCriterion === criterionName
                  ? 0.8
                  : isDimmed && hoveredCriterion !== criterionName
                    ? 0.2
                    : 0.4,
            }}
          />
          <span
            className="text-sm text-gray-600 transition-all duration-200"
            style={{
              fontWeight: hoveredCriterion === criterionName ? "600" : "normal",
              opacity:
                hoveredCriterion === criterionName
                  ? 1.0
                  : isDimmed && hoveredCriterion !== criterionName
                    ? 0.4
                    : 0.7,
            }}
          >
            {criterionName.charAt(0).toUpperCase() + criterionName.slice(1)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default Legend;
