"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  useCriteriaDataStore,
  useItemDataStore,
  useReasonPanelConfigStore,
  useSharedConfigStore,
} from "@/lib/store";
import { noto_serif } from "@/app/fonts";

const ReasonPanel = () => {
  const contentRef = useRef<HTMLDivElement>(null);

  const { items } = useItemDataStore();
  const {
    reasonReference,
    setShowReasonPanel,
    currentConflits,
    setCurrentConflits,
    newComparisons,
    setNewComparisons,
  } = useReasonPanelConfigStore();
  const { criteriaData, setCriteriaData } = useCriteriaDataStore();
  const { cardKey, setIsNewCriteriaOpen } = useSharedConfigStore();

  const [selectedOption, setSelectedOption] = useState("");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setShowReasonPanel(false);
        setCurrentConflits([]);
        setNewComparisons([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const thisItem = items.find((a) => a["id"] === reasonReference);

  if (!thisItem) {
    console.log("No item found");
    return null;
  }

  const handleNewCriteria = async () => {
    setIsNewCriteriaOpen(true);
    setShowReasonPanel(false);
    setCurrentConflits([]);
    setNewComparisons([]);
  };

  return (
    <div className="w-full h-full flex items-center justify-center absolute">
      <div
        ref={contentRef}
        className="flex flex-col gap-4 p-6 bg-white rounded-lg border-2 w-[512px] select-none"
      >
        <p className={noto_serif.className + " font-medium text-lg"}>
          🎯 Why did you move {cardKey ? thisItem[cardKey] : thisItem["id"]} to
          this new place?
        </p>

        {newComparisons.length > 0 && (
          <div className="w-full p-3 bg-neutral-50 rounded-lg flex flex-col gap-2 max-h-40 overflow-y-auto">
            <p className="text-sm font-medium">💡 New comparisons found!</p>
            {newComparisons.map((comprison, index) => (
              <div
                key={index}
                className="p-3 bg-sky-50 rounded-lg animate-fade-in"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-sky-700 ">
                    #
                    {items.find((a) => a["id"] === comprison[0])?.[cardKey] ||
                      comprison[0]}{" "}
                    vs #
                    {items.find((a) => a["id"] === comprison[1])?.[cardKey] ||
                      comprison[1]}
                  </span>
                  <span className="text-gray-500">→</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sky-600">
                      {items.find((a) => a["id"] === comprison[2])?.[cardKey] ||
                        comprison[2]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {currentConflits.length > 0 && (
          <div className="w-full p-3 bg-neutral-50 rounded-lg flex flex-col gap-2 max-h-40 overflow-y-auto">
            <p className="text-sm font-medium">💡 Conflicts found!</p>
            {currentConflits.map((conflict, index) => (
              <div
                key={index}
                className="p-3 bg-rose-50 rounded-lg animate-fade-in"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-rose-700 ">
                    #
                    {items.find((a) => a["id"] === conflict.pair[0])?.[
                      cardKey
                    ] || conflict.pair[0]}{" "}
                    vs #
                    {items.find((a) => a["id"] === conflict.pair[1])?.[
                      cardKey
                    ] || conflict.pair[1]}
                  </span>
                  <span className="text-gray-500">→</span>
                  <div className="flex items-center gap-1">
                    <span className="line-through text-rose-500">
                      {items.find((a) => a["id"] === conflict.previous)?.[
                        cardKey
                      ] || conflict.previous}
                    </span>
                    <span className="text-emerald-600 ">
                      →{" "}
                      {items.find((a) => a["id"] === conflict.new)?.[cardKey] ||
                        conflict.new}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* <div className="flex flex-col gap-3 w-full">
          {criteriaData.map(
            (criteria) =>
              criteria.name && (
                <div
                  className="flex flex-col gap-2"
                  key={criteriaData.indexOf(criteria)}
                >
                  <div className="flex gap-2 items-center">
                    <input
                      type="radio"
                      name="reason"
                      value={criteria.name}
                      checked={selectedOption === criteria.name}
                      onChange={() => setSelectedOption(criteria.name)}
                      className="radio radio-md"
                    />
                    <p>{criteria.name}</p>
                  </div>
                  {selectedOption === criteria.name && criteria.explanation && (
                    <div className="p-4 text-sm font-medium rounded-md flex flex-col gap-4 bg-rose-700 text-white w-full">
                      {criteria.explanation || ""}
                    </div>
                  )}
                </div>
              ),
          )}
        </div> */}

        <div className="flex flex-row gap-2">
          <div className="flex gap-2 items-center">
            <button
              className="btn btn-sm text-xs btn-secondary btn-soft"
              onClick={handleNewCriteria}
            >
              Add a New Criteria?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReasonPanel;
