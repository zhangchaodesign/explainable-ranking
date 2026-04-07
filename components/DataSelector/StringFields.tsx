import React from "react";

interface StringFieldsProps {
  stringKeys: string[];
  selectedStringFields: string[];
  onStringClick: (key: string) => void;
}

const StringFields = ({
  stringKeys,
  selectedStringFields,
  onStringClick,
}: StringFieldsProps) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <p>Other Fields</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {stringKeys.map((key) => (
            <button
              key={key}
              onClick={() => onStringClick(key)}
              className={`btn btn-sm border shadow-none border-gray-100 font-medium ${
                selectedStringFields.includes(key)
                  ? "btn-neutral"
                  : "btn-outline text-gray-400 bg-white"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StringFields;
