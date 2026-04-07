"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { cn, capitalizeWords } from "@/lib/utils";
import { aggregateScore } from "@/lib/svm";
import { DataPoint } from "@/lib/type";
import { noto_serif } from "@/app/fonts";
import { useInView } from "react-intersection-observer";
import {
  useItemDataStore,
  useInfoPanelConfigStore,
  useSortStore,
  useSearchPanelConfigStore,
  useSharedConfigStore,
  useWeightPanelStore,
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
  const { setIsInfoOpen, setInfoId, selectedIDs, addID } =
    useInfoPanelConfigStore();
  const { result } = useSearchPanelConfigStore();
  const { gridItems, rankItems } = useItemDataStore();
  const isInRanking = useMemo(() => {
    return rankItems.find((item) => item.id === id) !== undefined;
  }, [rankItems, id]);

  const { cardKey, selectedItemID, isHoverOnScatterPlot } =
    useSharedConfigStore();

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [draggingItemID, setDraggingItemID] = useState<number | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const { sortBy } = useSortStore();
  const sortTag = sortBy ? sortBy : "Similarity";

  const { weightSort, weightSortState } = useWeightPanelStore();

  const item = gridItems.find((item) => item["id"] === id) as DataPoint;

  const customSort = useMemo(() => {
    // console.log("Custom sort for item:", item);
    return aggregateScore(item).score;
  }, [item, weightSort, weightSortState]);

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

  function _safeSortTag(value: number) {
    if (typeof value === "number") {
      return value.toFixed(2);
    } else {
      return "N/A";
    }
  }

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
        isSelected ? "border-info" : "",
        isInRanking ? "ignoreDrag opacity-30 cursor-default" : "cursor-pointer",
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
        {inView && item["image"] && (
          <Image
            src={item["image"] as string}
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
        style={{ backgroundColor: "#f9fafb" }}
      >
        <div className={cn("flex flex-row gap-2")}>
          <h2
            className={cn(
              noto_serif.className,
              "card-title flex justify-between w-48 overflow-x-auto whitespace-nowrap text-gray-800 text-xs",
            )}
          >
            {cardKey ? item[cardKey] : item["id"]}
          </h2>
        </div>

        <div className="card-actions justify-start flex gap-1">
          {sortTag && (
            <div className="bg-sky-100 text-sky-800 text-2xs px-2.5 py-0.5 rounded">
              {capitalizeWords(sortTag)}: {_safeSortTag(customSort)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Item;
