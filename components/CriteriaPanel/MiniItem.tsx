"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import {
  cn,
  getBgColorScale,
  getTextColorBasedOnBgColor,
  toNumber,
} from "@/lib/utils";
import { DataPoint } from "@/lib/type";
import { noto_serif } from "@/app/fonts";
import { useInView } from "react-intersection-observer";
import {
  useItemDataStore,
  useInfoPanelConfigStore,
  useSearchPanelConfigStore,
  useSharedConfigStore,
  useCriteriaDataStore,
  useCriteriaPanelStore,
} from "@/lib/store";

interface ItemProps {
  classes?: string;
  id: number;
  tag: string | null;
  sortText: string | null;
  inferResult?: number;
  isSelected?: boolean;
}

const Item = ({
  id,
  classes,
  tag,
  sortText,
  inferResult,
  isSelected,
}: ItemProps) => {
  const { setIsInfoOpen, infoId, setInfoId, selectedIDs, addID } =
    useInfoPanelConfigStore();
  const { result } = useSearchPanelConfigStore();
  const { criteriaData } = useCriteriaDataStore();
  const { currentCriteria } = useCriteriaPanelStore();
  const { items } = useItemDataStore();

  const {
    mode,
    cardKey,
    selectedItemID,
    isHoverOnScatterPlot,
    conflictingIds,
    imageKey,
  } = useSharedConfigStore();

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [draggingItemID, setDraggingItemID] = useState<number | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const item = items.find((item) => item["id"] === id) as DataPoint;

  const score = useMemo(() => {
    // console.log("item", item);
    const score = criteriaData
      .find((criteria) => criteria.name === currentCriteria)
      ?.similarity.find((sim) => sim.id === item.id)
      ?.score?.toFixed(2);
    return score;
  }, [item, criteriaData, currentCriteria]);

  const bgColor = useMemo(() => {
    return getBgColorScale(1, 0)(toNumber(score ? score : 0));
  }, [item, score]);

  const toggleSelect = (id: number | null) => {
    setInfoId(id);
    setIsInfoOpen(true);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const cardBodyRef = useRef<HTMLDivElement>(null);
  const [textColor, setTextColor] = useState("white");

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
    <div
      ref={itemRef}
      className={cn(
        classes,
        "flex-shrink-0 card select-none bg-white border-offset-2 border-4 w-40 rounded-lg",
        draggingItemID === item["id"]
          ? "border-info shadow-xl"
          : "border-gray-100",
        result?.includes(item["id"]) ? "border-secondary" : "",
        conflictingIds.higher.includes(id) && mode !== "silent"
          ? "border-success"
          : "",
        conflictingIds.lower.includes(id) && mode !== "silent"
          ? "border-error"
          : "",
        isSelected ? "border-info" : "",
      )}
      onDoubleClick={() => toggleSelect(item["id"])}
      onClick={(e) => {
        if (e.shiftKey) {
          if (
            item["id"] &&
            selectedIDs.find((netID) => netID === item["id"]) === undefined
          ) {
            addID(item["id"]);
          }
        }
      }}
      onMouseEnter={() => {
        setDraggingItemID(item["id"]);
      }}
      onMouseLeave={() => {
        setDraggingItemID(null);
      }}
      onMouseDown={handleDragStart}
      onMouseUp={handleDragEnd}
    >
      <figure
        ref={ref}
        className={cn("w-full overflow-hidden relative h-24 rounded-t-[4px]")}
      >
        {inView && imageKey && item[imageKey] && (
          <Image
            src={imageKey && item[imageKey] as string}
            alt=""
            fill
            className="object-cover border-b-2 border-gray-100"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 270px"
            unoptimized
          />
        )}
      </figure>
      <div
        ref={cardBodyRef}
        className={cn("relative card-body bg-white p-2 rounded-b-[4px]")}
        style={{ backgroundColor: bgColor }}
      >
        <div className={cn("flex flex-row gap-2")}>
          <h2
            className={cn(
              noto_serif.className,
              "card-title flex justify-between w-48 overflow-x-auto whitespace-nowrap text-gray-800 text-xs",
              textColor === "black" ? "text-gray-800" : "text-white",
            )}
          >
            {cardKey ? item[cardKey] : item["id"]}
          </h2>
        </div>

        <div className="card-actions justify-start flex gap-1">
          {score?.toString() && (
            <div className="bg-sky-100 text-sky-800 text-2xs px-1.5 py-0.5 rounded">
              Score: {score}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Item;
