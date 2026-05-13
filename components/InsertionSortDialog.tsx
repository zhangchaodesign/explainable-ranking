"use client";
import React from "react";
import { DataPoint } from "@/lib/type";

interface InsertionSortDialogProps {
  isOpen: boolean;
  onClose: () => void;
  weightSortState: { [key: string]: boolean };
  setWeightSortState: (state: { [key: string]: boolean }) => void;
  gridItems: DataPoint[];
  setRankItems: (items: DataPoint[]) => void;
  setSelectedIDs: (ids: number[]) => void;
  setIsInfoOpen: (isOpen: boolean) => void;
}

const InsertionSortDialog = ({
  isOpen,
  onClose,
  weightSortState,
  setWeightSortState,
  gridItems,
  setRankItems,
  setSelectedIDs,
  setIsInfoOpen,
}: InsertionSortDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[100] transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-900 text-lg">
            Select Sort Criteria
          </h3>
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
              <span className="text-sm font-medium text-gray-700 select-none flex-grow truncate">
                {criterion}
              </span>
            </label>
          ))}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            className="btn btn-sm btn-ghost hover:bg-gray-200 text-gray-600 shadow-none"
            onClick={onClose}
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
              onClose();
            }}
            disabled={!Object.values(weightSortState).some((v) => v)}
          >
            Start Sort
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsertionSortDialog;
