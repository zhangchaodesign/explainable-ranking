"use client";
import React, { useEffect, useState, useRef } from "react";
import { ReactSortable } from "react-sortablejs";
import { cn } from "@/lib/utils";
import Item from "@/components/CriteriaPanel/MiniItem";
import { DataPoint } from "@/lib/type";

interface MiniGalleryProps {
  classes?: string;
  thisItems: DataPoint[];
  setItems: (thisItems: DataPoint[]) => void;
  tag?: string | null;
  sortText?: string | null;
  mini?: boolean;
  inferResult?: {
    [key: number]: number;
  };
  selectedItems: number[];
  setSelectedItems: React.Dispatch<React.SetStateAction<number[]>>;
}

const MiniGallery = ({
  classes,
  thisItems,
  setItems,
  tag,
  sortText,
  mini,
  inferResult,
  selectedItems,
  setSelectedItems,
}: MiniGalleryProps) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });
  const selectionRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef({ top: 0, left: 0 });

  // Save scroll position for drag operations
  useEffect(() => {
    const updateScrollPosition = () => {
      if (galleryRef.current) {
        scrollPositionRef.current = {
          top: galleryRef.current.scrollTop,
          left: galleryRef.current.scrollLeft,
        };
      }
    };

    const galleryElement = galleryRef.current;
    if (galleryElement) {
      galleryElement.addEventListener("scroll", updateScrollPosition);
      return () =>
        galleryElement.removeEventListener("scroll", updateScrollPosition);
    }
  }, []);

  // Handle mousedown to start selection
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start selection with left mouse button and no modifier keys
    if (e.button !== 0 || e.ctrlKey || e.shiftKey) return;

    // Ignore if clicking on an item directly
    if ((e.target as HTMLElement).closest(".item-container")) return;

    const rect = galleryRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top + (galleryRef.current?.scrollTop || 0);

    setSelectionBox({
      startX,
      startY,
      endX: startX,
      endY: startY,
    });

    setIsSelecting(true);
  };

  // Handle mousemove to update selection
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !galleryRef.current) return;

    const rect = galleryRef.current.getBoundingClientRect();
    const scrollTop = galleryRef.current.scrollTop || 0;

    const endX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const endY = Math.max(
      0,
      Math.min(e.clientY - rect.top + scrollTop, rect.height + scrollTop),
    );

    setSelectionBox((prev) => ({
      ...prev,
      endX,
      endY,
    }));

    // Get elements within selection
    updateSelectedItems();
  };

  // Handle mouseup to end selection
  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  // Calculate and update selected thisItems based on current selection box
  const updateSelectedItems = () => {
    if (!galleryRef.current || !isSelecting) return;

    // Calculate selection box coordinates
    const left = Math.min(selectionBox.startX, selectionBox.endX);
    const top = Math.min(selectionBox.startY, selectionBox.endY);
    const right = Math.max(selectionBox.startX, selectionBox.endX);
    const bottom = Math.max(selectionBox.startY, selectionBox.endY);

    // Check each item element
    const itemElements = galleryRef.current.querySelectorAll(".item-container");
    const newSelectedItems: number[] = [];

    itemElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const galleryRect = galleryRef.current!.getBoundingClientRect();
      const scrollTop = galleryRef.current!.scrollTop || 0;

      // Convert to gallery coordinates
      const itemLeft = rect.left - galleryRect.left;
      const itemTop = rect.top - galleryRect.top + scrollTop;
      const itemRight = itemLeft + rect.width;
      const itemBottom = itemTop + rect.height;

      // Check if item intersects selection box
      const isIntersecting = !(
        itemRight < left ||
        itemLeft > right ||
        itemBottom < top ||
        itemTop > bottom
      );

      if (isIntersecting) {
        const id = parseInt(el.getAttribute("data-id") || "0", 10);
        if (id > -1) {
          newSelectedItems.push(id);
        }
      }
    });

    setSelectedItems(newSelectedItems);
  };

  // Drag and Drop Handler
  const onDragDropEnds = (oldIndex: number, newIndex: number) => {
    console.log("Drag and drop ended");
    if (oldIndex === newIndex) return;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        galleryRef.current &&
        !galleryRef.current.contains(event.target as Node)
      ) {
        setSelectedItems([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={galleryRef}
      className={cn(classes, "p-3 relative")}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {isSelecting && (
        <div
          ref={selectionRef}
          className="absolute pointer-events-none border border-blue-500 bg-blue-100 bg-opacity-30"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.endX) + "px",
            top: Math.min(selectionBox.startY, selectionBox.endY) + "px",
            width: Math.abs(selectionBox.endX - selectionBox.startX) + "px",
            height: Math.abs(selectionBox.endY - selectionBox.startY) + "px",
            zIndex: 1000,
          }}
        />
      )}

      <ReactSortable
        list={thisItems}
        setList={setItems}
        group={{ name: "shared", pull: true, put: true }}
        className="grid-container-mini"
        scroll={true}
        scrollSensitivity={150}
        scrollSpeed={20}
        fallbackOnBody={false}
        fallbackOffset={{ x: 0, y: 0 }}
        forceFallback={true}
        forceAutoScrollFallback={true}
        dragoverBubble={true}
        bubbleScroll={true}
        // Capture the scroll position when drag starts
        onStart={() => {
          if (galleryRef.current) {
            const el = document.querySelector(".sortable-ghost");
            if (el) {
              const scrollTop = galleryRef.current.scrollTop;
              // Apply the scroll offset to the ghost element
              (el as HTMLElement).style.transform =
                `translateY(${-scrollTop}px)`;
            }
          }
        }}
        onEnd={({ oldIndex, newIndex }) => {
          if (oldIndex !== undefined && newIndex !== undefined) {
            onDragDropEnds(oldIndex, newIndex);
          }
        }}
        // Add multi-drag capability
        multiDrag={true}
        selectedClass="selected-item"
        // Set the container to our gallery ref
        setData={(dataTransfer) => {
          dataTransfer.setDragImage(document.createElement("div"), 0, 0);
        }}
        // Set specific sorting animation
        animation={150}
        // Prevent issues with nested sortable elements
        preventOnFilter={true}
        filter=".ignoreDrag"
      >
        {thisItems.length === 0 ? (
          <div className="flex-shrink-0 h-[188px] w-32 bg-white border-4 border-gray-100 rounded-lg text-sm text-center flex items-center justify-center text-gray-400 font-medium opacity-60">
            Drop here
          </div>
        ) : (
          <>
            {thisItems.map((item) => (
              <div
                key={item.id}
                className={`item-container ${selectedItems.includes(item.id) ? "selected-item" : ""}`}
                data-id={item.id}
              >
                <Item
                  id={item.id}
                  tag={tag === undefined ? null : tag}
                  sortText={sortText === undefined ? null : sortText}
                  inferResult={inferResult ? inferResult[item.id] : undefined}
                  isSelected={selectedItems.includes(item.id)}
                />
              </div>
            ))}
          </>
        )}
      </ReactSortable>

      <div className="w-full h-24"></div>
    </div>
  );
};

export default MiniGallery;
