import React, { useState, useRef } from "react";
import {
  useStudyManagerStore,
  useSharedConfigStore,
  useOpenAIAPI,
} from "@/lib/store";
import { DataPoint } from "@/lib/type";
import { eventTracker } from "@/lib/utils";
import {
  useGoogleSheetLoader,
  extractSpreadsheetId,
} from "@/components/Onboarding/useGoogleSheetLoader";
import { preprocessSheetRows } from "@/components/Onboarding/preprocessSheetRows";
import TutorialPanel from "@/components/Onboarding/TutorialPanel";
import { DatasetType } from "@/lib/constants";

interface OnboardingProps {
  onDataLoad: (
    data: DataPoint[],
    isDefaultData: boolean,
    types?: { [key: string]: string },
    weights?: { [key: string]: number },
  ) => void;
}

const DATASETS: { value: DatasetType; label: string }[] = [
  { value: "demo", label: "Best Cats" },
  // { value: "cat", label: "Cat" },
  // { value: "city", label: "City" },
  { value: "vacation", label: "Travel Destinations" },
  { value: "video", label: "3D Render Videos" },
  { value: "minutes", label: "Short Films" },
  // { value: "grading", label: "Grading" },
];

const Onboarding = ({ onDataLoad }: OnboardingProps) => {
  const { dataset, setDataset } = useStudyManagerStore();
  const {
    sheetLink,
    setSheetLink,
    setImageKey,
    setVideoKey,
    setLinkKey,
    setFileKey,
    setNumberKeys,
    setStringKeys,
    setCardKey,
    setNameKey,
    setUidKey,
    setAllKeys,
  } = useSharedConfigStore();
  const { aiEnabled, setAiEnabled, apiKey, setApiKey } = useOpenAIAPI();
  const [apiKeyError, setApiKeyError] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [uploadedFileData, setUploadedFileData] = useState<{name: string, data: any[], types?: { [key: string]: string }, weights?: { [key: string]: number }} | null>(null);

  const {
    setSpreadsheetId,
    isLoading,
    isFilterStage,
    availableFilters,
    selectedFilters,
    setSelectedFilters,
    loadDataFromGoogleSheet,
    applyFilterAndLoad,
    loadAllDataWithoutFilter,
  } = useGoogleSheetLoader(onDataLoad);

  const dataFileInputRef = useRef<HTMLInputElement>(null);

  const handleDataFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const firstLine = text.split('\n')[0] || '';
        if (!firstLine) return;

        // Auto-detect delimiter: if first line contains tabs, use tab; otherwise comma
        const delimiter = firstLine.includes('\t') ? '\t' : ',';

        // Parse the entire text into rows, handling multiline quoted fields
        const parseCSV = (input: string): string[][] => {
          const rows: string[][] = [];
          let currentField = '';
          let currentRow: string[] = [];
          let inQuotes = false;

          for (let i = 0; i < input.length; i++) {
            const char = input[i];

            if (inQuotes) {
              if (char === '"') {
                if (i + 1 < input.length && input[i + 1] === '"') {
                  // Escaped quote
                  currentField += '"';
                  i++;
                } else {
                  // End of quoted field
                  inQuotes = false;
                }
              } else {
                currentField += char;
              }
            } else {
              if (char === '"') {
                inQuotes = true;
              } else if (char === delimiter) {
                currentRow.push(currentField.trim());
                currentField = '';
              } else if (char === '\n' || char === '\r') {
                // Handle \r\n
                if (char === '\r' && i + 1 < input.length && input[i + 1] === '\n') {
                  i++;
                }
                currentRow.push(currentField.trim());
                if (currentRow.some(cell => cell !== '')) {
                  rows.push(currentRow);
                }
                currentRow = [];
                currentField = '';
              } else {
                currentField += char;
              }
            }
          }
          // Push last field/row
          currentRow.push(currentField.trim());
          if (currentRow.some(cell => cell !== '')) {
            rows.push(currentRow);
          }
          return rows;
        };

        const rawRows: any[][] = parseCSV(text);

        // Preprocess to handle index:/cprop: format
        const { rows: processedRows, indexColumn, defaultWeights } = preprocessSheetRows(rawRows);

        if (!indexColumn) {
          alert("Invalid file format: The first column header must have an 'index:' prefix to mark the UID column (e.g., 'index:UID').");
          if (dataFileInputRef.current) dataFileInputRef.current.value = "";
          return;
        }

        setUidKey(indexColumn);

        if (processedRows.length < 2) {
          alert("Invalid CSV format. The file must contain headers and a type row.");
          if (dataFileInputRef.current) dataFileInputRef.current.value = "";
          return;
        }

        const headers = processedRows[0] as string[];
        const typeRow = processedRows[1] as string[];

        // Validate type row
        const validTypes = new Set(['image', 'video', 'link', 'name', 'info', 'criterion', 'file', 'filter', '']);
        const isTypeRow = typeRow.every(t => validTypes.has(String(t).toLowerCase().replace(/!$/, '')));

        if (!isTypeRow) {
          alert("Invalid CSV format. The type row must specify valid data types (name, criterion, image, video, link, file, info, filter).");
          if (dataFileInputRef.current) dataFileInputRef.current.value = "";
          return;
        }

        // Build types mapping
        const types: { [key: string]: string } = {};
        headers.forEach((header, index) => {
          types[header] = typeRow[index] || "";
        });

        // Configure keys based on types
        const numberKeys: string[] = [];
        const stringKeys: string[] = [];
        const allKeys: string[] = [...headers];

        headers.forEach((header) => {
          const type = types[header].toLowerCase();
          const baseType = type.endsWith("!") ? type.slice(0, -1) : type;

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
              stringKeys.push(header);
              break;
          }
        });

        setStringKeys(stringKeys);
        setNumberKeys(numberKeys);
        setAllKeys(allKeys);

        // Parse data rows (starting from row 2)
        const data: any[] = [];
        for (let i = 2; i < processedRows.length; i++) {
          const row = processedRows[i];
          const obj: any = {};
          headers.forEach((header, index) => {
            let val: any = index < row.length ? row[index] : '';
            if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
              val = val.slice(1, -1);
            }
            if (val !== '' && !isNaN(Number(val))) {
              val = Number(val);
            }
            obj[header] = val;
          });

          if (!obj.id) obj.id = Date.now() + i;
          data.push(obj);
        }

        setUploadedFileData({ name: file.name, data, types, weights: defaultWeights });
      };
      reader.readAsText(file);
    }
  };

  const handleGetStarted = () => {
    if (aiEnabled && !apiKey.trim()) {
      setApiKeyError(true);
      return;
    }
    setApiKeyError(false);

    if (uploadedFileData) {
      onDataLoad(uploadedFileData.data, false, uploadedFileData.types, uploadedFileData.weights);
      const currentDataset = useStudyManagerStore.getState().dataset;
      eventTracker({
        action: "start study",
        data: {
          dataset: currentDataset,
          uploadedFile: uploadedFileData.name,
        },
      });
      return;
    }

    loadDataFromGoogleSheet();
    const currentDataset = useStudyManagerStore.getState().dataset;
    eventTracker({
      action: "start study",
      data: {
        dataset: currentDataset,
      },
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Interactive Explainable Ranking
          </h1>
          <p className="text-sm text-gray-500">
            Explore and rank choices with explanations.
          </p>
        </div>

        {/* Setup Card */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-6 space-y-5">
          {/* Dataset Selection */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Dataset</label>

            {/* Preset dropdown */}
            <div
              className={`dropdown w-full ${sheetLink || uploadedFileData ? "pointer-events-none opacity-50" : ""}`}
            >
              <div
                tabIndex={sheetLink || uploadedFileData ? -1 : 0}
                role="button"
                className="btn w-full justify-between"
              >
                <span>{DATASETS.find((d) => d.value === dataset)?.label || dataset}</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-[1] w-full p-2 shadow"
              >
                {DATASETS.map((d) => (
                  <li key={d.value}>
                    <a
                      onClick={() => setDataset(d.value)}
                      className={dataset === d.value ? "active" : ""}
                    >
                      {d.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400">or use your own</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            {/* Custom link */}
            <input
              type="text"
              value={sheetLink}
              placeholder="Paste Google Sheets link..."
              onChange={(e) => {
                setSheetLink(e.target.value);
                const id = extractSpreadsheetId(e.target.value);
                if (id) {
                  setSpreadsheetId(id);
                }
              }}
              className={`input input-bordered w-full ${uploadedFileData ? "opacity-50 pointer-events-none" : ""}`}
              disabled={!!uploadedFileData}
            />

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400">or upload local files</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            {/* File Uploads */}
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept=".csv,.tsv"
                ref={dataFileInputRef}
                onChange={handleDataFileUpload}
                className="hidden"
              />
              {uploadedFileData ? (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded p-2">
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-gray-700 truncate" title={uploadedFileData.name}>
                      {uploadedFileData.name}
                    </p>
                    <p className="text-xs text-gray-500">{uploadedFileData.data.length} items ready</p>
                  </div>
                  <button
                    className="btn btn-xs text-gray-600"
                    onClick={() => dataFileInputRef.current?.click()}
                  >
                    Change
                  </button>
                  <button
                    className="btn btn-xs btn-ghost text-error"
                    onClick={() => {
                      setUploadedFileData(null);
                      if (dataFileInputRef.current) dataFileInputRef.current.value = "";
                    }}
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <button
                  className="btn w-full text-xs"
                  onClick={() => dataFileInputRef.current?.click()}
                >
                  Upload Data (CSV/TSV)
                </button>
              )}
            </div>
          </div>

          {/* AI Features Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                AI Features
              </label>
              <input
                type="checkbox"
                className="toggle toggle-sm"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
              />
            </div>
            <p className="text-xs text-gray-400">
              Optional. All core features work without AI. Enabling this adds
              assistance for creating new criteria and initial sorting.
            </p>
            <input
              type="password"
              value={apiKey}
              placeholder="Enter your OpenAI API key..."
              onChange={(e) => {
                setApiKey(e.target.value);
                if (e.target.value.trim()) setApiKeyError(false);
              }}
              className={`input input-bordered w-full ${!aiEnabled ? "input-disabled opacity-50" : ""} ${apiKeyError ? "input-error" : ""}`}
              disabled={!aiEnabled}
            />
            {apiKeyError && (
              <p className="text-xs text-error">
                Please enter your OpenAI API key or disable AI features.
              </p>
            )}
          </div>

          {/* Filter Stage */}
          {isFilterStage && availableFilters.length > 0 && (
            <div className="space-y-3 border-t border-gray-200 pt-4">
              <p className="text-sm font-medium text-gray-700">Filter Data</p>
              <p className="text-xs text-gray-500">
                Select values to filter by (any match)
              </p>
              {availableFilters.map((filter) => (
                <div key={filter.key} className="space-y-1">
                  <label className="text-xs text-gray-500">{filter.key}</label>
                  <select
                    className="select select-bordered select-sm w-full"
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
                  className="btn btn-neutral w-full"
                  onClick={() => {
                    applyFilterAndLoad();
                    eventTracker({
                      action: "filter applied",
                      data: {
                        dataset: useStudyManagerStore.getState().dataset,
                        filters: selectedFilters,
                      },
                    });
                  }}
                >
                  Apply Filter & Load
                </button>
                <button
                  className="btn btn-ghost w-full"
                  onClick={() => {
                    loadAllDataWithoutFilter();
                    eventTracker({
                      action: "skip filter",
                      data: {
                        dataset: useStudyManagerStore.getState().dataset,
                      },
                    });
                  }}
                >
                  Load All Data (Skip Filter)
                </button>
              </div>
            </div>
          )}

          {/* Get Started Button */}
          {!isFilterStage && (
            <button
              className="btn btn-neutral w-full"
              onClick={handleGetStarted}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                "Get Started"
              )}
            </button>
          )}
        </div>

        {/* Tutorial Button */}
        <div className="text-center mt-4">
          <button
            className="btn btn-ghost btn-sm text-gray-400 hover:text-gray-600"
            onClick={() => setShowTutorial(true)}
          >
            Tutorial & Help
          </button>
        </div>
      </div>

      {showTutorial && <TutorialPanel onClose={() => setShowTutorial(false)} />}
    </div>
  );
};

export default Onboarding;
