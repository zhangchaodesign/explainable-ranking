"use client";
import React, { useState } from "react";
import {
  useWeightPanelStore,
  useItemDataStore,
  useSharedConfigStore,
  useInfoPanelConfigStore,
} from "@/lib/store";
import { rankingSVM } from "@/lib/svm";
import { eventTracker } from "@/lib/utils";

const ActionButtons = () => {
  const { setSelectedIDs, setIsInfoOpen } = useInfoPanelConfigStore();
  const { setIsNewCriteriaOpen } = useSharedConfigStore();
  const { gridItems, rankItems, setRankItems } = useItemDataStore();
  const { weightSort, setWeightSort, weightSortState, setWeightSortState } = useWeightPanelStore();

  const [showWeightConfirm, setShowWeightConfirm] = useState(false);
  const [proposedWeights, setProposedWeights] = useState<{
    [key: string]: number;
  }>({});

  const [showInsertionSortConfirm, setShowInsertionSortConfirm] = useState(false);

  const hasWeightChanges = () => {
    return Object.entries(proposedWeights).some(([criterion, weight]) => {
      const currentWeight = weightSort[criterion] || 0;
      return Math.abs(weight - currentWeight) > 0.001; // Use small threshold for floating point comparison
    });
  };

  return (
    <>
      {gridItems.length > 0 && (
        <div className="flex flex-row gap-2 justify-end w-full">
          <button
            onClick={() => {
              setShowInsertionSortConfirm(true);
            }}
            className="btn btn-sm btn-neutral shadow-none"
          >
            User Insertion Sort
          </button>

          <button
            onClick={() => {
              setIsNewCriteriaOpen(true);
            }}
            className="btn btn-sm btn-secondary shadow-none"
          >
            Add a Criterion
          </button>

          <button
            className="btn btn-sm btn-primary shadow-none"
            onClick={async () => {
              await rankingSVM().then((res) => {
                setProposedWeights(res.weights);
                setShowWeightConfirm(true);
              });
            }}
            disabled={
              rankItems.length < 3 || Object.keys(weightSort).length < 2
            }
          >
            Estimate Weights from Your Rank
          </button>

          <button
            className="btn btn-sm shadow-none"
            onClick={() => {
              console.log("Applying current weights to rank items:", gridItems);
              setRankItems(gridItems);
            }}
          >
            Apply Current Weights
          </button>
        </div>
      )}

      {/* Insertion Sort Criteria Confirmation Dialog */}
      {showInsertionSortConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[100] transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold text-gray-900 text-lg">Select Sort Criteria</h3>
              <p className="text-sm text-gray-500 mt-1">
                Choose the criteria to consider during the insertion sort.
              </p>
            </div>
            
            <div className="max-h-[32vh] overflow-y-auto p-6 space-y-1.5 custom-scrollbar">
              {Object.keys(weightSortState).map((criterion) => (
                <label 
                  key={criterion} 
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-neutral rounded flex-shrink-0"
                    checked={weightSortState[criterion] || false}
                    onChange={(e) => {
                      setWeightSortState({
                        ...weightSortState,
                        [criterion]: e.target.checked,
                      });
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700 select-none flex-grow truncate">{criterion}</span>
                </label>
              ))}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                className="btn btn-sm btn-ghost hover:bg-gray-200 text-gray-600 shadow-none"
                onClick={() => setShowInsertionSortConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm btn-neutral shadow-sm px-6"
                onClick={() => {
                  setRankItems([gridItems[gridItems.length - 1]]);
                  setSelectedIDs([
                    gridItems[gridItems.length - 1].id,
                    gridItems[gridItems.length - 2].id,
                  ]);
                  setIsInfoOpen(true);
                  setShowInsertionSortConfirm(false);
                }}
                disabled={!Object.values(weightSortState).some((v) => v)}
              >
                Start Sort
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weight Confirmation Dialog */}
      {showWeightConfirm && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-[100]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h3 className="font-bold text-lg mb-2">
              {hasWeightChanges()
                ? "Confirm Weight Changes"
                : "No Changes from Estimation"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {hasWeightChanges()
                ? "The system has estimated new weights based on your ranking. Review the changes below."
                : "The estimated weights are the same as your current weights."}
            </p>

            <div className="grid grid-cols-2 gap-8 my-4">
              <div>
                <h4 className="font-semibold mb-2">Current Weights</h4>
                <div className="space-y-2">
                  {Object.entries(weightSort).map(([criterion, weight]) => (
                    <div
                      key={`current-${criterion}`}
                      className="flex justify-between items-center text-sm"
                    >
                      <span>{criterion}:</span>
                      <span className="font-mono">{weight.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Proposed Weights</h4>
                <div className="space-y-2">
                  {Object.entries(proposedWeights).map(
                    ([criterion, weight]) => {
                      const currentWeight = weightSort[criterion] || 0;
                      const change = weight - currentWeight;
                      const isIncrease = change > 0;
                      return (
                        <div
                          key={`proposed-${criterion}`}
                          className="flex justify-between items-center text-sm"
                        >
                          <span>{criterion}:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono">
                              {weight.toFixed(3)}
                            </span>
                            {change !== 0 && (
                              <span
                                className={`text-xs ${isIncrease ? "text-green-600" : "text-red-600"}`}
                              >
                                ({change > 0 ? "+" : ""}
                                {change.toFixed(3)})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="btn btn-sm btn-ghost shadow-none"
                onClick={() => setShowWeightConfirm(false)}
              >
                {hasWeightChanges() ? "Cancel" : "Close"}
              </button>
              {hasWeightChanges() && (
                <button
                  className="btn btn-sm shadow-none btn-neutral"
                  onClick={() => {
                    setWeightSort(proposedWeights);
                    eventTracker({
                      action: "call svm to estimate weights",
                      data: {
                        rank: rankItems,
                        estimatedWeights: proposedWeights,
                      },
                    });
                    setShowWeightConfirm(false);
                  }}
                >
                  Apply Weights
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ActionButtons;
