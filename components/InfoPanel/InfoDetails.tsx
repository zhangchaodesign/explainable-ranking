import React, { useState, useMemo } from "react";
import Image from "next/image";
import { aggregateScore } from "@/lib/svm";
import { cn, sum, eventTracker } from "@/lib/utils";
import { DataPoint } from "@/lib/type";
import { noto_serif } from "@/app/fonts";
import GeneralEntry from "@/components/InfoPanel/Field/GeneralEntry";
import {
  useItemDataStore,
  useInfoPanelConfigStore,
  useSharedConfigStore,
  useWeightPanelStore,
  useCriteriaDataStore,
  useCriteriaPanelStore,
} from "@/lib/store";
import {
  DetailDescriptionField,
  DetailDescriptionFieldColors,
} from "@/components/InfoPanel/Field/DetailDescriptionField";
import NumberEntry from "@/components/InfoPanel/Field/NumberEntry";
import ItemPopup from "@/components/RankingPanel/ItemPopup";

interface InfoProps {
  item: DataPoint;
  ifOpenCriteriaDetails: boolean;
  setIfOpenCriteriaDetails: React.Dispatch<React.SetStateAction<boolean>>;
  classes?: string;
  popupItem: DataPoint | null;
  setPopupItem: React.Dispatch<React.SetStateAction<DataPoint | null>>;
  popupOpen: boolean;
  setPopupOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPopupPosition: React.Dispatch<
    React.SetStateAction<{ x: number; y: number }>
  >;
}

