"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import {
  cn,
  concatItemFields,
  capitalizeWords,
  getBgColorScale,
  getTextColorBasedOnBgColor,
} from "@/lib/utils";
import { aggregateScore } from "@/lib/svm";
import { DataPoint } from "@/lib/type";
import { noto_serif } from "@/app/fonts";
import { stringSimilarity } from "string-similarity-js";
import { useInView } from "react-intersection-observer";
import {
  useItemDataStore,
  useColorStore,
  useInfoPanelConfigStore,
  useSortStore,
  useSearchPanelConfigStore,
  useSharedConfigStore,
  useWeightPanelStore,
  useCurveConfigStore,
  useReasonPanelConfigStore,
  useCriteriaDataStore,
} from "@/lib/store";
import * as d3 from "d3";
import { motion } from "framer-motion";
import ItemPopup from "@/components/RankingPanel/ItemPopup";

// @ts-expect-error
const categoryColor = d3.schemeObservable10;

interface ItemProps {
  classes?: string;
  id: number;
  tag: string | null;
  sortText: string | null;
  inferResult?: number;
  isSelected?: boolean;
  popupItem: DataPoint | null;
  setPopupItem: React.Dispatch<React.SetStateAction<DataPoint | null>>;
  popupOpen: boolean;
  setPopupOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPopupPosition: React.Dispatch<
    React.SetStateAction<{ x: number; y: number }>
  >;
}

