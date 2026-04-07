import React from "react";
import Link from "next/link";
import Menu from "@/components/Header/Menu";
import { DataPoint } from "@/lib/type";
import {
  useItemDataStore,
  useSharedConfigStore,
  useStudyManagerStore,
  useWeightPanelStore,
} from "@/lib/store";
import { eventTracker } from "@/lib/utils";
import { DATASET_SHEETS } from "@/lib/constants";

type HeaderProps = {
  onDataLoad: (data: DataPoint[], isDefaultData: boolean) => void;
};

const Header = ({ onDataLoad }: HeaderProps) => {
  const { rankItems, items } = useItemDataStore();
  const {
    sheetLink,
    imageKey,
    nameKey,
    numberKeys,
    stringKeys,
    videoKey,
    fileKey,
  } = useSharedConfigStore();
  const { dataset } = useStudyManagerStore();

  const handleExport = () => {
    const dataToExport = rankItems.length > 0 ? rankItems : items;
    if (dataToExport.length === 0) return;

    const columnsToExclude = ["id", "order", "chosen"];
    const allKeys = Object.keys(dataToExport[0] || {}).filter(
      (key) => !columnsToExclude.includes(key),
    );

    let csvContent = allKeys.join(",") + "\n";

    const typeRow = allKeys.map(key => {
      if (key === imageKey) return "image";
      if (key === nameKey) return "name";
      if (key === videoKey) return "video";
      if (key === fileKey) return "file";
      if (numberKeys.includes(key)) return "criterion";
      if (stringKeys.includes(key)) return "info";
      return "";
    }).join(",") + "\n";

    csvContent += typeRow;

    dataToExport.forEach((item) => {
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

  return (
    <div className="flex flex-row w-full justify-between items-center p-4 border-b border-gray-100 h-12 bg-white">
      <div className="flex flex-row items-center gap-4">
        <h1 className={"font-semibold text-gray-800"}>
          <Link href="/">Interactive Explainable Ranking</Link>
        </h1>
      </div>
      <Menu classes="absolute left-72" onDataLoad={onDataLoad} />
      <div className="flex flex-row gap-2 items-center">
        {(sheetLink || DATASET_SHEETS[dataset]) && (
          <button
            className="btn btn-sm btn-ghost text-xs"
            onClick={() => {
              const urlToOpen =
                sheetLink ||
                `https://docs.google.com/spreadsheets/d/${DATASET_SHEETS[dataset]}/edit`;
              if (urlToOpen) window.open(urlToOpen, "_blank");
            }}
          >
            Open Sheet
          </button>
        )}
        {(rankItems.length > 0 || items.length > 0) && (
          <button
            className="btn btn-sm btn-ghost text-xs"
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
          >
            Export Data
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;
