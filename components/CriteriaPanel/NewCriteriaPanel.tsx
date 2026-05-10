"use client";
import React, { useState, useEffect } from "react";
import { Criteria } from "@/lib/type";
import {
  useSharedConfigStore,
  useItemDataStore,
  useIsLoading,
  useCriteriaDataStore,
  useCriteriaPanelStore,
  useWeightPanelStore,
  useOpenAIAPI,
} from "@/lib/store";
import { cn, sortDataPointsBySimilarity, eventTracker } from "@/lib/utils";

interface NewCriteriaPanelProps {
  onClose: () => void;
}

const NewCriteriaPanel = ({ onClose }: NewCriteriaPanelProps) => {
  const { numberKeys, setNumberKeys, imageKey } = useSharedConfigStore();
  const { setIsLoading } = useIsLoading();
  const { items } = useItemDataStore();
  const { criteriaData, setCriteriaData } = useCriteriaDataStore();
  const { setShowCriteriaPanel, currentCriteria, setCurrentCriteria } =
    useCriteriaPanelStore();
  const thisCriteriaData = criteriaData.find(
    (criteria) => criteria.name === currentCriteria,
  );
  const { weightSort, setWeightSort, weightSortState, setWeightSortState } =
    useWeightPanelStore();
  const { apiKey } = useOpenAIAPI();

  const [enableAIPlugin, setEnableAIPlugin] = useState(false);
  const [newCriteria, setNewCriteria] = useState<Criteria>({
    name: "",
    explanation: "",
    groups: {
      positive: {
        1: [],
      },
      neutral: items,
      negative: {
        1: [],
      },
    },
    similarity: [],
    relevance: "",
    normalized: false,
  });

  const stringKeys = useSharedConfigStore((state) => state.stringKeys).filter(
    (key) => key !== imageKey,
  );
  const handleStringClick = (key: string) => {
    setNewCriteria({
      ...newCriteria,
      relevance: key,
    });
  };

  const processItemSorting = async () => {
    let sortedItems = items;
    let similarity: {
      id: number;
      score: number;
    }[] = [];

    if (newCriteria.relevance.length > 0) {
      await sortDataPointsBySimilarity(
        items,
        newCriteria.name + ": " + newCriteria.explanation,
        newCriteria.relevance,
        imageKey,
      ).then((res) => {
        similarity = res;
        sortedItems = [...items].sort((a, b) => {
          const foundA = res.find((r) => r.id === a.id);
          const foundB = res.find((r) => r.id === b.id);

          if (!foundA || !foundB) {
            console.warn("No score found for the item:", { a, b });
            return 0;
          }

          if (foundA.score === undefined || foundB.score === undefined) {
            console.warn("Undefined score:", { foundA, foundB });
            return 0;
          }

          return foundB.score - foundA.score;
        });
      });
    }

    return { sortedItems, similarity };
  };

  const handleUpdateCriteria = async () => {
    if (!newCriteria.name || !thisCriteriaData) {
      alert("Please enter a name for the criteria.");
      return;
    }

    setIsLoading(true);
    const { sortedItems, similarity } = await processItemSorting();

    // Update existing criteria
    setCriteriaData(
      criteriaData.map((criteria) =>
        criteria.name === thisCriteriaData.name
          ? {
              ...criteria,
              name: newCriteria.name,
              explanation: newCriteria.explanation,
              relevance: newCriteria.relevance,
              similarity: similarity,
              isCustom: true,
              groups: {
                ...thisCriteriaData.groups,
                neutral: sortedItems.filter((item) =>
                  thisCriteriaData.groups.neutral.find((i) => i.id === item.id),
                ),
              },
            }
          : criteria,
      ),
    );

    // Handle weight sort for UPDATE: transfer weight from old name to new name
    if (thisCriteriaData.name !== newCriteria.name) {
      const newWeightSort = { ...weightSort };
      const newWeightSortState = { ...weightSortState };

      // Transfer weight from old criteria name to new criteria name
      const oldWeight = newWeightSort[thisCriteriaData.name];
      delete newWeightSort[thisCriteriaData.name];
      delete newWeightSortState[thisCriteriaData.name];

      newWeightSort[newCriteria.name] = oldWeight || 1;
      newWeightSortState[newCriteria.name] = true;

      setWeightSort(newWeightSort);
      setWeightSortState(newWeightSortState);
    }

    // Remove old criteria name from numberKeys
    setNumberKeys(numberKeys.filter((key) => key !== thisCriteriaData.name));

    eventTracker({
      action: "update criteria",
      data: {
        ...thisCriteriaData,
        name: newCriteria.name,
        explanation: newCriteria.explanation,
        relevance: newCriteria.relevance,
        similarity: similarity,
        groups: {
          ...thisCriteriaData.groups,
          neutral: sortedItems.filter((item) =>
            thisCriteriaData.groups.neutral.find((i) => i.id === item.id),
          ),
        },
      },
    });

    setCurrentCriteria(newCriteria.name);
    setShowCriteriaPanel(true);
    setIsLoading(false);
    onClose();
  };

  const handleAddCriteria = async () => {
    if (!newCriteria.name) {
      alert("Please enter a name for the new criteria.");
      return;
    }

    setIsLoading(true);
    const { sortedItems, similarity } = await processItemSorting();

    setCriteriaData([
      ...criteriaData,
      {
        ...newCriteria,
        groups: {
          ...newCriteria.groups,
          neutral: sortedItems,
        },
        similarity: similarity,
        isCustom: true,
      },
    ]);

    // Handle weight sort for ADD: set initial weight
    setWeightSort({
      ...weightSort,
      [newCriteria.name]: 1,
    });
    setWeightSortState({
      ...weightSortState,
      [newCriteria.name]: true,
    });

    eventTracker({
      action: "add criteria",
      data: {
        ...newCriteria,
        groups: {
          ...newCriteria.groups,
          neutral: sortedItems,
        },
        similarity: similarity,
      },
    });

    setCurrentCriteria(newCriteria.name);
    setShowCriteriaPanel(true);
    setIsLoading(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (thisCriteriaData) {
      await handleUpdateCriteria();
    } else {
      await handleAddCriteria();
    }
  };

  useEffect(() => {
    if (thisCriteriaData) {
      setNewCriteria({
        name: thisCriteriaData.name,
        explanation: thisCriteriaData.explanation,
        groups: thisCriteriaData.groups,
        similarity: thisCriteriaData.similarity,
        relevance: thisCriteriaData.relevance,
      });
    }
  }, [currentCriteria]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md space-y-4">
        <div className="w-full flex flex-row justify-between items-center">
          <h2 className="text-lg font-semibold">🎨 Add a New Criterion</h2>
        </div>

        <div className="flex gap-2 items-center justify-between">
          <input
            type="text"
            value={newCriteria.name}
            placeholder="Name"
            onChange={(event) => {
              setNewCriteria({
                ...newCriteria,
                name: event.target.value,
              });
            }}
            className="input input-sm input-bordered w-24 text-sm"
          />
          <input
            type="text"
            value={newCriteria.explanation}
            placeholder="Description (optional)..."
            onChange={(event) => {
              setNewCriteria({
                ...newCriteria,
                explanation: event.target.value,
              });
            }}
            className="input input-sm input-bordered text-sm w-full"
          />
        </div>

        <div className="flex flex-col justify-start items-start gap-2">
          <div className="flex gap-2 justify-center items-center">
            <button
              className={cn(
                "btn btn-sm shadow-none btn-soft btn-warning",
                enableAIPlugin && "btn-active",
                !apiKey && "btn-disabled opacity-50",
              )}
              onClick={() => {
                setEnableAIPlugin(!enableAIPlugin);
              }}
              disabled={!apiKey}
            >
              Enable AI Plugin for Relevance Sorting (Beta)
            </button>
          </div>
          {enableAIPlugin && (
            <div className="flex flex-wrap gap-2">
              {/* <button
                onClick={() => handleStringClick("image")}
                className={`btn btn-sm border shadow-none border-gray-100 font-medium ${
                  newCriteria.relevance === "image"
                    ? "btn-neutral"
                    : "btn-outline text-gray-400 bg-white"
                }`}
              >
                image
              </button> */}
              {stringKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => handleStringClick(key)}
                  className={`btn btn-sm border shadow-none border-gray-100 font-medium ${
                    newCriteria.relevance === key
                      ? "btn-neutral"
                      : "btn-outline text-gray-400 bg-white"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-row gap-2">
          <button className="btn btn-sm grow text-xs" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-sm shadow-none btn-neutral grow text-xs"
            onClick={handleSubmit}
          >
            {thisCriteriaData ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewCriteriaPanel;