const Item = ({
  id,
  classes,
  tag,
  sortText,
  inferResult,
  isSelected,
  popupItem,
  setPopupItem,
  popupOpen,
  setPopupOpen,
  setPopupPosition,
}: ItemProps) => {
  const { criteriaData } = useCriteriaDataStore();
  const { curvedValues } = useCurveConfigStore();
  const {
    isInfoOpen,
    setIsInfoOpen,
    infoId,
    setInfoId,
    selectedIDs,
    addID,
    removeID,
  } = useInfoPanelConfigStore();
  const { rankItems } = useItemDataStore();

  const {
    mode,
    conflictingIds,
    cardKey,
    setCardKey,
    selectedItemID,
    setSelectedItemID,
    isHoverOnScatterPlot,
    visualizationType,
  } = useSharedConfigStore();
  const numberKeys = useSharedConfigStore((state) => state.numberKeys).filter(
    (key) => key !== "id" && key !== "order",
  );
  const stringKeys = useSharedConfigStore((state) => state.stringKeys).filter(
    (key) => key !== "image",
  );

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [draggingItemID, setDraggingItemID] = useState<number | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const { colorBy, colorText } = useColorStore();
  const colorTag = colorBy ? colorBy : "Similarity";

  const { sortBy } = useSortStore();
  const sortTag = sortBy ? sortBy : "Similarity";

  const { weightSort, weightSortState } = useWeightPanelStore();
  const weightSum = useMemo(() => {
    let sum = 0;
    Object.keys(weightSort).forEach((criteria) => {
      sum += Math.abs(weightSort[criteria]);
    });
    return sum;
  }, [weightSort, weightSortState]);

  const item = rankItems.find((item) => item["id"] === id) as DataPoint;

  const customSort = useMemo(() => {
    return aggregateScore(item).score;
  }, [item, weightSort, weightSortState]);
  const similaritySort = useMemo(() => {
    const fields = concatItemFields(item, { separator: "\n" });
    return stringSimilarity(fields, sortText || "");
  }, [item, sortText]);
  const averageSort = useMemo(() => {
    const averageScore = (item: DataPoint) => {
      let score = 0;
      numberKeys.forEach((key) => {
        score += (item[key] as number) || 0;
      });
      return score / numberKeys.length;
    };
    return averageScore(item);
  }, [item]);

  const customColor = useMemo(() => {
    return aggregateScore(item).score;
  }, [item, weightSort, weightSortState]);
  const similarityColor = useMemo(() => {
    const fields = concatItemFields(item, { separator: "\n" });
    return stringSimilarity(fields, colorText || "");
  }, [item, colorText]);
  const averageColor = useMemo(() => {
    let score = 0;
    numberKeys.forEach((key) => {
      score += (item[key] as number) || 0;
    });
    return score / numberKeys.length;
  }, [item]);

  const toggleSelect = (id: number | null) => {
    setInfoId(id);
    setIsInfoOpen(true);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    // Check if we're clicking on the slider or popup
    if (
      (e.target as HTMLElement).closest(".range") ||
      (e.target as HTMLElement).closest(".absolute.z-10")
    ) {
      // Don't start dragging if we're interacting with the slider or popup
      return;
    }

    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setSelectedItemID(null);
  };

  const bgColor = useMemo(() => {
    if (colorTag === "null") {
      return "#fafafa";
    } else if (colorTag === "Aggregated Score") {
      let max = customColor;
      let min = customColor;
      rankItems.forEach((item) => {
        const score = aggregateScore(item).score;
        max = Math.max(max, score);
        min = Math.min(min, score);
      });
      return getBgColorScale(max, min)(customColor);
    } else if (colorTag === "Similarity") {
      let max = similarityColor;
      let min = similarityColor;
      rankItems.forEach((item) => {
        const fields = concatItemFields(item, { separator: "\n" });
        const score = stringSimilarity(fields, colorText || "");
        max = Math.max(max, score);
        min = Math.min(min, score);
      });
      return getBgColorScale(max, min)(similarityColor);
    } else if (colorTag === "Average Score") {
      let max = averageColor;
      let min = averageColor;
      rankItems.forEach((item) => {
        let score = 0;
        numberKeys.forEach((key) => {
          score += (item[key] as number) || 0;
        });
        score /= numberKeys.length;
        max = Math.max(max, score);
        min = Math.min(min, score);
      });
      return getBgColorScale(max, min)(averageColor);
    } else {
      let max = item[colorTag] as number;
      let min = item[colorTag] as number;
      rankItems.forEach((item) => {
        const value = item[colorTag] as number;
        max = Math.max(max, value);
        min = Math.min(min, value);
      });
      return getBgColorScale(max, min)(item[colorTag] as number);
    }
  }, [rankItems, colorTag]);

  const cardBodyRef = useRef<HTMLDivElement>(null);
  const [textColor, setTextColor] = useState("white");

  function _safeSortTag(value: number) {
    if (typeof value === "number") {
      return value.toFixed(2);
    } else {
      return "N/A";
    }
  }

  useEffect(() => {
    if (cardBodyRef.current) {
      cardBodyRef.current.style.backgroundColor = bgColor;
      const computedBgColor = window.getComputedStyle(
        cardBodyRef.current,
      ).backgroundColor;
      setTextColor(getTextColorBasedOnBgColor(computedBgColor));
    }
  }, [bgColor]);

  useEffect(() => {
    if (
      selectedItemID === item["id"] &&
      itemRef.current &&
      isHoverOnScatterPlot
    ) {
      itemRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedItemID, item, isHoverOnScatterPlot]);

  // If id is null, we decide what to render after the hooks have been called
  if (id === null || item === undefined) {
    return null;
  }

  return (
    <>
      <div
        ref={itemRef}
        className={cn(
          classes,
          "relative flex-shrink-0 card w-full select-none bg-white border-offset-2 border-4 flex flex-row border-gray-100 cursor-pointer",
          conflictingIds.higher.includes(id) &&
            mode !== "silent" &&
            visualizationType === "slope"
            ? "border-success"
            : "",
          conflictingIds.lower.includes(id) &&
            mode !== "silent" &&
            visualizationType === "slope"
            ? "border-error"
            : "",
          selectedItemID === item["id"] || infoId === item["id"]
            ? "border-info shadow-xl"
            : "",
        )}
        // onDoubleClick={() => toggleSelect(item["id"])}
        // onClick={(e) => {
        //   if (e.shiftKey) {
        //     if (
        //       item["id"] &&
        //       selectedIDs.find((netID) => netID === item["id"]) === undefined
        //     ) {
        //       addID(item["id"]);
        //     }
        //   }
        // }}
        onMouseEnter={() => {
          setSelectedItemID(item["id"]);
        }}
        onMouseLeave={() => {
          setSelectedItemID(null);
        }}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
      >
        <figure
          ref={ref}
          className={cn(
            "w-24 aspect-square overflow-hidden rounded-l rounded-r-none relative",
          )}
        >
          {inView && item["image"] && (
            <Image
              src={item["image"] as string}
              alt=""
              fill
              className="object-cover"
              loading="lazy"
              sizes="96px"
              unoptimized
            />
          )}
        </figure>
        <div
          ref={cardBodyRef}
          className={cn("relative card-body p-4 rounded-r bg-white")}
          style={{ backgroundColor: bgColor }}
        >
          <h2
            className={cn(
              noto_serif.className,
              "absolute bottom-1 right-2 text-sm",
              textColor === "black" ? "text-gray-800" : "text-white",
            )}
          >
            {item["order"]}
          </h2>

          <div className="absolute top-0 left-0 w-full rounded flex">
            {Object.keys(weightSort).map((criteria) => (
              <motion.div
                key={criteria}
                initial={false}
                className="h-2 hover:scale-105 transition-all duration-300 ease-in-out"
                title={`${criteria}: ${item[criteria]} (${weightSort[criteria]})`}
                animate={{
                  width: `${(Math.abs((item[criteria] as number) * weightSort[criteria]) / weightSum) * 100}%`,
                }}
                style={{
                  backgroundColor:
                    categoryColor[
                      numberKeys.indexOf(criteria) % categoryColor.length
                    ],
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          <div className={cn("flex flex-row justify-between gap-2 mt-1")}>
            {/* <div className="dropdown dropdown-bottom">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-sm bg-white shadow-none hover:bg-gray-100 border border-gray-100 w-full justify-start"
            >
              <span className="text-gray-400 font-medium">{cardKey}</span>
            </div>
            <ul
              tabIndex={0}
              className="menu dropdown-content bg-base-100 rounded-box z-[1] w-48 p-2 shadow gap-2 mt-2 max-h-48 flex-nowrap overflow-y-auto overflow-x-hidden"
            >
              {stringKeys.map((key) => (
                <li key={key} className="w-full">
                  <a
                    className={`block w-full ${cardKey === key ? "active" : ""} !overflow-visible`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCardKey(key);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center w-full min-w-0">
                      <span className="truncate">{key}</span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div> */}

            <h2
              className={cn(
                noto_serif.className,
                "card-title text-base flex justify-between max-w-48 overflow-x-auto whitespace-nowrap",
                textColor === "black" ? "text-gray-800" : "text-white",
              )}
            >
              {cardKey ? item[cardKey] : item["id"]}
            </h2>

            <div className="flex gap-2">
              <button
                className={cn(
                  "btn btn-sm shadow-none btn-soft btn-primary",
                  popupOpen && popupItem?.id === item.id && "btn-active",
                )}
                onClick={(e) => {
                  // prevent default action and stop propagation
                  e.preventDefault();
                  e.stopPropagation();
                  setPopupItem(item);
                  if (popupOpen && popupItem?.id === item.id) {
                    setPopupOpen(false);
                  } else {
                    setPopupOpen(true);
                    setPopupPosition({
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={criteriaData.length === 0}
              >
                Score
              </button>
              <button
                className={cn(
                  "btn btn-sm shadow-none btn-soft btn-secondary",
                  infoId === item["id"] && "btn-active",
                )}
                onClick={(e) => {
                  // prevent default action and stop propagation
                  e.preventDefault();
                  e.stopPropagation();
                  if (
                    selectedIDs.find((netID) => netID === item["id"]) ===
                    undefined
                  ) {
                    addID(item["id"]);
                    setIsInfoOpen(true);
                  } else {
                    removeID(item["id"]);
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                // disabled={isInfoOpen}
              >
                Details
              </button>
            </div>
          </div>

          <div className="card-actions justify-start flex mt-1">
            {sortTag && (
              <div className="bg-sky-100 text-sky-800 text-xs px-2.5 py-0.5 rounded">
                {capitalizeWords(sortTag)}:{" "}
                {_safeSortTag(
                  sortTag === "Aggregated Score"
                    ? customSort
                    : sortTag === "Similarity"
                      ? similaritySort
                      : sortTag === "Average Score"
                        ? averageSort
                        : sortTag.includes("Curved")
                          ? curvedValues[sortTag][item.id]
                          : (item[sortTag] as number),
                )}
              </div>
            )}
            {colorTag && colorTag !== "null" && colorTag !== sortTag && (
              <div className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded">
                {capitalizeWords(colorTag)}:{" "}
                {_safeSortTag(
                  colorTag === "Aggregated Score"
                    ? customColor
                    : colorTag === "Similarity"
                      ? similarityColor
                      : colorTag === "Average Score"
                        ? averageColor
                        : colorTag.includes("Curved")
                          ? curvedValues[colorTag][item.id]
                          : (item[colorTag] as number),
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Item;
