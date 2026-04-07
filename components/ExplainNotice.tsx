import React, { useEffect } from "react";
import { cn, eventTracker } from "@/lib/utils";
import {
  useItemDataStore,
  useSharedConfigStore,
  useCriteriaDataStore,
  useWeightPanelStore,
} from "@/lib/store";

interface ExplainNoticeProps {
  show: boolean;
  classes?: string;
}

const ExplainNotice = ({ show, classes }: ExplainNoticeProps) => {
  const { setIsNewCriteriaOpen, conflictingIds } = useSharedConfigStore();
  const { rankItems } = useItemDataStore();
  const { weightSort } = useWeightPanelStore();

  return (
    <div className={cn(classes, "select-none h-8")}>
      {show && rankItems.length > 0 && Object.keys(weightSort).length === 0 && (
        <div
          className="flex items-center p-4 h-8 text-xs text-red-800 border border-red-300 rounded bg-red-50"
          role="alert"
        >
          <svg
            className="shrink-0 inline w-4 h-4 me-2"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
          </svg>
          <span className="sr-only">Info</span>
          <div>
            <span className="flex items-center gap-1">
              Your ranking does not include any criteria for explanation.
              Consider{" "}
              <button
                onClick={() => {
                  setIsNewCriteriaOpen(true);
                }}
                className="btn btn-secondary shadow-none btn-xs"
              >
                Add a Criterion
              </button>{" "}
              to make it more explanable.
            </span>
          </div>
        </div>
      )}
      {show &&
        rankItems.length > 0 &&
        Object.keys(weightSort).length > 0 &&
        (conflictingIds.lower.length > 0 ||
          conflictingIds.higher.length > 0) && (
          <div
            className="flex items-center p-4 h-8 text-xs text-red-800 border border-red-300 rounded bg-red-50"
            role="alert"
          >
            <svg
              className="shrink-0 inline w-4 h-4 me-2"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
            </svg>
            <span className="sr-only">Info</span>
            <div>
              <span className="flex items-center gap-1">
                Your ranking does not align with the defined criteria and their
                weights. Consider{" "}
                <button
                  onClick={() => {
                    setIsNewCriteriaOpen(true);
                  }}
                  className="btn btn-secondary shadow-none btn-xs"
                >
                  Add a Criterion
                </button>{" "}
                to improve its explanation.
              </span>
            </div>
          </div>
        )}
      {show &&
        Object.keys(weightSort).length > 0 &&
        (conflictingIds.lower.length === 0 ||
          conflictingIds.higher.length === 0) && (
          <div
            className="flex items-center p-4 h-8 text-xs text-green-800 border border-green-300 rounded-lg bg-green-50"
            role="alert"
          >
            <svg
              className="shrink-0 inline w-4 h-4 me-2"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
            </svg>
            <span className="sr-only">Info</span>
            <div>
              <span className="flex items-center gap-1">
                The current ranking is well-explained by the defined criteria
                and their weights. Congratulations!
              </span>
            </div>
          </div>
        )}
    </div>
  );
};

export default ExplainNotice;
