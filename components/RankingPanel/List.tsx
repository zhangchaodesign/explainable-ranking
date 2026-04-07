"use client";
import React from "react";
import { ReactSortable } from "react-sortablejs";
import { cn } from "@/lib/utils";
import Item from "@/components/RankingPanel/MiniItem";
import { DataPoint } from "@/lib/type";

interface ListProps {
  classes?: string;
  items: DataPoint[];
  setItems: (items: DataPoint[]) => void;
  mini?: boolean;
  tag?: string | null;
  sortText?: string | null;
  inferResult?: {
    [key: number]: number;
  };
}

const List = ({
  classes,
  items,
  setItems,
  mini,
  tag,
  sortText,
  inferResult,
}: ListProps) => {
  // Drag and Drop Handler
  const onDragDropEnds = async (oldIndex: number, newIndex: number) => {
    console.log("Drag and drop ended");
    if (oldIndex === newIndex) return;
  };

  // Handle when items are added to prevent duplicates
  const handleSetList = (newItems: DataPoint[]) => {
    // Filter out duplicates by id
    const uniqueItems = newItems.filter(
      (item, index, self) => index === self.findIndex((i) => i.id === item.id),
    );
    setItems(uniqueItems);
  };

  return (
    <div className={cn(classes, "relative")}>
      <div className="pt-3 px-4">
        <ReactSortable
          list={items}
          setList={handleSetList}
          group={{
            name: "shared",
            pull: "clone", // Use "clone" to keep items in the list when dragged out
            put: true,
          }}
          // ghostClass="dropArea"
          // handle=".dragHandle"
          filter=".ignoreDrag"
          preventOnFilter={true}
          direction="horizontal"
          className="flex flex-row gap-3"
          scroll={true}
          forceFallback={true}
          forceAutoScrollFallback={true}
          scrollSensitivity={150}
          sort={false}
          onEnd={({ oldIndex, newIndex }) => {
            if (oldIndex !== undefined && newIndex !== undefined) {
              onDragDropEnds(oldIndex, newIndex);
            }
          }}
        >
          <>
            {items.map((item) => (
              <Item
                key={item["id"]}
                id={item["id"]}
                tag={tag === undefined ? null : tag}
                sortText={sortText === undefined ? null : sortText}
                inferResult={inferResult ? inferResult[item["id"]] : undefined}
              />
            ))}
          </>
        </ReactSortable>
      </div>
    </div>
  );
};

export default List;