const Info = (props: InfoProps) => {
  const { rankItems } = useItemDataStore();
  const { criteriaData, setCriteriaData } = useCriteriaDataStore();
  const { conflictingIds } = useSharedConfigStore();
  const { updateItemById } = useItemDataStore();
  const { infoId, removeID, selectedIDs } = useInfoPanelConfigStore();

  const {
    videoKey,
    linkKey,
    fileKey,
    cardKey,
    imageKey,
    displayedStringKeys,
    setDisplayedStringKeys,
  } = useSharedConfigStore();
  const numberKeys = useSharedConfigStore((state) => state.numberKeys).filter(
    (key) => key !== "id" && key !== "order",
  );
  const stringKeys = useSharedConfigStore((state) => state.stringKeys).filter(
    (key) => key !== imageKey,
  );

  // const overall = useMemo(() => {
  //   return sum(...numberKeys.map((key) => props.item[key] as number))?.toFixed(
  //     2,
  //   );
  // }, [props.item]);

  const { weightSort } = useWeightPanelStore();
  const customSort = useMemo(() => {
    return aggregateScore(props.item).score.toFixed(2);
  }, [props.item, weightSort]);

  const showPreferButton = useMemo(() => {
    // if selectedIDs contains one from rankItems and another not in rankItems but in gridItems
    const selectedIDs = useInfoPanelConfigStore.getState().selectedIDs;
    const gridItems = useItemDataStore.getState().gridItems;
    const rankItems = useItemDataStore.getState().rankItems;
    const selectedRankItems = selectedIDs.filter((id) =>
      rankItems.some((item) => item.id === id),
    );
    const selectedGridItems = selectedIDs.filter(
      (id) =>
        gridItems.some((item) => item.id === id) &&
        !rankItems.some((item) => item.id === id),
    );
    return selectedRankItems.length > 0 && selectedGridItems.length > 0;
  }, [props.item]);

  const handleEntryChange = (
    field: keyof DataPoint,
    value: string | number,
  ) => {
    if (!props.item) return;

    const updatedData = { ...props.item, [field]: value };
    updateItemById(props.item["id"], updatedData);
  };

  if (!props.item) {
    return null;
  }

  return (
    <div
      className={cn(
        props.classes,
        // Remove the overflow-y-auto since scrolling is handled by the parent
        "-webkit-overflow-scrolling-touch p-4 space-y-4 bg-zinc-100 rounded-md relative",
        selectedIDs.length === 1 ? "w-[600px]" : "w-80",
      )}
    >
      <h2 className="flex justify-between items-center w-full h-8">
        <span
          className={
            noto_serif.className + " text-lg overflow-x-auto whitespace-nowrap"
          }
        >
          <strong>{props.item["order"]}:</strong>{" "}
          {cardKey ? props.item[cardKey] : null}
        </span>

        {props.item["id"] !== infoId && (
          <button
            className="btn btn-sm btn-outline"
            onClick={() => {
              // if not infoId, remove from selectedIDs
              if (props.item["id"] !== infoId) {
                removeID(props.item["id"]);
              }
            }}
          >
            Remove
          </button>
        )}
      </h2>

      <div className="space-y-2">
        {videoKey && (
          <iframe
            className={cn(
              "relative overflow-hidden border-2 rounded-lg group",
              selectedIDs.length === 1 ? "w-[568px] h-80" : "w-72",
            )}
            src={props.item[videoKey] as string}
            allowFullScreen
          />
        )}

        {!videoKey && (
          <figure
            className={cn(
              "relative overflow-hidden border-2 rounded-lg group",
              selectedIDs.length === 1 ? "h-80" : "h-44",
            )}
          >
            <Image
              className="w-full h-full object-cover"
              sizes="(max-width: 768px) 100vw, 270px"
              src={(imageKey ? props.item[imageKey] : "") as string}
              alt=""
              fill
              unoptimized
            />
            <a
              href={
                (linkKey ? props.item[linkKey] : imageKey ? props.item[imageKey] : "") as string
              }
              target="_blank"
            >
              <button
                className="btn glass absolute w-32 inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-secondary hover:text-white"
                onClick={() => {
                  eventTracker({
                    action: "open link",
                    data: {
                      item: props.item,
                    },
                  });
                }}
              >
                Link
              </button>
            </a>
          </figure>
        )}

        {fileKey && (
          <iframe
            className={cn(
              "relative h-96 overflow-hidden border-2 rounded-lg group",
              selectedIDs.length === 1 ? "w-[568px]" : "w-72",
            )}
            src={props.item[fileKey] as string}
          />
        )}

        {showPreferButton && (
          <button
            className="w-full btn btn-secondary shadow-none"
            onClick={() => {
              const rankItems = useItemDataStore.getState().rankItems;
              const setRankItems = useItemDataStore.getState().setRankItems;
              const gridItems = useItemDataStore.getState().gridItems;
              const selectedIDs =
                useInfoPanelConfigStore.getState().selectedIDs;
              const anotherItemID = selectedIDs.find(
                (id) => id !== props.item.id,
              );
              const anotherItem = gridItems.find(
                (item) => item.id === anotherItemID,
              );

              if (!anotherItem) return;

              // check if this item is in the rankItems
              const isInRankItems = rankItems.some(
                (item) => item.id === props.item.id,
              );
              if (!isInRankItems) {
                // insert this item to the rankItems right before the anotherItem
                const index = rankItems.findIndex(
                  (item) => item.id === anotherItemID,
                );
                const newRankItems = [
                  ...rankItems.slice(0, index),
                  props.item,
                  ...rankItems.slice(index),
                ];
                setRankItems(newRankItems);

                // remove this item id from selectedIDs
                const newSelectedIDs = [];
                if (gridItems.length - newRankItems.length > 0) {
                  // add the one right before this item in the gridItems to the selectedIDs
                  newSelectedIDs.push(
                    gridItems[
                      gridItems.findIndex((item) => item.id === props.item.id) -
                        1
                    ].id,
                  );
                  // add the one in the top of the rankItems to the selectedIDs
                  newSelectedIDs.push(
                    useItemDataStore.getState().rankItems[0].id,
                  );
                  // randomize the order of newSelectedIDs
                  newSelectedIDs.sort(() => Math.random() - 0.5);
                  useInfoPanelConfigStore.setState({
                    selectedIDs: newSelectedIDs,
                  });
                } else {
                  alert("User Insertion Sort Finished.");
                  // remove this item from the selectedIDs
                  useInfoPanelConfigStore.setState({
                    selectedIDs: [],
                  });
                  // close the info panel
                  useInfoPanelConfigStore.setState({
                    isInfoOpen: false,
                  });
                  return;
                }
              } else {
                const index = rankItems.findIndex(
                  (item) => item.id === props.item.id,
                );
                if (index === rankItems.length - 1) {
                  // add another item to the end of the rankItems
                  const newRankItems = [...rankItems, anotherItem];
                  setRankItems(newRankItems);
                  // remove another item from the selectedIDs
                  const newSelectedIDs = [];
                  if (gridItems.length - newRankItems.length > 0) {
                    // add the one right before this item in the gridItems to the selectedIDs
                    console.log("test:", anotherItemID);
                    newSelectedIDs.push(
                      gridItems[
                        gridItems.findIndex(
                          (item) => item.id === anotherItemID,
                        ) - 1
                      ].id,
                    );
                    // add the one in the top of the rankItems to the selectedIDs
                    newSelectedIDs.push(
                      useItemDataStore.getState().rankItems[0].id,
                    );
                    // randomize the order of newSelectedIDs
                    newSelectedIDs.sort(() => Math.random() - 0.5);
                    useInfoPanelConfigStore.setState({
                      selectedIDs: newSelectedIDs,
                    });
                  } else {
                    alert("User Insertion Sort Finished.");
                    // remove this item from the selectedIDs
                    useInfoPanelConfigStore.setState({
                      selectedIDs: [],
                    });
                    // close the info panel
                    useInfoPanelConfigStore.setState({
                      isInfoOpen: false,
                    });
                    return;
                  }
                } else {
                  // remove this item from the selectedIDs
                  const newSelectedIDs = selectedIDs.filter(
                    (id) => id !== props.item.id,
                  );
                  // add the one right after this item in the rankItems to the selectedIDs
                  newSelectedIDs.push(
                    rankItems[
                      rankItems.findIndex((item) => item.id === props.item.id) +
                        1
                    ].id,
                  );
                  useInfoPanelConfigStore.setState({
                    selectedIDs: newSelectedIDs,
                  });
                }
              }
            }}
          >
            I like {cardKey ? props.item[cardKey] : null}
          </button>
        )}
      </div>

      <div className="space-y-2 w-full">
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <h3 className="mb-1 font-semibold">Scores</h3>
          </div>

          {conflictingIds.higher.includes(props.item["id"]) && (
            <div role="alert" className="alert alert-success alert-soft">
              <span>
                This item&apos;s scores on certain criteria might need to be
                increased.
              </span>
            </div>
          )}

          {conflictingIds.lower.includes(props.item["id"]) && (
            <div role="alert" className="alert alert-error alert-soft">
              <span>
                This item&apos;s scores on certain criteria might need to be
                decreased.
              </span>
            </div>
          )}

          <div className="collapse bg-base-200 collapse-arrow rounded-md select-none">
            <input
              type="checkbox"
              className="peer"
              checked={props.ifOpenCriteriaDetails}
              onChange={(e) => {
                props.setIfOpenCriteriaDetails(e.target.checked);
                if (e.target.checked) {
                  eventTracker({
                    action: "open criteria",
                    data: {},
                  });
                } else {
                  eventTracker({
                    action: "close criteria",
                    data: {},
                  });
                }
              }}
            />
            <div className="collapse-title bg-info text-white peer-checked:text-gray-800 peer-checked:bg-slate-50 text-sm font-medium pt-5 pr-4">
              <p className="text-base font-semibold pb-2">
                Aggregation: {customSort}{" "}
              </p>
              <p>
                {numberKeys.map((key) => (
                  <span key={key}>
                    {key}: {props.item[key]} | {""}
                  </span>
                ))}
              </p>
            </div>
            <div className="collapse-content bg-info peer-checked:bg-slate-50 text-secondary-content space-y-2">
              {/* <GeneralEntry
                  title={"Overall"}
                  content={overall}
                  editable={false}
                  onChange={(value) =>
                    handleEntryChange("Overall Score", value)
                  }
                /> */}
              <div className="flex flex-wrap justify-between gap-2">
                {numberKeys.map((key) => (
                  <NumberEntry
                    id={props.item["id"]}
                    key={"KEY_" + key}
                    title={key}
                    weight={weightSort[key]}
                    content={props.item[key] as number}
                    editable={!showPreferButton}
                    onChange={(value) => {
                      handleEntryChange(key as keyof DataPoint, value);
                      const thisCriteriaData = criteriaData.find(
                        (criteria) => criteria.name === key,
                      );
                      if (!thisCriteriaData) return;

                      // First, remove selected items from all groups
                      const clearedNeutrals =
                        thisCriteriaData.groups.neutral.filter(
                          (item) => item.id !== props.item["id"],
                        );
                      const clearedPositives = Object.keys(
                        thisCriteriaData.groups.positive,
                      ).reduce(
                        (acc, key) => {
                          acc[parseFloat(key)] =
                            thisCriteriaData.groups.positive[
                              parseFloat(key)
                            ]?.filter((item) => item.id !== props.item["id"]);
                          return acc;
                        },
                        {} as { [key: number]: DataPoint[] },
                      );
                      const clearedNegatives = Object.keys(
                        thisCriteriaData.groups.negative,
                      ).reduce(
                        (acc, key) => {
                          acc[parseFloat(key)] =
                            thisCriteriaData.groups.negative[
                              parseFloat(key)
                            ]?.filter((item) => item.id !== props.item["id"]);
                          return acc;
                        },
                        {} as { [key: number]: DataPoint[] },
                      );

                      if (value === 0) {
                        // Add to neutral group
                        const updatedCriteriaData = criteriaData.map(
                          (criteria) => {
                            if (criteria.name === key) {
                              return {
                                ...criteria,
                                groups: {
                                  neutral: [...clearedNeutrals, props.item],
                                  positive: clearedPositives,
                                  negative: clearedNegatives,
                                },
                              };
                            }
                            return criteria;
                          },
                        );
                        setCriteriaData(updatedCriteriaData);
                      }
                      // Add to positive or negative group
                      if (value > 0) {
                        const updatedCriteriaData = criteriaData.map(
                          (criteria) => {
                            if (criteria.name === key) {
                              const newGroup = Object.keys(
                                clearedPositives,
                              ).includes(Math.abs(value).toString())
                                ? [...clearedPositives[value], props.item]
                                : [props.item];
                              return {
                                ...criteria,
                                groups: {
                                  neutral: clearedNeutrals,
                                  positive: {
                                    ...clearedPositives,
                                    [value]: newGroup,
                                  },
                                  negative: clearedNegatives,
                                },
                              };
                            }
                            return criteria;
                          },
                        );
                        setCriteriaData(updatedCriteriaData);
                      }

                      if (value < 0) {
                        const updatedCriteriaData = criteriaData.map(
                          (criteria) => {
                            if (criteria.name === key) {
                              const newGroup = Object.keys(
                                clearedNegatives,
                              ).includes(Math.abs(value).toString())
                                ? [
                                    ...clearedNegatives[Math.abs(value)],
                                    props.item,
                                  ]
                                : [props.item];
                              return {
                                ...criteria,
                                groups: {
                                  neutral: clearedNeutrals,
                                  positive: clearedPositives,
                                  negative: {
                                    ...clearedNegatives,
                                    [Math.abs(value)]: newGroup,
                                  },
                                },
                              };
                            }
                            return criteria;
                          },
                        );
                        setCriteriaData(updatedCriteriaData);
                      }

                      eventTracker({
                        action: "change score",
                        data: {
                          item: props.item,
                          criterion: key,
                          newValue: value,
                        },
                      });
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          {!showPreferButton && (
            <button
              className={cn(
                "btn btn-sm shadow-none btn-soft btn-primary mr-2",
                props.popupOpen &&
                  props.popupItem?.id === props.item.id &&
                  "btn-active",
              )}
              onClick={(e) => {
                // prevent default action and stop propagation
                e.preventDefault();
                e.stopPropagation();
                props.setPopupItem(props.item);
                if (props.popupOpen) {
                  props.setPopupOpen(false);
                } else {
                  props.setPopupOpen(true);
                  props.setPopupPosition({
                    x: e.clientX,
                    y: e.clientY,
                  });
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={criteriaData.length === 0}
            >
              Sliders
            </button>
          )}
          {!showPreferButton && (
            <button
              className="btn btn-sm btn-secondary shadow-none"
              onClick={() => {
                const { setIsNewCriteriaOpen } =
                  useSharedConfigStore.getState();
                const { setShowCriteriaPanel, setCurrentCriteria } =
                  useCriteriaPanelStore.getState();
                setShowCriteriaPanel(false);
                setCurrentCriteria("");
                setIsNewCriteriaOpen(true);
              }}
            >
              Add a Criterion
            </button>
          )}
        </div>

        <hr className="border-gray-200" />

        <div className="space-y-2">
          {displayedStringKeys.map((key) => (
            <DetailDescriptionField
              key={`${props.item.id}-${key}`}
              labelName={key}
              content={props.item[key] as string}
              onChange={(value) => {
                handleEntryChange(key, value);
                eventTracker({
                  action: "change info",
                  data: {
                    item: props.item,
                    info: key,
                    newValue: value,
                  },
                });
              }}
              colorString={DetailDescriptionFieldColors.GRAY}
            />
          ))}
        </div>

        <hr className="border-gray-200" />

        <div className="space-y-2">
          <p className="mb-1 font-semibold">Displayed Info</p>
          <div className="flex flex-wrap gap-1">
            {stringKeys.map((key) => (
              <button
                key={key}
                onClick={() => {
                  if (displayedStringKeys.includes(key)) {
                    setDisplayedStringKeys(
                      displayedStringKeys.filter((k) => k !== key),
                    );
                    eventTracker({
                      action: "remove info",
                      data: {
                        item: props.item,
                        info: key,
                      },
                    });
                  } else {
                    setDisplayedStringKeys([...displayedStringKeys, key]);
                    eventTracker({
                      action: "add info",
                      data: {
                        item: props.item,
                        info: key,
                      },
                    });
                  }
                }}
                className={`border shadow-none border-gray-100 btn btn-sm text-xs ${
                  displayedStringKeys.includes(key)
                    ? "btn-neutral"
                    : "btn-outline text-gray-400 bg-white"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Info;
