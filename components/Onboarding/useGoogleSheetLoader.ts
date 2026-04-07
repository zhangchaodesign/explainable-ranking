import { useState } from "react";
import { useSharedConfigStore, useStudyManagerStore } from "@/lib/store";
import { DataPoint } from "@/lib/type";
import { DATASET_SHEETS } from "@/lib/constants";

type OnDataLoad = (
  data: DataPoint[],
  isDefaultData: boolean,
  types?: { [key: string]: string },
) => void;

export function extractSpreadsheetId(link: string): string | null {
  const regex = /\/d\/([a-zA-Z0-9-_]+)/;
  const match = link.match(regex);
  return match ? match[1] : null;
}

export function useGoogleSheetLoader(onDataLoad: OnDataLoad) {
  const {
    setVideoKey,
    setLinkKey,
    setImageKey,
    setFileKey,
    setNumberKeys,
    setStringKeys,
    setCardKey,
    setNameKey,
    setAllKeys,
    sheetLink,
  } = useSharedConfigStore();

  const [spreadsheetId, setSpreadsheetId] = useState<string>(
    extractSpreadsheetId(sheetLink) || "",
  );
  const [rawSheetData, setRawSheetData] = useState<any[][] | null>(null);
  const [isFilterStage, setIsFilterStage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<
    { key: string; values: string[] }[]
  >([]);
  const [selectedFilters, setSelectedFilters] = useState<{
    [key: string]: string;
  }>({});

  const processGoogleSheetData = (
    rows: any[][],
    applyFilter: boolean = false,
  ) => {
    if (rows.length < 2) {
      console.error("Not enough rows in the data");
      return { data: [], types: {}, filterKeys: [], allData: [] };
    }

    const headers = rows[0];
    const types = rows[1];

    const numberKeys: string[] = [];
    const stringKeys: string[] = [];
    const allKeys: string[] = [];
    const filterKeys: string[] = [];

    headers.forEach((header: string, index: number) => {
      const type = types[index]?.toLowerCase();
      const baseType = type?.endsWith("!") ? type.slice(0, -1) : type;
      allKeys.push(header);

      switch (baseType) {
        case "image":
          setImageKey(header);
          break;
        case "video":
          setVideoKey(header);
          stringKeys.push(header);
          break;
        case "link":
          setLinkKey(header);
          stringKeys.push(header);
          break;
        case "name":
          setCardKey(header);
          setNameKey(header);
          stringKeys.push(header);
          break;
        case "info":
          stringKeys.push(header);
          break;
        case "criterion":
          numberKeys.push(header);
          break;
        case "file":
          setFileKey(header);
          stringKeys.push(header);
          break;
        case "filter":
          filterKeys.push(header);
          stringKeys.push(header);
          break;
      }
    });

    setStringKeys(stringKeys);
    setNumberKeys(numberKeys);
    setAllKeys(allKeys);

    const dataRows = rows.slice(2);
    const processedData = dataRows.map((row: any[]) => {
      const dataPoint: any = {};
      headers.forEach((header: string, colIndex: number) => {
        const value = colIndex < row.length ? row[colIndex] : "";
        if (numberKeys.includes(header)) {
          dataPoint[header] = parseFloat(value) || 0;
        } else {
          dataPoint[header] = value ?? "";
        }
      });
      return dataPoint;
    });

    let filteredData = processedData;
    if (applyFilter && Object.keys(selectedFilters).length > 0) {
      filteredData = processedData.filter((item: any) => {
        return Object.entries(selectedFilters).some(([key, value]) => {
          const itemValue = item[key] ?? "";
          const filterValue = value ?? "";
          return itemValue === filterValue;
        });
      });
    }

    const typesMapping: { [key: string]: string } = {};
    headers.forEach((header: string, index: number) => {
      typesMapping[header] = types[index] || "";
    });

    return {
      data: filteredData,
      types: typesMapping,
      filterKeys,
      allData: processedData,
    };
  };

  const loadDataFromGoogleSheet = async () => {
    let url = "";
    if (!spreadsheetId) {
      const dataset = useStudyManagerStore.getState().dataset;
      const sheetId =
        DATASET_SHEETS[dataset] ||
        "1_Tl_y8V4dNu41jjzU5P9Y4YRRnwHx-VTHBLe07ZXqEI";
      url = `/api/sheet?id=${encodeURIComponent(sheetId)}`;
    } else {
      url = `/api/sheet?id=${encodeURIComponent(spreadsheetId)}`;
    }

    setIsLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      const data = await response.json();
      const rows = data.values;

      setRawSheetData(rows);
      const result = processGoogleSheetData(rows, false);

      if (result.filterKeys && result.filterKeys.length > 0) {
        const filters = result.filterKeys.map((key: string) => {
          const uniqueValues = Array.from(
            new Set(
              result.allData
                .map((item: any) => item[key] ?? "")
                .filter((val: any) => val !== undefined && val !== null),
            ),
          ) as string[];
          return { key, values: uniqueValues };
        });
        setAvailableFilters(filters);
        const initialFilters: { [key: string]: string } = {};
        filters.forEach((filter) => {
          if (filter.values.length > 0) {
            initialFilters[filter.key] = filter.values[0];
          }
        });
        setSelectedFilters(initialFilters);
        setIsFilterStage(true);
      } else {
        onDataLoad(result.data, false, result.types);
      }
    } catch (error) {
      console.error("Error fetching Google Sheets data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilterAndLoad = () => {
    if (!rawSheetData) return;
    const { data: processedData, types } = processGoogleSheetData(
      rawSheetData,
      true,
    );
    onDataLoad(processedData, false, types);
    setIsFilterStage(false);
  };

  const loadAllDataWithoutFilter = () => {
    if (!rawSheetData) return;
    const { data: processedData, types } = processGoogleSheetData(
      rawSheetData,
      false,
    );
    onDataLoad(processedData, false, types);
    setIsFilterStage(false);
  };

  return {
    spreadsheetId,
    setSpreadsheetId,
    isLoading,
    isFilterStage,
    availableFilters,
    selectedFilters,
    setSelectedFilters,
    loadDataFromGoogleSheet,
    applyFilterAndLoad,
    loadAllDataWithoutFilter,
  };
}
