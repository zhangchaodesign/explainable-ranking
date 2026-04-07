import React, { useEffect, useRef } from "react";
import {
  useItemDataStore,
  useSharedConfigStore,
  useStudyManagerStore,
  useWeightPanelStore,
} from "@/lib/store";
import { DataPoint } from "@/lib/type";
import { eventTracker } from "@/lib/utils";
import {
  useGoogleSheetLoader,
  extractSpreadsheetId,
} from "@/components/Onboarding/useGoogleSheetLoader";

interface DataLoaderProps {
  onDataLoad: (
    data: DataPoint[],
    isDefaultData: boolean,
    types?: { [key: string]: string },
  ) => void;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
}

const DataLoader = ({ onDataLoad, onClose }: DataLoaderProps) => {
  const { user, setUser, dataset, setDataset } = useStudyManagerStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const { rankItems, gridItems } = useItemDataStore();
  const { sheetLink, setSheetLink } = useSharedConfigStore();

  const {
    setSpreadsheetId,
    isFilterStage,
    availableFilters,
    selectedFilters,
    setSelectedFilters,
    loadDataFromGoogleSheet,
    applyFilterAndLoad,
    loadAllDataWithoutFilter,
  } = useGoogleSheetLoader(onDataLoad);

  const handleExport = () => {
    const columnsToExclude = ["id", "order", "chosen"];
    let allKeys = Object.keys(rankItems[0] || {}).filter(
      (key) => !columnsToExclude.includes(key),
    );

    let csvContent = allKeys.join(",") + "\n";

    rankItems.forEach((item) => {
      const row = allKeys
        .map((key) => {
          let value = item[key] !== undefined ? item[key] : "";

          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"') || value.includes("\n"))
          ) {
            value = value.replace(/"/g, '""');
            value = `"${value}"`;
          }
          return value;
        })
        .join(",");

      csvContent += row + "\n";
    });

    const encodedUri =
      "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", encodedUri);
    downloadAnchorNode.setAttribute("download", "data.csv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    setTimeout(() => {
      const weightSort = useWeightPanelStore.getState().weightSort;
      const weightKeys = Object.keys(weightSort);
      const weightCsvContent = weightKeys
        .map((key) => `${key},${weightSort[key]}`)
        .join("\n");
      const weightEncodedUri =
        "data:text/csv;charset=utf-8," + encodeURIComponent(weightCsvContent);
      const weightDownloadAnchorNode = document.createElement("a");
      weightDownloadAnchorNode.setAttribute("href", weightEncodedUri);
      weightDownloadAnchorNode.setAttribute("download", "weights.csv");
      document.body.appendChild(weightDownloadAnchorNode);
      weightDownloadAnchorNode.click();
      weightDownloadAnchorNode.remove();
    }, 500);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        onClose(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-2 w-72" ref={contentRef}>
      <label className="input input-sm input-bordered flex items-center gap-2">
        <input
          type="text"
          value={user}
          placeholder="Your name..."
          onChange={(event) => {
            setUser(event.target.value);
          }}
          className="grow w-16 text-sm"
        />
      </label>
      <label className="input input-sm input-bordered flex items-center gap-2">
        <input
          type="text"
          value={sheetLink}
          placeholder={"Your dataset link..."}
          onChange={(event) => {
            setSheetLink(event.target.value);
            const id = extractSpreadsheetId(event.target.value);
            if (id) {
              setSpreadsheetId(id);
            }
          }}
          className="grow w-16 text-sm"
        />
      </label>
      {gridItems.length === 0 && (
        <div className="join w-full">
          <div className="dropdown">
            <div
              tabIndex={sheetLink ? -1 : 0}
              role="button"
              className={`join-item btn btn-sm text-xs flex flex-row gap-2 shadow-none w-48 ${sheetLink ? "btn-disabled" : ""}`}
            >
              <span className="capitalize">{dataset}</span>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-md z-[1] p-2 shadow text-xs mt-1 w-full"
            >
              <li>
                <a
                  onClick={() => setDataset("cat")}
                  className={dataset === "cat" ? "active" : ""}
                >
                  Cat
                </a>
              </li>
              <li>
                <a
                  onClick={() => setDataset("city")}
                  className={dataset === "city" ? "active" : ""}
                >
                  City
                </a>
              </li>
              <li>
                <a
                  onClick={() => setDataset("vacation")}
                  className={dataset === "vacation" ? "active" : ""}
                >
                  Vacation
                </a>
              </li>
              <li>
                <a
                  onClick={() => setDataset("video")}
                  className={dataset === "video" ? "active" : ""}
                >
                  Video
                </a>
              </li>
              <li>
                <a
                  onClick={() => setDataset("minutes")}
                  className={dataset === "minutes" ? "active" : ""}
                >
                  Minutes
                </a>
              </li>
              <li>
                <a
                  onClick={() => setDataset("grading")}
                  className={dataset === "grading" ? "active" : ""}
                >
                  Grading
                </a>
              </li>
              <li>
                <a
                  onClick={() => setDataset("demo")}
                  className={dataset === "demo" ? "active" : ""}
                >
                  Best Cats
                </a>
              </li>
            </ul>
          </div>
          <button
            className="btn btn-sm btn-neutral join-item shadow-none text-xs w-24"
            onClick={() => {
              const currentUser = useStudyManagerStore.getState().user;
              if (!currentUser || currentUser.trim() === "") {
                alert("Please enter your name before loading data.");
                return;
              }
              loadDataFromGoogleSheet();
              const currentDataset = useStudyManagerStore.getState().dataset;
              eventTracker({
                action: "start study",
                data: {
                  id: currentUser,
                  dataset: currentDataset,
                },
              });
            }}
          >
            Load Data
          </button>
        </div>
      )}
      {isFilterStage && availableFilters.length > 0 && (
        <div className="space-y-2 border-t border-gray-200 pt-2">
          <p className="text-xs font-medium text-gray-600">
            Filter Data (any match)
          </p>
          {availableFilters.map((filter) => (
            <div key={filter.key} className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">{filter.key}:</label>
              <select
                className="select select-sm select-bordered w-full text-xs"
                value={selectedFilters[filter.key] || ""}
                onChange={(e) => {
                  setSelectedFilters({
                    ...selectedFilters,
                    [filter.key]: e.target.value,
                  });
                }}
              >
                {filter.values.map((value) => (
                  <option key={value} value={value}>
                    {value === "" ? "(empty)" : value}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <button
              className="btn btn-sm btn-neutral shadow-none text-xs w-full"
              onClick={() => {
                applyFilterAndLoad();
                const currentDataset = useStudyManagerStore.getState().dataset;
                eventTracker({
                  action: "filter applied",
                  data: {
                    dataset: currentDataset,
                    filters: selectedFilters,
                  },
                });
              }}
            >
              Apply Filter & Load
            </button>
            <button
              className="btn btn-sm shadow-none text-xs w-full"
              onClick={() => {
                loadAllDataWithoutFilter();
                const currentDataset = useStudyManagerStore.getState().dataset;
                eventTracker({
                  action: "skip filter",
                  data: {
                    dataset: currentDataset,
                  },
                });
              }}
            >
              Load All Data (Skip Filter)
            </button>
          </div>
        </div>
      )}
      {rankItems.length !== 0 && (
        <button
          onClick={() => {
            handleExport();
            const currentUser = useStudyManagerStore.getState().user;
            const currentDataset = useStudyManagerStore.getState().dataset;
            eventTracker({
              action: "end study",
              data: {
                id: currentUser,
                dataset: currentDataset,
              },
            });
          }}
          className="btn btn-sm shadow-none text-xs w-full"
        >
          Export Data
        </button>
      )}
    </div>
  );
};

export default DataLoader;
