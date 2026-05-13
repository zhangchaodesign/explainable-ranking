"use client";
import React, { useState } from "react";
import { ReactSortable } from "react-sortablejs";
import { cn } from "@/lib/utils";
import Item from "@/components/RankingPanel/Item";
import { DataPoint } from "@/lib/type";
import { eventTracker } from "@/lib/utils";
import ItemPopup from "@/components/RankingPanel/ItemPopup";
import InsertionSortDialog from "@/components/InsertionSortDialog";
import {
  useWeightPanelStore,
  useItemDataStore,
  useInfoPanelConfigStore,
} from "@/lib/store";

interface GalleryProps {
  classes?: string;
  items: DataPoint[];
  setItems: (items: DataPoint[]) => void;
  tag?: string | null;
  sortText?: string | null;
  inferResult?: {
    [key: number]: number;
  };
}

const Gallery = ({
  classes,
  items,
  setItems,
  tag,
  sortText,
  inferResult,
}: GalleryProps) => {
  const [popupItem, setPopupItem] = useState<DataPoint | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [showInsertionSortConfirm, setShowInsertionSortConfirm] =
    useState(false);

  const { setSelectedIDs, setIsInfoOpen } = useInfoPanelConfigStore();
  const { gridItems, setRankItems } = useItemDataStore();
  const { weightSortState, setWeightSortState } = useWeightPanelStore();

  // Drag and Drop Handler
  const onDragDropEnds = async (oldIndex: number, newIndex: number) => {
    console.log("Drag and drop ended");
    if (oldIndex === newIndex) return;

    // Track drag and drop event
    eventTracker({
      action: "drag_drop items in rank",
      data: {
        item: items[oldIndex],
        oldIndex,
        newIndex,
      },
    });
  };

  // Handle when items are added or removed
  const handleSetList = (newItems: DataPoint[]) => {
    // Find newly added items
    const newlyAdded = newItems.find(
      (item) => !items.some((existingItem) => existingItem.id === item.id),
    );

    // Find removed items
    const removedItem = items.find(
      (item) => !newItems.some((newItem) => newItem.id === item.id),
    );

    // If there's a newly added item, track the event
    if (newlyAdded) {
      const initialIndex = newItems.findIndex(
        (item) => item.id === newlyAdded.id,
      );

      eventTracker({
        action: "add items to rank",
        data: {
          item: newlyAdded,
          initialIndex,
        },
      });
    }

    // If an item was removed, track the event
    if (removedItem) {
      const previousIndex = items.findIndex(
        (item) => item.id === removedItem.id,
      );

      eventTracker({
        action: "remove items from rank",
        data: {
          item: removedItem,
          previousIndex,
        },
      });
    }

    // Filter out duplicates by id
    const uniqueItems = newItems.filter(
      (item, index, self) => index === self.findIndex((i) => i.id === item.id),
    );
    setItems(uniqueItems);
  };

  return (
    <div className={cn(classes, "")}>
      <div className="py-3 px-4 pt-14">
        <ReactSortable
          list={items}
          setList={handleSetList}
          group={{
            name: "shared",
            pull: true,
            put: true,
          }}
          // ghostClass="dropArea"
          // handle=".dragHandle"
          filter=".ignoreDrag"
          preventOnFilter={true}
          direction="vertical"
          className="flex flex-col gap-3"
          scroll={true}
          forceFallback={true}
          forceAutoScrollFallback={true}
          scrollSensitivity={150}
          onEnd={({ oldIndex, newIndex }) => {
            if (oldIndex !== undefined && newIndex !== undefined) {
              onDragDropEnds(oldIndex, newIndex);
            }
          }}
        >
          {items.length === 0 ? (
            <button
              onClick={() => {
                setShowInsertionSortConfirm(true);
              }}
              className="btn btn-sm btn-primary btn-soft shadow-none w-full"
            >
              Click here to query for user preferences (User Insertion Sort)
            </button>
          ) : (
            <>
              {items.map((item) => (
                <Item
                  key={item["id"]}
                  id={item["id"]}
                  tag={tag === undefined ? null : tag}
                  sortText={sortText === undefined ? null : sortText}
                  inferResult={
                    inferResult ? inferResult[item["id"]] : undefined
                  }
                  popupItem={popupItem}
                  setPopupItem={setPopupItem}
                  popupOpen={popupOpen}
                  setPopupOpen={setPopupOpen}
                  setPopupPosition={setPopupPosition}
                />
              ))}
            </>
          )}
        </ReactSortable>
      </div>
      <div className="absolute top-48 bg-white py-3 px-4 border-b border-r border-gray-100 w-1/3">
        <p className="font-semibold text-sm text-gray-800 select-none">
          ⬇️ Your Rank (Drag and Drop to Reorder)
        </p>
      </div>

      {/* Insertion Sort Criteria Confirmation Dialog */}
      <InsertionSortDialog
        isOpen={showInsertionSortConfirm}
        onClose={() => setShowInsertionSortConfirm(false)}
        weightSortState={weightSortState}
        setWeightSortState={setWeightSortState}
        gridItems={gridItems}
        setRankItems={setRankItems}
        setSelectedIDs={setSelectedIDs}
        setIsInfoOpen={setIsInfoOpen}
      />

      <ItemPopup
        classes="z-[1001]"
        item={popupItem}
        isOpen={popupOpen}
        onClose={() => setPopupOpen(false)}
        position={popupPosition}
      />
    </div>
  );
};

export default Gallery;
