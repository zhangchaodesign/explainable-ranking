import React, { useState, useEffect, useMemo } from "react";
import { DataPoint } from "@/lib/type";
import {
  useCriteriaDataStore,
  useItemDataStore,
  useWeightPanelStore,
  useCriteriaPanelStore,
  useInfoPanelConfigStore,
  useSharedConfigStore,
} from "@/lib/store";
import { cn, capitalizeWords, eventTracker } from "@/lib/utils";
import { TbX } from "react-icons/tb";
import CustomStepRange from "@/components/RankingPanel/CustomStepRange";

interface ItemPopupProps {
  classes?: string;
  item: DataPoint | null;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

const ItemPopup: React.FC<ItemPopupProps> = ({
  classes,
  item,
  isOpen,
  onClose,
  position,
}) => {
  const { cardKey, selectedItemID, setSelectedItemID, imageKey } = useSharedConfigStore();
  const { showCriteriaPanel } = useCriteriaPanelStore();
  const { isInfoOpen } = useInfoPanelConfigStore();
  const { weightSort } = useWeightPanelStore();
  const { gridItems, updateItemById } = useItemDataStore();
  const { criteriaData, setCriteriaData } = useCriteriaDataStore();
  const itemData = gridItems.find((i) => i.id === item?.id);

  const sliderData = useMemo(() => {
    if (!item || !criteriaData || !itemData) return [];

    const sliderData = criteriaData.map((criteria) => ({
      steps: [
        ...Object.keys(criteria.groups.negative).map(
          (key) => -Math.abs(Number(key)),
        ),
        0,
        ...Object.keys(criteria.groups.positive).map(Number),
      ].sort((a, b) => a - b),
      name: criteria.name,
      value: itemData[criteria.name] as number,
      // find max key in criteria.groups.negative
      min: -Math.max(...Object.keys(criteria.groups.negative).map(Number)),
      // find max key in criteria.groups.positive
      max: Math.max(...Object.keys(criteria.groups.positive).map(Number)),
      step: 0.1,
    }));
    // console.log(sliderData);
    return sliderData;
  }, [criteriaData, gridItems, item]);

  const handleEntryChange = (
    field: keyof DataPoint,
    value: string | number,
  ) => {
    if (!itemData) return;

    const updatedData = { ...itemData, [field]: value };
    updateItemById(itemData["id"], updatedData);
  };

  // Monitor if popup is still within viewport when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        // If window is resized and popup is open, close it if it would go out of viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (
          position.x < 0 ||
          position.x > viewportWidth ||
          position.y < 0 ||
          position.y > viewportHeight
        ) {
          onClose();
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, position, onClose]);

  if (sliderData.length === 0 || !isOpen || !item || showCriteriaPanel)
    return null;

  return (
    <div
      className={cn(
        classes,
        "fixed bg-white shadow-lg rounded-lg p-4 max-w-64 border border-gray-200",
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "90%",
        boxShadow:
          "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
      }}
      draggable={false}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold">{item[cardKey]}</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <TbX size={16} />
        </button>
      </div>

      <div className="space-y-3 max-h-48 overflow-y-auto">
        {sliderData.map((slider, index) => {
          return (
            <div key={`slider-${index}`} className="w-full">
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium">
                  {capitalizeWords(slider.name)} ({slider.value.toFixed(1)})
                </label>
                <span className="text-xs text-gray-500">
                  {/* {Math.floor(slider.value / slider.step) + 1}/
                {slider.labels.length} */}
                  weight: {weightSort[slider.name].toFixed(2)}
                </span>
              </div>
              <div>
                <CustomStepRange
                  min={slider.min}
                  max={slider.max}
                  value={slider.value}
                  step={slider.step}
                  steps={slider.steps}
                  onChange={(value) => {
                    handleEntryChange(slider.name, value);
                    const thisCriteriaData = criteriaData.find(
                      (criteria) => criteria.name === slider.name,
                    );
                    if (!thisCriteriaData || !itemData) return;

                    // First, remove selected items from all groups
                    const clearedNeutrals =
                      thisCriteriaData.groups.neutral.filter(
                        (item) => item.id !== itemData["id"],
                      );
                    const clearedPositives = Object.keys(
                      thisCriteriaData.groups.positive,
                    ).reduce(
                      (acc, key) => {
                        acc[parseFloat(key)] = thisCriteriaData.groups.positive[
                          parseFloat(key)
                        ]?.filter((item) => item.id !== itemData["id"]);
                        return acc;
                      },
                      {} as { [key: number]: DataPoint[] },
                    );
                    const clearedNegatives = Object.keys(
                      thisCriteriaData.groups.negative,
                    ).reduce(
                      (acc, key) => {
                        acc[parseFloat(key)] = thisCriteriaData.groups.negative[
                          parseFloat(key)
                        ]?.filter((item) => item.id !== itemData["id"]);
                        return acc;
                      },
                      {} as { [key: number]: DataPoint[] },
                    );

                    if (value === 0) {
                      // Add to neutral group
                      const updatedCriteriaData = criteriaData.map(
                        (criteria) => {
                          if (criteria.name === slider.name) {
                            return {
                              ...criteria,
                              groups: {
                                neutral: [...clearedNeutrals, itemData],
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
                          if (criteria.name === slider.name) {
                            const newGroup = Object.keys(
                              clearedPositives,
                            ).includes(Math.abs(value).toString())
                              ? [...clearedPositives[Math.abs(value)], itemData]
                              : [itemData];
                            return {
                              ...criteria,
                              groups: {
                                neutral: clearedNeutrals,
                                positive: {
                                  ...clearedPositives,
                                  [Math.abs(value)]: newGroup,
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
                          if (criteria.name === slider.name) {
                            const newGroup = Object.keys(
                              clearedNegatives,
                            ).includes(Math.abs(value).toString())
                              ? [...clearedNegatives[Math.abs(value)], itemData]
                              : [itemData];
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
                        item: itemData,
                        criterion: slider.name,
                        newValue: value,
                      },
                    });
                  }}
                />

                {
                  // Find items which the score of the criterion euqal to the slider value
                  gridItems.find(
                    (item) =>
                      item[slider.name] === slider.value &&
                      item.id !== itemData?.id,
                  ) && (
                    <div className="flex gap-1 mt-2 text-xs text-gray-500 flex-wrap px-1">
                      {gridItems
                        .filter(
                          (item) =>
                            item[slider.name] === slider.value &&
                            item.id !== itemData?.id,
                        )
                        .map((item) => (
                          <img
                            key={item["id"]}
                            src={(imageKey ? item[imageKey] : "") as string}
                            alt=""
                            className="w-8 h-8 object-cover rounded-sm cursor-pointer opacity-60 hover:outline outline-2 outline-offset-1 outline-neutral hover:opacity-100"
                            onMouseEnter={() => {
                              setSelectedItemID(item["id"]);
                            }}
                            onMouseLeave={() => {
                              setSelectedItemID(null);
                            }}
                          />
                        ))}
                    </div>
                  )
                }

                <hr className="mt-2 border-gray-100" />
              </div>
            </div>
          );
        })}
      </div>

      {/* <div className="mt-3 flex justify-end">
        <button
          className="btn btn-sm py-1 px-4 rounded-md text-sm"
          onClick={() => {
            // Handle saving the slider values
            console.log("Saving slider values for item:", item.id, sliderData);
            onClose();
          }}
        >
          Save
        </button>
      </div> */}
    </div>
  );
};

export default ItemPopup;
