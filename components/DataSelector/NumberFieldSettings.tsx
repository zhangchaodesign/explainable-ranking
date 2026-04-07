import React, { useState } from "react";
import NormalizationRangeInputs from "./NormalizationRangeInputs";

interface NumberFieldSettingsProps {
  fieldKey: string;
  isEditable: boolean;
  isNormalized: boolean;
  normalizeRanges: { [key: string]: [number, number] };
  onEditableChange: (checked: boolean) => void;
  onNormalizeChange: (checked: boolean) => void;
  setNormalizeRanges: React.Dispatch<
    React.SetStateAction<{ [key: string]: [number, number] }>
  >;
}

const NumberFieldSettings = ({
  fieldKey,
  isEditable,
  isNormalized,
  normalizeRanges,
  onEditableChange,
  onNormalizeChange,
  setNormalizeRanges,
}: NumberFieldSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const togglePopup = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* Settings Button */}
      <button
        onClick={togglePopup}
        className="btn btn-xs btn-ghost hover:bg-gray-100 p-1"
        title="Field Settings"
      >
        ⚙️
      </button>

      {/* Popup */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Popup Content */}
          <div
            className="absolute top-8 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[280px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-sm text-gray-700">
                Settings for &quot;{fieldKey}&quot;
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-xs btn-ghost hover:bg-gray-100 shadow-none border-none"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Editable Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isEditable}
                  onChange={(e) => {
                    e.stopPropagation();
                    onEditableChange(e.target.checked);
                  }}
                  className="checkbox checkbox-xs checkbox-neutral"
                />
                <span className="text-sm text-gray-600">Editable</span>
              </div>

              {/* Normalize Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isNormalized}
                  onChange={(e) => {
                    e.stopPropagation();
                    onNormalizeChange(e.target.checked);
                  }}
                  className="checkbox checkbox-xs checkbox-neutral"
                />
                <span className="text-sm text-gray-600">Normalize</span>
              </div>

              {/* Normalization Range Inputs */}
              {isNormalized && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <NormalizationRangeInputs
                    fieldKey={fieldKey}
                    normalizeRanges={normalizeRanges}
                    setNormalizeRanges={setNormalizeRanges}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NumberFieldSettings;
