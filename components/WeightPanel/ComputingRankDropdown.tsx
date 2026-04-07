"use client";
import React from "react";
import { useSharedConfigStore } from "@/lib/store";
import { capitalizeWords } from "@/lib/utils";

type ComputingRankDropdownProps = {
  title: string;
  sortBy: string;
  setSortBy: (value: string) => void;
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
      <a onClick={() => props.handleSortChange(props.labelName)}>
        {displayName}
      </a>
    </li>
  );
};

const ComputingRankDropdown = ({
  title,
  sortBy,
  handleSortChange,
}: ComputingRankDropdownProps) => {
  const numberKeys = useSharedConfigStore((state) => state.numberKeys).filter(
    (key) => key !== "id" && key !== "order",
  );

  return (
    <>
      <div className="dropdown">
        <div
          tabIndex={0}
          role="button"
          className="btn btn-xs m-1 bg-white shadow-none hover:bg-gray-100"
        >
          <div className="truncate whitespace-nowrap leading-relaxed">
            <span className="text-gray-400 font-medium">{title}</span>{" "}
            {sortBy !== "" &&
              "Weighted " + capitalizeWords(sortBy ? sortBy : "null")}
          </div>
        </div>
        <ul
          tabIndex={0}
          className={
            "text-xs menu dropdown-content bg-base-100 rounded-box z-[1] p-2 shadow gap-2" +
            " " +
            (title === "Color by" ? "w-64" : "w-full")
          }
        >
          {numberKeys.map((key) => {
            return DropdownItem({
              labelName: key,
              handleSortChange: handleSortChange,
              displayName: "Weighted " + capitalizeWords(key),
            });
          })}
          <li>
            <a
              onClick={() => {
                handleSortChange("aggregated score");
              }}
            >
              Weighted Aggregated Score
            </a>
          </li>
        </ul>
      </div>
    </>
  );
};

export default ComputingRankDropdown;
