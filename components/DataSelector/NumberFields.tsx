import React from "react";
import NumberFieldSettings from "./NumberFieldSettings";

interface NumberFieldsProps {
  numberKeys: string[];
  selectedNumberFields: string[];
  fieldEditableStates: { [key: string]: boolean };
  fieldNormalizeStates: { [key: string]: boolean };
  fieldNormalizeRanges: { [key: string]: [number, number] };
  onNumberClick: (key: string) => void;
  setFieldEditableStates: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
  setFieldNormalizeStates: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
  setFieldNormalizeRanges: React.Dispatch<
    React.SetStateAction<{ [key: string]: [number, number] }>
  >;
}

const NumberFields = ({
  numberKeys,
  selectedNumberFields,
  fieldEditableStates,
  fieldNormalizeStates,
  fieldNormalizeRanges,
  onNumberClick,
  setFieldEditableStates,
  setFieldNormalizeStates,
  setFieldNormalizeRanges,
}: NumberFieldsProps) => {
  const renderNumberFieldItem = (key: string) => (
    <div key={key} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNumberClick(key)}
          className={`btn btn-sm border shadow-none border-gray-100 font-medium ${
            selectedNumberFields.includes(key)
              ? "btn-neutral"
              : "btn-outline text-gray-400 bg-white"
          }`}
        >
          <span className="flex items-center gap-0.5">
            {key}
            {selectedNumberFields.includes(key) && (
              <NumberFieldSettings
                fieldKey={key}
                isEditable={fieldEditableStates[key] ?? true}
                isNormalized={fieldNormalizeStates[key] ?? false}
                normalizeRanges={fieldNormalizeRanges}
                onEditableChange={(checked) => {
                  setFieldEditableStates((prev) => ({
                    ...prev,
                    [key]: checked,
                  }));
                }}
                onNormalizeChange={(checked) => {
                  setFieldNormalizeStates((prev) => ({
                    ...prev,
                    [key]: checked,
                  }));
                }}
                setNormalizeRanges={setFieldNormalizeRanges}
              />
            )}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-col gap-2">
        <div className="flex gap-4 items-center">
          <p>Criteria</p>
        </div>
        <div className="flex gap-2">
          {numberKeys.map(renderNumberFieldItem)}
        </div>
      </div>
    </div>
  );
};

export default NumberFields;
