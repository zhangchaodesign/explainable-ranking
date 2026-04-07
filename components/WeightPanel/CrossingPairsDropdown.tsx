import React, { useEffect } from "react";
import { useInfoPanelConfigStore } from "@/lib/store";

interface CrossingPairsDropdownProps {
  ifOpenInfoPanel?: boolean;
}

const CrossingPairsDropdown = (props: CrossingPairsDropdownProps) => {
  const {
    setInfoId,
    setIsInfoOpen,
    selectedIDs,
    setSelectedIDs,
    crossingPairs,
    setCrossingPairs,
    highlightedPair,
    setHighlightedPair,
  } = useInfoPanelConfigStore();

  // Function to highlight a crossing pair
  const highlightCrossingPair = (id1: string, id2: string) => {
    setHighlightedPair({ id1, id2 });
    setSelectedIDs([parseInt(id1), parseInt(id2)]);
    if (props.ifOpenInfoPanel) {
      setIsInfoOpen(true);
    }
  };

  // Function to clear highlighting
  const clearHighlighting = () => {
    setHighlightedPair(null);
    setSelectedIDs([]);
  };

  useEffect(() => {
    if (selectedIDs.length < 2) {
      setHighlightedPair(null);
    }
  }, [selectedIDs]);

  return (
    <div className="dropdown">
      <div
        tabIndex={0}
        role="button"
        className="btn m-1 bg-white shadow-none hover:bg-gray-100"
      >
        <div className="truncate whitespace-nowrap leading-relaxed">
          {highlightedPair ? (
            <span>
              <span className="text-gray-400 font-medium">Crossing Pair: </span>
              {(() => {
                const foundPair = crossingPairs.find(
                  (pair) =>
                    pair.id1 === highlightedPair.id1 &&
                    pair.id2 === highlightedPair.id2,
                );
                return foundPair
                  ? `${foundPair.name1} × ${foundPair.name2}`
                  : "";
              })()}
            </span>
          ) : (
            "Select a Crossing Pair to Compare"
          )}
        </div>
      </div>
      <div
        tabIndex={0}
        className="dropdown-content z-[1] bg-base-100 rounded-box shadow max-h-48 overflow-y-auto w-full"
      >
        <ul className="menu p-2 w-full">
          <li
            onClick={() => {
              clearHighlighting();
            }}
            className="text-gray-400"
          >
            <a>Clear</a>
          </li>
          {crossingPairs.map((pair, idx) => (
            <li
              key={`pair-${idx}`}
              onClick={() => {
                highlightCrossingPair(pair.id1, pair.id2);
              }}
            >
              <a className="whitespace-nowrap truncate">
                {pair.name2} × {pair.name1}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CrossingPairsDropdown;
