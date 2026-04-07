"use client";
import React, { useEffect, useState } from "react";
import MiniGallery from "@/components/CriteriaPanel/MiniGallery";
import MiniList from "@/components/CriteriaPanel/MiniList";
// import WeightsBarChart from "@/components/WeightPanel/WeightsBarChart";
import {
  useItemDataStore,
  useCriteriaPanelStore,
  useCriteriaDataStore,
  useSharedConfigStore,
  useSortStore,
  useIsLoading,
  // useOpenAIAPI,
  useSVMResultStore,
  useReasonPanelConfigStore,
} from "@/lib/store";
import { TbX } from "react-icons/tb";
import { DataPoint } from "@/lib/type";
import { aggregateScore, rankingSVMWithGroups } from "@/lib/svm";
import { concatItemFields, eventTracker } from "@/lib/utils";

interface CriteriaPanelProps {
  zIndex?: number;
  onClick?: () => void;
}

const CriteriaPanel = ({ zIndex = 20, onClick }: CriteriaPanelProps) => {
  // Dynamic state for weights
  const [weights, setWeights] = useState<{ [key: string]: number }>({});

  const { setItems, items } = useItemDataStore();

  // State for multi-select
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const [inferResult, setInferResult] = useState<
    | {
        [key: number]: number;
      }
    | undefined
  >(undefined);

  const { numberKeys, setNumberKeys, setIsNewCriteriaOpen } =
    useSharedConfigStore();
  const { criteriaData, setCriteriaData, updateGroupByCriteriaAndKey } =
    useCriteriaDataStore();
  const {
    showCriteriaPanel,
    setShowCriteriaPanel,
    currentCriteria,
    setCurrentCriteria,
  } = useCriteriaPanelStore();

  const thisCriteriaData = criteriaData.find(
    (criteria) => criteria.name === currentCriteria,
  );

  // Check if current criterion was added through NewCriteriaPanel
  const isCustomCriteria = thisCriteriaData?.isCustom === true;

  const updateCriteriaData = () => {
    const newItems = useItemDataStore.getState().items.map((item) => {
      let newItem = { ...item }; // Create a new object

      thisCriteriaData?.groups.neutral.forEach((groupItem) => {
        if (groupItem.id === item.id) {
          newItem[currentCriteria] = 0;
        }
      });

      Object.entries(thisCriteriaData?.groups.positive || {}).forEach(
        ([key, group]) => {
          group.forEach((groupItem) => {
            if (groupItem.id === item.id) {
              newItem[currentCriteria] = parseFloat(key);
            }
          });
        },
      );

      Object.entries(thisCriteriaData?.groups.negative || {}).forEach(
        ([key, group]) => {
          group.forEach((groupItem) => {
            if (groupItem.id === item.id) {
              newItem[currentCriteria] = -parseFloat(key);
            }
          });
        },
      );
      return newItem;
    });

    setItems(newItems);

    const newNumberKeys = !numberKeys.includes(currentCriteria)
      ? [...useSharedConfigStore.getState().numberKeys, currentCriteria]
      : numberKeys;
    if (!numberKeys.includes(currentCriteria)) {
      setNumberKeys(newNumberKeys);
    }

    eventTracker({
      action: "update criteria groups",
      data: thisCriteriaData || {},
    });
  };

  useEffect(() => {
    if (showCriteriaPanel)
      eventTracker({
        action: "open criteria panel",
        data: {
          criterion: currentCriteria,
        },
      });
    else eventTracker({ action: "close criteria panel", data: {} });
  }, [showCriteriaPanel, currentCriteria]);

  // Handle keyboard actions for selected thisItems
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process if there are selected items
      if (selectedItems.length === 0) return;

      // Escape to clear selection
      if (e.key === "Escape") {
        e.preventDefault(); // Prevent default escape behavior
        e.stopPropagation(); // Stop event propagation
        setSelectedItems([]);
      }

      // Listen for number keydown events, move selected items to the corresponding group
      if (e.key.match(/[0-9]/)) {
        console.log("Pressed p key", e.key);
        e.preventDefault(); // Prevent default number key behavior
        e.stopPropagation(); // Stop event propagation

        const criteriaData = useCriteriaDataStore.getState().criteriaData;
        const currentCriteria =
          useCriteriaPanelStore.getState().currentCriteria;
        const thisCriteriaData = criteriaData.find(
          (criteria) => criteria.name === currentCriteria,
        );

        if (!thisCriteriaData) return;

        const group = parseFloat(e.key);
        if (group > Object.keys(thisCriteriaData.groups.positive).length)
          return;

        // First, remove selected items from all groups
        const updatedNeutrals = thisCriteriaData.groups.neutral.filter(
          (item) => !selectedItems.includes(item.id),
        );
        const updatedPositives = Object.keys(
          thisCriteriaData.groups.positive,
        ).reduce(
          (acc, key) => {
            acc[parseFloat(key)] = thisCriteriaData.groups.positive[
              parseFloat(key)
            ].filter((item) => !selectedItems.includes(item.id));
            return acc;
          },
          {} as { [key: number]: DataPoint[] },
        );
        const updatedNegatives = Object.keys(
          thisCriteriaData.groups.negative,
        ).reduce(
          (acc, key) => {
            acc[parseFloat(key)] = thisCriteriaData.groups.negative[
              parseFloat(key)
            ].filter((item) => !selectedItems.includes(item.id));
            return acc;
          },
          {} as { [key: number]: DataPoint[] },
        );

        // Then, add selected items to the corresponding group in positive groups
        updatedPositives[group] = [
          ...updatedPositives[group],
          selectedItems.map((id) =>
            items.find((item) => item.id === id),
          ) as DataPoint[],
        ].flat();

        // Update the criteria data with the new groups
        const updatedCriteriaData = criteriaData.map((criteria) => {
          if (criteria.name === currentCriteria) {
            return {
              ...criteria,
              groups: {
                positive: updatedPositives,
                neutral: updatedNeutrals,
                negative: updatedNegatives,
              },
            };
          }
          return criteria;
        });

        // Update the store with the new criteria data
        useCriteriaDataStore.setState({ criteriaData: updatedCriteriaData });

        // Optionally, you might want to keep focus on the active element
        if (document.activeElement) {
          (document.activeElement as HTMLElement).focus();
        }
      }

      if (e.key.match(/[0-9]/) && e.ctrlKey) {
        console.log("Pressed shiftKey key");
        e.preventDefault(); // Prevent default number key behavior
        e.stopPropagation(); // Stop event propagation

        const criteriaData = useCriteriaDataStore.getState().criteriaData;
        const currentCriteria =
          useCriteriaPanelStore.getState().currentCriteria;
        const thisCriteriaData = criteriaData.find(
          (criteria) => criteria.name === currentCriteria,
        );

        if (!thisCriteriaData) return;

        const group = parseFloat(e.key);
        if (group > Object.keys(thisCriteriaData.groups.negative).length)
          return;

        // First, remove selected items from all groups
        const updatedNeutrals = thisCriteriaData.groups.neutral.filter(
          (item) => !selectedItems.includes(item.id),
        );
        const updatedPositives = Object.keys(
          thisCriteriaData.groups.positive,
        ).reduce(
          (acc, key) => {
            acc[parseFloat(key)] = thisCriteriaData.groups.positive[
              parseFloat(key)
            ].filter((item) => !selectedItems.includes(item.id));
            return acc;
          },
          {} as { [key: number]: DataPoint[] },
        );
        const updatedNegatives = Object.keys(
          thisCriteriaData.groups.negative,
        ).reduce(
          (acc, key) => {
            acc[parseFloat(key)] = thisCriteriaData.groups.negative[
              parseFloat(key)
            ].filter((item) => !selectedItems.includes(item.id));
            return acc;
          },
          {} as { [key: number]: DataPoint[] },
        );

        // Then, add selected items to the corresponding group in positive groups
        updatedNegatives[group] = [
          ...updatedNegatives[group],
          selectedItems.map((id) =>
            items.find((item) => item.id === id),
          ) as DataPoint[],
        ].flat();

        // Update the criteria data with the new groups
        const updatedCriteriaData = criteriaData.map((criteria) => {
          if (criteria.name === currentCriteria) {
            return {
              ...criteria,
              groups: {
                positive: updatedPositives,
                neutral: updatedNeutrals,
                negative: updatedNegatives,
              },
            };
          }
          return criteria;
        });

        // Update the store with the new criteria data
        useCriteriaDataStore.setState({ criteriaData: updatedCriteriaData });

        // Optionally, you might want to keep focus on the active element
        if (document.activeElement) {
          (document.activeElement as HTMLElement).focus();
        }
      }
    };

    // Use capture phase to ensure our handler runs first
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [selectedItems, items]);

  return (
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center"
      style={{ zIndex }}
      onClick={onClick}
    >
      <div
        className="flex flex-col gap-3 p-4 bg-white rounded-lg border-2 w-[1200px] select-none relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start w-full justify-between">
          <div className="flex flex-row gap-8">
            <div className="flex flex-row gap-2">
              <div className="dropdown dropdown-bottom">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-sm bg-white shadow-none hover:bg-gray-100 border border-gray-100 justify-start"
                >
                  <span className="text-gray-400 font-medium">
                    Current Add-on Criterion:{" "}
                  </span>
                  <span className="text-gray-800">{currentCriteria}</span>
                </div>
                <ul
                  tabIndex={1}
                  className="menu dropdown-content bg-base-100 rounded-box z-[1] w-48 p-2 shadow gap-2 mt-2 max-h-48 flex-nowrap overflow-y-auto overflow-x-hidden"
                >
                  {criteriaData.map((criteria) => (
                    <li
                      key={criteriaData.indexOf(criteria)}
                      className="w-full"
                      onClick={(e) => {
                        updateCriteriaData();
                        setCurrentCriteria(criteria.name);
                        setInferResult(undefined);
                      }}
                    >
                      <a
                        className={`block w-full ${currentCriteria === criteria.name ? "active" : ""} !overflow-visible`}
                      >
                        <div className="flex justify-between items-center w-full min-w-0">
                          <span className="truncate">{criteria.name}</span>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              {thisCriteriaData && thisCriteriaData.explanation && (
                <div className="p-4 py-2 text-xs font-medium rounded-md bg-sky-700 text-white flex items-center">
                  {thisCriteriaData.explanation}
                </div>
              )}
              <button
                onClick={() => {
                  updateCriteriaData();
                  setShowCriteriaPanel(false);
                  setIsNewCriteriaOpen(true);
                }}
                className="btn btn-sm"
                disabled={items.length === 0}
              >
                Edit
              </button>
              <button
                onClick={() => {
                  updateCriteriaData();
                  setShowCriteriaPanel(false);
                  setIsNewCriteriaOpen(true);
                  setCurrentCriteria("");
                }}
                className="btn btn-sm btn-secondary btn-soft"
                disabled={items.length === 0}
              >
                New Criterion
              </button>
            </div>
          </div>

          <div
            onClick={() => {
              updateCriteriaData();
              setShowCriteriaPanel(false);
              setCurrentCriteria("");
            }}
            className="cursor-pointer"
          >
            <TbX size={20} />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 h-full w-full">
          {thisCriteriaData?.groups.neutral && (
            <div className="h-full relative flex-none col-span-1">
              <MiniList
                direction="vertical"
                classes="overflow-auto relative bg-gray-50 p-2 rounded-lg h-[530px] border"
                thisItems={thisCriteriaData?.groups.neutral}
                setItems={updateGroupByCriteriaAndKey(
                  currentCriteria,
                  "neutral",
                )}
                inferResult={inferResult}
                mini={true}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
              />
              <div className="absolute bottom-2 right-2 px-3 py-2 text-xs bg-gray-200/40 backdrop-blur-lg text-gray-800 rounded-md font-medium ">
                Neutral (0)
              </div>
              {/* {
                // If weights is not empty, display the WeightsBarChart
                Object.keys(weights).length > 0 && (
                  <WeightsBarChart
                    weights={weights}
                    classes="absolute bottom-16 left-2 backdrop-blur-lg bg-gray-50/40 w-56 h-20"
                    draggable={false}
                  />
                )
              } */}
            </div>
          )}

          <div className="flex flex-col gap-3 col-span-4">
            <div className="flex flex-col gap-2">
              <button
                className="btn btn-sm btn-soft btn-success"
                onClick={() => {
                  // Add a new group to the positive groups
                  let newKey = 1;
                  // Check if newKey already exists, if so, increment it
                  while (
                    Object.keys(
                      thisCriteriaData?.groups.positive || {},
                    ).includes(newKey.toString())
                  ) {
                    newKey++;
                  }
                  // console.log("newKey", newKey);

                  setCriteriaData(
                    criteriaData.map((criteria) => {
                      if (criteria.name === currentCriteria) {
                        return {
                          ...criteria,
                          groups: {
                            ...criteria.groups,
                            positive: {
                              ...criteria.groups.positive,
                              [newKey]: [],
                            },
                          },
                        };
                      }
                      return criteria;
                    }),
                  );
                }}
              >
                Add a new positive group
              </button>
              <div className="flex flex-row gap-2 overflow-x-auto">
                {
                  // Iterate through all groups and display them
                  Object.entries(thisCriteriaData?.groups.positive || {})
                    .sort(
                      ([a], [b]) =>
                        Math.abs(parseFloat(b)) - Math.abs(parseFloat(a)),
                    )
                    .map(([key, group], index) => (
                      <div key={key} className="relative">
                        <MiniList
                          classes="overflow-auto relative bg-gray-50 p-2 rounded-lg h-[212px] min-w-64 border"
                          thisItems={group}
                          setItems={updateGroupByCriteriaAndKey(
                            currentCriteria,
                            "positive",
                            parseFloat(key),
                          )}
                          inferResult={inferResult}
                          mini={true}
                          selectedItems={selectedItems}
                          setSelectedItems={setSelectedItems}
                        />
                        <div className="absolute bottom-2 right-2 px-3 py-2 text-xs bg-emerald-200/40 backdrop-blur-lg text-emerald-800 rounded-md font-medium flex justify-center items-center gap-1">
                          <span>+</span>
                          <span
                            className="w-5 inline-block text-center bg-white/30 rounded-sm overflow-x-auto whitespace-nowrap"
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            onBlur={(e) => {
                              const newKey = parseFloat(
                                e.currentTarget.innerText,
                              );
                              if (isNaN(newKey)) return;
                              console.log(newKey);
                              setCriteriaData(
                                criteriaData.map((criteria) => {
                                  if (criteria.name === currentCriteria) {
                                    if (
                                      Object.keys(
                                        criteria?.groups.positive,
                                      ).includes(newKey.toString())
                                    )
                                      return criteria;

                                    const newGroups = {
                                      ...criteria.groups.positive,
                                    };
                                    newGroups[newKey] =
                                      newGroups[parseFloat(key)];
                                    delete newGroups[parseFloat(key)];
                                    return {
                                      ...criteria,
                                      groups: {
                                        ...criteria.groups,
                                        positive: newGroups,
                                      },
                                    };
                                  }
                                  return criteria;
                                }),
                              );
                            }}
                          >
                            {key}
                          </span>
                        </div>
                      </div>
                    ))
                }
              </div>
            </div>
            <hr className="border-gray-100" />
            <div className="flex flex-col gap-2">
              <button
                className="btn btn-sm btn-soft btn-error"
                onClick={() => {
                  // Add a new group to the negative groups
                  let newKey = 1;
                  // Check if newKey already exists, if so, increment it
                  while (
                    Object.keys(
                      thisCriteriaData?.groups.negative || {},
                    ).includes(newKey.toString())
                  ) {
                    newKey++;
                  }
                  // console.log("newKey", newKey);

                  setCriteriaData(
                    criteriaData.map((criteria) => {
                      if (criteria.name === currentCriteria) {
                        return {
                          ...criteria,
                          groups: {
                            ...criteria.groups,
                            negative: {
                              ...criteria.groups.negative,
                              [newKey]: [],
                            },
                          },
                        };
                      }
                      return criteria;
                    }),
                  );
                }}
              >
                Add a new negative group
              </button>
              <div className="flex flex-row gap-2 overflow-x-auto">
                {
                  // Iterate through all groups and display them,k
                  Object.entries(thisCriteriaData?.groups.negative || {})
                    .sort(
                      ([a], [b]) =>
                        Math.abs(parseFloat(b)) - Math.abs(parseFloat(a)),
                    )
                    .map(([key, group], index) => (
                      <div key={key} className="relative">
                        <MiniList
                          classes="overflow-auto relative bg-gray-50 p-2 rounded-lg h-[212px] min-w-64 border"
                          thisItems={group}
                          setItems={updateGroupByCriteriaAndKey(
                            currentCriteria,
                            "negative",
                            parseFloat(key),
                          )}
                          inferResult={inferResult}
                          mini={true}
                          selectedItems={selectedItems}
                          setSelectedItems={setSelectedItems}
                        />
                        <div className="absolute bottom-2 right-2 px-3 py-2 text-xs bg-pink-200/40 backdrop-blur-lg text-pink-800 rounded-md font-medium flex justify-center items-center gap-1">
                          <span>-</span>
                          <span
                            className="w-5 inline-block text-center bg-white/30 rounded-sm overflow-x-auto whitespace-nowrap"
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            onBlur={(e) => {
                              const newKey = parseFloat(
                                e.currentTarget.innerText,
                              );
                              console.log(newKey);
                              if (isNaN(newKey)) return;
                              setCriteriaData(
                                criteriaData.map((criteria) => {
                                  if (criteria.name === currentCriteria) {
                                    if (
                                      Object.keys(
                                        criteria?.groups.negative,
                                      ).includes(newKey.toString())
                                    )
                                      return criteria;

                                    const newGroups = {
                                      ...criteria.groups.negative,
                                    };
                                    newGroups[newKey] =
                                      newGroups[parseFloat(key)];
                                    delete newGroups[parseFloat(key)];
                                    return {
                                      ...criteria,
                                      groups: {
                                        ...criteria.groups,
                                        negative: newGroups,
                                      },
                                    };
                                  }
                                  return criteria;
                                }),
                              );
                            }}
                          >
                            {key}
                          </span>
                        </div>
                      </div>
                    ))
                }
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-row w-full justify-between items-end">
          <div className="flex flex-row gap-2 justify-between w-full items-end">
            <div className="flex gap-4 items-end">
              <div className="flex flex-row gap-2 items-end">
                <button
                  className="btn btn-sm"
                  disabled={
                    !thisCriteriaData?.groups.neutral.length ||
                    thisCriteriaData?.groups.neutral.length >
                      items.length - 3 ||
                    thisCriteriaData?.groups.neutral.length === 0 ||
                    Object.keys(thisCriteriaData?.groups.positive || {}).filter(
                      (key) =>
                        Object.keys(
                          thisCriteriaData?.groups.positive[key as any] || {},
                        ).length > 0,
                    ).length +
                      Object.keys(
                        thisCriteriaData?.groups.negative || {},
                      ).filter(
                        (key) =>
                          Object.keys(
                            thisCriteriaData?.groups.negative[key as any] || {},
                          ).length > 0,
                      ).length <
                      2
                      ? true
                      : false || criteriaData.length === 0
                  }
                  onClick={async () => {
                    // Extract ids from all groups, big key come first, in [[], []] format
                    const positiveGroups = Object.entries(
                      thisCriteriaData?.groups.positive || {},
                    )
                      .map(([key, group]) => group.map((item) => item.id))
                      .reverse();

                    const negativeGroups = Object.entries(
                      thisCriteriaData?.groups.negative || {},
                    ).map(([key, group]) => group.map((item) => item.id));

                    const neutralGroup =
                      thisCriteriaData?.groups.neutral.map((item) => item.id) ||
                      [];

                    const allGroups = [
                      ...positiveGroups,
                      // neutralGroup,
                      ...negativeGroups,
                    ];

                    await rankingSVMWithGroups(allGroups, currentCriteria).then(
                      (result) => {
                        setWeights(result.weights);
                        const items = useItemDataStore.getState().items;
                        thisCriteriaData?.groups.neutral.sort((a, b) => {
                          const itemB = items.find((item) => item.id === b.id);
                          if (!itemB) return 0;
                          console.log("itemB", itemB);
                          const scoreB = aggregateScore(
                            itemB,
                            result.weights,
                          ).score;
                          console.log("scoreB", scoreB);
                          const itemA = items.find((item) => item.id === a.id);
                          if (!itemA) return 0;
                          console.log("itemA", itemA);
                          const scoreA = aggregateScore(
                            itemA,
                            result.weights,
                          ).score;
                          console.log("scoreA", scoreA);
                          return scoreB - scoreA;
                        });
                        console.log(
                          "thisCriteriaData?.groups.neutral",
                          thisCriteriaData?.groups.neutral,
                        );
                      },
                    );

                    eventTracker({
                      action: "call svm to reorder neutral items",
                      data: {
                        criterion: currentCriteria,
                        groups: allGroups,
                      },
                    });
                  }}
                >
                  Reorder Neutral Items
                </button>

                {/* <div className="h-12 flex items-center p-4 py-2 text-sm rounded-md bg-gray-600 text-white w-48 overflow-x-auto">
                  {weights && (
                    <div className="flex flex-row whitespace-nowrap gap-1">
                      <span className="font-medium">Learned Weights: </span>
                      {Object.keys(weights).map((key) => (
                        <span key={key} className="flex flex-col gap-2">
                          <span className="text-sm flex flex-row gap-1 items-center justify-center">
                            <span>{key} /</span>
                            <span className="text-base-300">
                              {weights[key].toFixed(2)}
                            </span>
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div> */}
              </div>
            </div>

            <div className="flex flex-row gap-2 items-center justify-between">
              {/* Normalize toggle with range */}
              {isCustomCriteria && (
                <div className="form-control">
                  <div className="flex gap-2">
                    <label className="cursor-pointer label justify-start gap-2 py-2">
                      <input
                        type="checkbox"
                        checked={thisCriteriaData?.normalized ?? false}
                        onChange={(e) => {
                          setCriteriaData(
                            criteriaData.map((criteria) => {
                              if (criteria.name === currentCriteria) {
                                return {
                                  ...criteria,
                                  normalized: e.target.checked,
                                  normalizeRange: e.target.checked
                                    ? criteria.normalizeRange ?? [0, 1]
                                    : criteria.normalizeRange,
                                };
                              }
                              return criteria;
                            }),
                          );
                        }}
                        className="checkbox checkbox-sm"
                      />
                      <span className="label-text text-xs">Normalize</span>
                    </label>
                    {thisCriteriaData?.normalized && (
                      <div className="ml-2 flex items-center gap-2 border-x px-2">
                        <span className="text-xs text-gray-500">Range:</span>
                        <input
                          type="number"
                          step="0.01"
                          value={thisCriteriaData?.normalizeRange?.[0] ?? 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setCriteriaData(
                              criteriaData.map((criteria) => {
                                if (criteria.name === currentCriteria) {
                                  return {
                                    ...criteria,
                                    normalizeRange: [
                                      value,
                                      criteria.normalizeRange?.[1] ?? 1,
                                    ],
                                  };
                                }
                                return criteria;
                              }),
                            );
                          }}
                          className="input input-xs w-16 border-gray-200"
                          placeholder="Min"
                        />
                        <span className="text-xs text-gray-400">to</span>
                        <input
                          type="number"
                          step="0.01"
                          value={thisCriteriaData?.normalizeRange?.[1] ?? 1}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setCriteriaData(
                              criteriaData.map((criteria) => {
                                if (criteria.name === currentCriteria) {
                                  return {
                                    ...criteria,
                                    normalizeRange: [
                                      criteria.normalizeRange?.[0] ?? 0,
                                      value,
                                    ],
                                  };
                                }
                                return criteria;
                              }),
                            );
                          }}
                          className="input input-xs w-16 border-gray-200"
                          placeholder="Max"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                className="btn btn-sm btn-neutral btn-soft"
                onClick={async () => {
                  updateCriteriaData();
                  setShowCriteriaPanel(false);
                  setCurrentCriteria("");
                  // await rankingSVM();
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriteriaPanel;
