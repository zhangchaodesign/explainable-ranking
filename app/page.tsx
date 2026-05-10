"use client";
import React, { useEffect, useState } from "react";
import Gallery from "@/components/RankingPanel/Gallery";
import List from "@/components/RankingPanel/List";
import Header from "@/components/Header";
import ReasonPanel from "@/components/ReasonPanel";
import CriteriaPanel from "@/components/CriteriaPanel";
import WeightPanel from "@/components/WeightPanel";
import Info from "@/components/InfoPanel";
import ExplanationPanel from "@/components/ExplanationPanel";
import ExplainNotice from "@/components/ExplainNotice";
import ActionButtons from "@/components/ActionButtons";
import Onboarding from "@/components/Onboarding";
import { DataPoint } from "@/lib/type";
import {
  useSharedConfigStore,
  useItemDataStore,
  useSortStore,
  useReasonPanelConfigStore,
  useIsLoading,
  useCurveConfigStore,
  useCriteriaPanelStore,
  useWeightPanelStore,
  useInfoPanelConfigStore,
  usePanelLayerStore,
} from "@/lib/store";
import { eventTracker } from "@/lib/utils";
import DataSelector from "@/components/DataSelector";
import ItemPopup from "@/components/RankingPanel/ItemPopup";

export default function Home() {
  const [popupItem, setPopupItem] = useState<DataPoint | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [rankBy, setRankBy] = useState("aggregated score");
  const { isInfoOpen, setIsInfoOpen } = useInfoPanelConfigStore();
  const { mode } = useSharedConfigStore();
  const { isLoading } = useIsLoading();
  const { bringPanelToFront, removePanelFromOrder, getPanelZIndex } =
    usePanelLayerStore();
  const {
    gridItems,
    setGridItems,
    items,
    setItems,
    rankItems,
    setRankItems,
    updateRankItems,
  } = useItemDataStore();
  const { selectedGroupIDs } = useCurveConfigStore();
  const { sortBy, sortText } = useSortStore();
  const {
    showReasonPanel,
    reasonReference,
    setShowReasonPanel,
    setCurrentConflits,
  } = useReasonPanelConfigStore();
  const { showCriteriaPanel, setShowCriteriaPanel } = useCriteriaPanelStore();
  const { showWeightPanel, setShowWeightPanel, weightSort } =
    useWeightPanelStore();

  const handleRankByChange = (value: string) => {
    setRankBy(value);
    eventTracker({
      action: "compute rank from",
      data: {
        value: value,
      },
    });
  };

  const [isDataSelectorOpen, setIsDataSelectorOpen] = useState(false);
  const [uploadedData, setUploadedData] = useState<DataPoint[]>([]);
  const [dataTypes, setDataTypes] = useState<{ [key: string]: string }>({});
  const [defaultWeights, setDefaultWeights] = useState<{ [key: string]: number }>({});
  const handleDataLoad = (
    data: DataPoint[],
    _isDefaultData: boolean,
    types?: { [key: string]: string },
    weights?: { [key: string]: number },
  ) => {
    setIsDataSelectorOpen(true);
    setUploadedData(data);
    setDataTypes(types || {});
    setDefaultWeights(weights || {});
  };

  useEffect(() => {
    setGridItems([...items]);
    // Update all attributes except for the "order" attribute of each item in rankItems
    updateRankItems(
      rankItems.map((item) => {
        const updatedItem = items.find((i) => i.id === item.id);
        if (updatedItem) {
          return { ...updatedItem, order: item.order };
        }
        return item;
      }),
    );
  }, [items]);

  useEffect(() => {
    setCurrentConflits([]);
    setShowReasonPanel(false);
  }, []);

  // Handle Info Panel opening/closing for z-index management
  useEffect(() => {
    if (isInfoOpen) {
      bringPanelToFront("info");
    } else {
      removePanelFromOrder("info");
    }
  }, [isInfoOpen, bringPanelToFront, removePanelFromOrder]);

  // Handle Criteria Panel opening/closing for z-index management
  useEffect(() => {
    if (showCriteriaPanel) {
      bringPanelToFront("criteria");
    } else {
      removePanelFromOrder("criteria");
    }
  }, [showCriteriaPanel, bringPanelToFront, removePanelFromOrder]);

  const showOnboarding = items.length === 0 && !isDataSelectorOpen;

  return (
    <div className="relative">
      {showOnboarding ? (
        <Onboarding onDataLoad={handleDataLoad} />
      ) : (
        <>
          <Header onDataLoad={handleDataLoad} />

          <ItemPopup
            classes="z-[10001]"
            item={popupItem}
            isOpen={popupOpen}
            onClose={() => setPopupOpen(false)}
            position={popupPosition}
          />

          {/* Main layout - Gallery and WeightPanel split */}
          {gridItems && (
            <div className="flex h-[calc(100vh-48px)] relative">
              {/* Gallery on the left - takes 1/3 of the width */}
              <div className="w-1/3 border-r border-gray-100 flex flex-col">
                <List
                  classes="overflow-x-auto h-64 bg-zinc-50 border-t border-gray-100"
                  items={gridItems}
                  setItems={(newItems) => {
                    // Ensure no duplicates when items are dragged back from Gallery
                    const uniqueItems = newItems.filter(
                      (item, index, self) =>
                        index === self.findIndex((i) => i.id === item.id),
                    );
                    setGridItems(uniqueItems);
                  }}
                  tag={sortBy ? sortBy : "Similarity"}
                  sortText={sortText}
                  mini={true}
                />
                <Gallery
                  classes="h-full overflow-y-auto rows-span-4"
                  items={rankItems}
                  setItems={(newItems) => {
                    // Update the rankItems state
                    setRankItems(newItems);

                    // No need to remove items from gridItems as we're cloning
                  }}
                  tag={sortBy ? sortBy : "Similarity"}
                  sortText={sortText}
                />
              </div>

              {/* Right panel - takes 2/3 of the width */}
              <div
                className={`w-2/3 ${isInfoOpen ? "opacity-50" : "opacity-100"} transition-opacity duration-300 flex flex-col`}
              >
                <div className="sticky w-full px-2 pt-2 bg-slate-50">
                  <ExplainNotice show={rankItems.length > 0} />
                </div>
                {/* ExplanationPanel */}
                <div className="flex-1 overflow-y-auto p-2 bg-slate-50">
                  <div className="flex flex-col gap-2 select-none relative w-full h-full">
                    <div className="w-full h-3/5">
                      <ExplanationPanel
                        rankBy={rankBy}
                        weights={weightSort}
                        setRankBy={setRankBy}
                        handleRankByChange={handleRankByChange}
                        className="w-full h-full"
                      />
                    </div>

                    <hr className="border-slate-200" />

                    <div className="w-full h-2/5">
                      <WeightPanel
                        onClose={() => setShowWeightPanel(false)}
                        type={"Sort by"}
                        classes="h-full w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Action buttons fixed at bottom */}
                <div className="px-2 pb-2 bg-slate-50">
                  <ActionButtons />
                </div>
              </div>
            </div>
          )}

          {showReasonPanel && mode === "detail" && <ReasonPanel />}

          {isInfoOpen && (
            <div onClick={() => bringPanelToFront("info")}>
              <Info
                classes=""
                zIndex={getPanelZIndex("info")}
                popupItem={popupItem}
                setPopupItem={setPopupItem}
                popupOpen={popupOpen}
                setPopupOpen={setPopupOpen}
                setPopupPosition={setPopupPosition}
              />
            </div>
          )}

          {showCriteriaPanel && (
            <CriteriaPanel
              zIndex={getPanelZIndex("criteria")}
              onClick={() => bringPanelToFront("criteria")}
            />
          )}
        </>
      )}

      {isDataSelectorOpen && uploadedData.length > 0 && (
        <DataSelector
          uploadedData={uploadedData}
          dataTypes={dataTypes}
          defaultWeights={defaultWeights}
          setIsDataSelectorOpen={setIsDataSelectorOpen}
        />
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <span className="loading loading-spinner text-warning"></span>
        </div>
      )}
    </div>
  );
}
