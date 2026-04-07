import React from "react";

interface NormalizationRangeInputsProps {
  fieldKey: string;
  normalizeRanges: { [key: string]: [number, number] };
  setNormalizeRanges: React.Dispatch<React.SetStateAction<{ [key: string]: [number, number] }>>;
}

const NormalizationRangeInputs = ({
  fieldKey,
  normalizeRanges,
  setNormalizeRanges,
}: NormalizationRangeInputsProps) => {
  return (
    <div className="ml-6 flex items-center gap-2">
      <span className="text-xs text-gray-500">Range:</span>
      <input
        type="number"
        step="0.01"
        value={normalizeRanges[fieldKey]?.[0] ?? 0}
        onChange={(e) => {
          e.stopPropagation();
          const value = parseFloat(e.target.value);
          setNormalizeRanges((prev) => ({
            ...prev,
            [fieldKey]: [value, prev[fieldKey]?.[1] ?? 1],
          }));
        }}
        className="input input-xs w-16 border-gray-200"
        placeholder="Min"
      />
      <span className="text-xs text-gray-400">to</span>
      <input
        type="number"
        step="0.01"
        value={normalizeRanges[fieldKey]?.[1] ?? 1}
        onChange={(e) => {
          e.stopPropagation();
          const value = parseFloat(e.target.value);
          setNormalizeRanges((prev) => ({
            ...prev,
            [fieldKey]: [prev[fieldKey]?.[0] ?? 0, value],
          }));
        }}
        className="input input-xs w-16 border-gray-200"
        placeholder="Max"
      />
    </div>
  );
};

export default NormalizationRangeInputs;