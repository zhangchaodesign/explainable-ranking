"use client";
import React, { useState } from "react";
import WeightPanel from "@/components/WeightPanel";
import { useSharedConfigStore } from "@/lib/store";
import { capitalizeWords, eventTracker } from "@/lib/utils";

type DropdownProps = {
  title: string;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortText?: string;
  setSortText?: (value: string) => void;
  handleSortChange: (value: string) => void;
};

type SortOptionType = {
  labelName: string;
  reverse?: boolean;
};

/*Extend sortOption to take handleSortChange function pointer*/
type DropdownOptionProps = SortOptionType & {
  handleSortChange: (value: string) => void;
  displayName?: string;
};

const DropdownItem = (props: DropdownOptionProps) => {
  // const displayName = 'displayName' in props? props.displayName:props.labelName;
  const displayName = props.displayName ?? props.labelName;
  return (
    <li key={`"ddwn${props.labelName}"`}>
      <a
        onClick={() => {
          props.handleSortChange(props.labelName);
          eventTracker({
            action: "color",
            data: {
              value: props.labelName,
            },
          });
        }}
      >
        {displayName}
      </a>
    </li>
  );
};

const Dropdown = ({
  title,
  sortBy,
  setSortBy,
  sortText,
  setSortText,
  handleSortChange,
}: DropdownProps) => {
  const numberKeys = useSharedConfigStore((state) => state.numberKeys).filter(
    (key) => key !== "id" && key !== "order",
  );

  return (
    <>
      <div className="dropdown">
        <div
          tabIndex={0}
          role="button"
          className="btn btn-sm m-1 bg-white shadow-none hover:bg-gray-100"
        >
          <div className="truncate whitespace-nowrap leading-relaxed">
            <span className="text-gray-400 font-medium">{title}</span>{" "}
            {sortBy !== "aggregated score" &&
              sortBy !== "" &&
              capitalizeWords(sortBy ? sortBy : sortText ? sortText : "null")}
          </div>
        </div>
        <ul
          tabIndex={0}
          className={
            "menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] p-2 shadow gap-2 w-full"
          }
        >
          <li>
            <a
              onClick={() => {
                handleSortChange("null");
                eventTracker({
                  action: "color",
                  data: {
                    value: "null",
                  },
                });
              }}
            >
              Null
            </a>
          </li>
          {numberKeys.map((key) => {
            return DropdownItem({
              labelName: key,
              handleSortChange: handleSortChange,
              displayName: capitalizeWords(key),
            });
          })}
          <li>
            <a
              onClick={() => {
                handleSortChange("Average Score");
                eventTracker({
                  action: "color",
                  data: { value: "Average Score" },
                });
              }}
            >
              Average
            </a>
          </li>
          <li>
            <a
              onClick={() => {
                handleSortChange("Aggregated Score");
                eventTracker({
                  action: "color",
                  data: { value: "Aggregated Score" },
                });
              }}
            >
              Aggregated
            </a>
          </li>
          {/* <li>
            <input
              type="text"
              placeholder="Type keywords here..."
              className="input-md input-bordered w-full max-w-xs"
              value={sortText}
              onChange={(e) => {
                if (setSortText) {
                  setSortText(e.target.value);
                  setSortBy("");
                }
              }}
            />
          </li> */}
        </ul>
      </div>
    </>
  );
};

export default Dropdown;
