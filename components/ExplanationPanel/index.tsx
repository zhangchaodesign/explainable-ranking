"use client";
import React, { useState } from "react";
import SlopeChart from "./SlopeChart";
import ExplainableStackedBarChart from "./ExplainableStackedBarChart";
import OrderedStackedBarChart from "./OrderedStackedBarChart";
import Legend from "./Legend";
import ComputingRankDropdown from "@/components/WeightPanel/ComputingRankDropdown";
import { useItemDataStore, useSharedConfigStore } from "@/lib/store";

interface ExplanationPanelProps {
  rankBy: string;
  weights: { [key: string]: number };
  setRankBy: (value: string) => void;
  handleRankByChange: (value: string) => void;
  className?: string;
}

const ExplanationPanel = ({
  rankBy,
  weights,
  setRankBy,
  handleRankByChange,
  className = "w-full h-[55%]",
}: ExplanationPanelProps) => {
  const { rankItems } = useItemDataStore();
  const { visualizationType, setVisualizationType } = useSharedConfigStore();
  const [hoveredCriterion, setHoveredCriterion] = useState<string | null>(null);
  const [hoveredFinalScore, setHoveredFinalScore] = useState<boolean>(false);

  const criteriaNames = Object.keys(weights);

  return (
    <div className={`relative ${className}`}>
      {/* Top Legend for Explainable Rank Bars */}
      {visualizationType === "stacked" && criteriaNames.length > 0 && (
        <div className="absolute top-1 left-4 z-10">
          <Legend
            criteriaNames={criteriaNames}
            hoveredCriterion={hoveredCriterion}
            setHoveredCriterion={setHoveredCriterion}
            hoveredFinalScore={hoveredFinalScore}
            setHoveredFinalScore={setHoveredFinalScore}
          />
        </div>
      )}

      {/* Visualization switcher */}
      {rankItems.length > 0 && (
        <div className="absolute -bottom-0 right-2 z-10">
          <div className="join">
            <button
              className={`btn btn-xs join-item shadow-none ${visualizationType === "slope" ? "btn-primary" : "btn"}`}
              onClick={() => setVisualizationType("slope")}
            >
              Comparison Slope Chart
            </button>
            <button
              className={`btn btn-xs join-item shadow-none ${visualizationType === "stacked" ? "btn-primary" : "btn"}`}
              onClick={() => setVisualizationType("stacked")}
            >
              Explainable Rank Bars
            </button>
            <button
              className={`btn btn-xs join-item shadow-none ${visualizationType === "mirrored" ? "btn-primary" : "btn"}`}
              onClick={() => setVisualizationType("mirrored")}
            >
              Manual Rank Bars
            </button>
          </div>
        </div>
      )}

      {/* Render the selected visualization */}
      {visualizationType === "slope" ? (
        <SlopeChart
          rankBy={rankBy}
          weights={weights}
          className="w-full h-full"
        />
      ) : visualizationType === "stacked" ? (
        <ExplainableStackedBarChart
          rankBy={rankBy}
          weights={weights}
          className="w-full h-full"
          hoveredCriterion={hoveredCriterion}
          onCriterionHover={setHoveredCriterion}
        />
      ) : (
        <OrderedStackedBarChart
          rankBy={rankBy}
          weights={weights}
          className="w-full h-full"
          hoveredCriterion={hoveredCriterion}
          onCriterionHover={setHoveredCriterion}
        />
      )}

      {/* Bottom Legend for Manual Rank Bars */}
      {visualizationType === "mirrored" && criteriaNames.length > 0 && (
        <div className="absolute bottom-1 left-4 z-10">
          <Legend
            criteriaNames={criteriaNames}
            hoveredCriterion={hoveredCriterion}
            setHoveredCriterion={setHoveredCriterion}
            hoveredFinalScore={hoveredFinalScore}
            setHoveredFinalScore={setHoveredFinalScore}
          />
        </div>
      )}

      {Object.keys(weights).length > 1 &&
        rankItems.length > 0 &&
        visualizationType === "slope" && (
          <div className="absolute -bottom-1 left-40">
            <ComputingRankDropdown
              title="Computed from"
              sortBy={rankBy}
              setSortBy={setRankBy}
              handleSortChange={handleRankByChange}
            />
          </div>
        )}
    </div>
  );
};

export default ExplanationPanel;
