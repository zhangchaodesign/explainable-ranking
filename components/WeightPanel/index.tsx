"use client";
import React, { useEffect } from "react";
import {
  useWeightPanelStore,
  useItemDataStore,
  useSharedConfigStore,
} from "@/lib/store";
import WeightsBarChart from "@/components/WeightPanel/WeightsBarChart";
import { cn } from "@/lib/utils";

interface WeightPanelProps {
  onClose: () => void;
  type: string;
  classes?: string;
}

const WeightPanel = ({ onClose, type, classes }: WeightPanelProps) => {
  const { gridItems, setGridItems } = useItemDataStore();
  const { weightSort, weightSortState, setWeightSort } = useWeightPanelStore();
  const { numberKeys } = useSharedConfigStore();

  // Handle weights change
  const handleWeightsChange = (newWeights: { [key: string]: number }) => {
    console.log("Weights updated:", newWeights);
    setWeightSort(newWeights);
  };

  useEffect(() => {
    handleWeightsChange(weightSort);
  }, [weightSort, weightSortState]);

  // Separate effect to handle when new criteria are added and confirmed
  // This triggers when numberKeys change (new criteria added to numberKeys)
  useEffect(() => {
    if (Object.keys(weightSort).length > 0) {
      handleWeightsChange(weightSort);
    }
  }, [numberKeys]);

  return (
    <div className={cn(classes, "overflow-y-auto")}>
      <div className="flex flex-col select-none relative w-full h-full">
        {/* WeightsBarChart Takes Full Width */}
        <div className="w-full h-full">
          {Object.keys(weightSort).length > 0 && (
            <WeightsBarChart
              rankBy="aggregated score"
              classes="w-full h-full"
              draggable={true}
              onChange={handleWeightsChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WeightPanel;
