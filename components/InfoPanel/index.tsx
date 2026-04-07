import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { TbX } from "react-icons/tb";
import {
  useItemDataStore,
  useInfoPanelConfigStore,
  useSharedConfigStore,
} from "@/lib/store";
import InfoDetails from "@/components/InfoPanel/InfoDetails";
import ItemDropdown from "@/components/InfoPanel/ItemDropdown";
import CrossingPairsDropdown from "@/components/WeightPanel/CrossingPairsDropdown";
import { eventTracker } from "@/lib/utils";
import { DataPoint } from "@/lib/type";

interface InfoProps {
  classes?: string;
  zIndex?: number;
  popupItem: DataPoint | null;
  setPopupItem: React.Dispatch<React.SetStateAction<DataPoint | null>>;
  popupOpen: boolean;
  setPopupOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPopupPosition: React.Dispatch<
    React.SetStateAction<{ x: number; y: number }>
  >;
}

const Info = ({
  classes,
  zIndex,
  popupItem,
  setPopupItem,
  popupOpen,
  setPopupOpen,
  setPopupPosition,
}: InfoProps) => {
  const { conflictingIds } = useSharedConfigStore();
  const [ifOpenCriteriaDetails, setIfOpenCriteriaDetails] = useState(false);

  const { isInfoOpen, setIsInfoOpen, infoId, selectedIDs, setSelectedIDs } =
    useInfoPanelConfigStore();
  const { items } = useItemDataStore();

  // Add a ref for the container that has all the InfoDetails
  const containerRef = useRef<HTMLDivElement>(null);
  // Create a ref to store the current scroll position
  const scrollPositionRef = useRef(0);
  // Add a ref to store the scrolling element
  const scrollingElementRef = useRef<HTMLDivElement | null>(null);
  // Add ref for RAF (requestAnimationFrame) ID to properly handle animation
  const rafIdRef = useRef<number | null>(null);
  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (infoId !== null && infoId !== undefined) setSelectedIDs([infoId]);
  }, [infoId]);

  useEffect(() => {
    if (isInfoOpen)
      eventTracker({
        action: "check info",
        data: {
          items: [
            ...selectedIDs.map((id) => items.find((item) => item["id"] === id)),
          ],
        },
      });
    else {
      eventTracker({
        action: "close info",
        data: {},
      });
    }
  }, [isInfoOpen, selectedIDs]);

  const getDataByID = (id: number) => items.find((item) => item["id"] === id);

  // Function to handle scroll synchronization with improved performance
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Store the element that initiated the scroll
    scrollingElementRef.current = e.currentTarget;

    // Update scroll position
    scrollPositionRef.current = e.currentTarget.scrollTop;

    // If we already have a RAF scheduled, don't schedule another one
    if (rafIdRef.current !== null) return;

    // Use requestAnimationFrame for smoother scrolling
    rafIdRef.current = requestAnimationFrame(() => {
      syncScroll();
      rafIdRef.current = null;
    });

    // Clear previous debounce timer if exists
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set a debounce timer to handle end of scroll
    debounceTimerRef.current = setTimeout(() => {
      // Final sync at the end of scrolling
      syncScroll();
      scrollingElementRef.current = null;
      debounceTimerRef.current = null;
    }, 100);
  };

  // Separate function to sync the scrolls
  const syncScroll = () => {
    if (!containerRef.current || scrollingElementRef.current === null) return;

    const detailContainers = containerRef.current.querySelectorAll(
      ".info-details-container",
    );

    detailContainers.forEach((container) => {
      if (container !== scrollingElementRef.current) {
        // Use scrollTo with behavior: 'auto' for smoother scrolling without jank
        (container as HTMLDivElement).scrollTo({
          top: scrollPositionRef.current,
          behavior: "auto", // 'auto' is less janky than 'smooth' for this use case
        });
      }
    });
  };

  // Clean up RAF and debounce timer on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(classes, "fixed inset-0 pointer-events-none")}
      style={{ zIndex }}
      onClick={(e) => {
        // Close panel when clicking outside of it
        if (e.target === e.currentTarget) {
          setIsInfoOpen(false);
        }
      }}
    >
      {/* Main panel */}
      <div
        className={cn(
          `pointer-events-auto absolute top-0 right-0 h-full max-w-[1200px] bg-slate-50 shadow-lg overflow-hidden transition-transform duration-300 ease-in-out flex flex-col ${
            isInfoOpen ? "translate-x-0" : "translate-x-full"
          }`,
          selectedIDs.length > 1 ? "min-w-[300px]" : "",
        )}
      >
        <div className="flex justify-between gap-2 w-full px-2 h-12 border border-x-0 border-t-0 border-b-1 items-center" style={{ zIndex: (zIndex || 1000) + 1 }}>
          <div className="flex gap-1 justify-center items-center">
            <ItemDropdown />
            {/* <p className="font-medium text-xs text-gray-400">Or</p>
            <CrossingPairsDropdown /> */}
          </div>
          <button
            className="text-gray-500 hover:text-gray-800"
            onClick={() => {
              setIsInfoOpen(false);
              setSelectedIDs([]);
            }}
          >
            <TbX size={20} />
          </button>
        </div>
        <div
          ref={containerRef}
          className="flex flex-row gap-4 p-2 overflow-x-auto flex-1"
        >
          {selectedIDs.map((id) => {
            const data = getDataByID(id);
            return data ? (
              <div
                key={id}
                className={cn(
                  "flex-shrink-0 min-w-[300px] max-w-[800px] h-full info-details-container overflow-y-auto bg-white rounded-lg shadow-sm  border-4",
                  conflictingIds.higher.includes(id) ? "border-success" : "",
                  conflictingIds.lower.includes(id) ? "border-error" : "",
                )}
                onScroll={handleScroll}
              >
                <InfoDetails
                  item={data}
                  ifOpenCriteriaDetails={ifOpenCriteriaDetails}
                  setIfOpenCriteriaDetails={setIfOpenCriteriaDetails}
                  popupItem={popupItem}
                  setPopupItem={setPopupItem}
                  popupOpen={popupOpen}
                  setPopupOpen={setPopupOpen}
                  setPopupPosition={setPopupPosition}
                />
              </div>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
};

export default Info;
