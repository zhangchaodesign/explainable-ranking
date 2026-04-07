import React, { useState } from "react";
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
import { DatasetType } from "@/lib/constants";

interface OnboardingProps {
  onDataLoad: (
    data: DataPoint[],
    isDefaultData: boolean,
    types?: { [key: string]: string },
  ) => void;
}

const DATASETS: { value: DatasetType; label: string }[] = [
  { value: "demo", label: "Demo" },
  { value: "cat", label: "Cat" },
  { value: "city", label: "City" },
  { value: "vacation", label: "Vacation" },
  { value: "video", label: "Video" },
  { value: "minutes", label: "Minutes" },
  { value: "grading", label: "Grading" },
];

const Onboarding = ({ onDataLoad }: OnboardingProps) => {
  const { user, setUser, dataset, setDataset } = useStudyManagerStore();
  const { sheetLink, setSheetLink } = useSharedConfigStore();
  const { aiEnabled, setAiEnabled, apiKey, setApiKey } = useOpenAIAPI();
  const [nameError, setNameError] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);

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

  const handleGetStarted = () => {
    const currentUser = useStudyManagerStore.getState().user;
    if (!currentUser || currentUser.trim() === "") {
      setNameError(true);
      return;
    }
    setNameError(false);
    if (aiEnabled && !apiKey.trim()) {
      setApiKeyError(true);
      return;
    }
    setApiKeyError(false);
    loadDataFromGoogleSheet();
    const currentDataset = useStudyManagerStore.getState().dataset;
    eventTracker({
      action: "start study",
      data: {
        id: currentUser,
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
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">User ID</label>
            <input
              type="text"
              value={user}
              placeholder="Enter your User ID..."
              onChange={(e) => {
                setUser(e.target.value);
                if (e.target.value.trim()) setNameError(false);
              }}
              className={`input input-bordered w-full ${nameError ? "input-error" : ""}`}
            />
            {nameError && (
              <p className="text-xs text-error">
                Please enter your name to continue.
              </p>
            )}
          </div>

          {/* Dataset Selection */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Dataset</label>

            {/* Preset dropdown */}
            <div
              className={`dropdown w-full ${sheetLink ? "pointer-events-none opacity-50" : ""}`}
            >
              <div
                tabIndex={sheetLink ? -1 : 0}
                role="button"
                className="btn w-full justify-between"
              >
                <span className="capitalize">{dataset}</span>
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
              className="input input-bordered w-full"
            />
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
      </div>
    </div>
  );
};

export default Onboarding;
