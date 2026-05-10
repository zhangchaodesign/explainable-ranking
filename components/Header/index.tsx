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
    uidKey,
    numberKeys,
    stringKeys,
    videoKey,
    fileKey,
  } = useSharedConfigStore();
  const { dataset } = useStudyManagerStore();

  const handleExport = () => {
    const dataToExport = rankItems.length > 0 ? rankItems : items;
    if (dataToExport.length === 0) return;

    const weightSort = useWeightPanelStore.getState().weightSort;
    const columnsToExclude = ["id", "order", "chosen"];
    let allKeys = Object.keys(dataToExport[0] || {}).filter(
      (key) => !columnsToExclude.includes(key),
    );

    // Put UID column first
    const indexCol = uidKey || nameKey || allKeys[0];
    if (indexCol && allKeys.includes(indexCol)) {
      allKeys = [indexCol, ...allKeys.filter((key) => key !== indexCol)];
    }

    const getType = (key: string): string => {
      if (imageKey && key === imageKey) return "image";
      if (key === videoKey) return "video";
      if (key === fileKey) return "file";
      if (key === nameKey) return "name";
      if (numberKeys.includes(key)) return "criterion";
      if (stringKeys.includes(key)) return "info";
      return "info";
    };

    const defaultType = "info";
    const defaultWeight = 1;
    const TAB = "\t";

    const headerRow = allKeys
      .map((key) => (key === indexCol ? `index:${key}` : key))
      .join(TAB);

    const typeRow = allKeys
      .map((key, i) => (i === 0 ? `cprop:type:${defaultType}` : getType(key)))
      .join(TAB);

    const weightRow = allKeys
      .map((key, i) => {
        if (i === 0) return `cprop:weight:${defaultWeight}`;
        if (numberKeys.includes(key))
          return weightSort[key] !== undefined ? weightSort[key] : "";
        return "";
      })
      .join(TAB);

    const dataLines = dataToExport.map((item) =>
      allKeys
        .map((key) => {
          const val = item[key];
          return val !== undefined && val !== null ? val : "";
        })
        .join(TAB),
    );

    const tsvContent = [headerRow, typeRow, weightRow, ...dataLines].join("\n");

    const encodedUri =
      "data:text/tab-separated-values;charset=utf-8," +
      encodeURIComponent(tsvContent);
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", encodedUri);
    downloadAnchorNode.setAttribute("download", "data.tsv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
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
