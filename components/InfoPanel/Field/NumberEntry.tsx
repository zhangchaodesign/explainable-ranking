import { toNumber } from "@/lib/utils";
import React, { useMemo, useEffect, useState } from "react";
import { TbCheck, TbPencil } from "react-icons/tb";
import {
  useItemDataStore,
  useInfoPanelConfigStore,
  useCriteriaPanelStore,
  useSharedConfigStore,
} from "@/lib/store";

interface TinyEntryProps {
  id: number;
  title: string;
  weight: number;
  content: number;
  editable?: boolean;
  onChange?: (value: number) => void;
}

const NumberEntry = ({
  title,
  weight,
  content,
  editable = false,
  onChange,
}: TinyEntryProps) => {
  const { items } = useItemDataStore();
  const { selectedIDs } = useInfoPanelConfigStore();
  const { setShowCriteriaPanel, setCurrentCriteria } = useCriteriaPanelStore();
  const { setIsNewCriteriaOpen } = useSharedConfigStore();

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(content);
  const [inputValue, setInputValue] = useState(content?.toString() || "0");

  useEffect(() => {
    setValue(content);
    setInputValue(content?.toString() || "0");
  }, [content]);

  const handleSave = () => {
    // Validate that we have a proper number
    if (isNaN(value)) {
      // Reset to the last valid value or 0 if there was none
      setValue(content || 0);
      setInputValue((content || 0).toString());
    } else {
      // Only call onChange if we have a valid number
      if (onChange) onChange(value);
    }
    setIsEditing(false);
  };

  // Handle input change to allow negative numbers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);

    // Only update the actual value if it's a valid number
    if (newInputValue === "" || newInputValue === "-") {
      // Allow empty string or just minus sign during editing
      setValue(0);
    } else {
      setValue(toNumber(newInputValue));
    }
  };

  // Handle key press for Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  // Handle clicking on the NumberEntry to open criteria panel
  const handleContainerClick = () => {
    if (!isEditing && editable) {
      setCurrentCriteria(title);
      setShowCriteriaPanel(true);
      setIsNewCriteriaOpen(false);
    }
  };

  // Identify if the value of this item of this critirion (title) is the biggest among selected items
  const isMax = useMemo(() => {
    if (!selectedIDs || selectedIDs.length === 0) return false;
    const selectedItems = items.filter((item) => selectedIDs.includes(item.id));
    const values = selectedItems.map((item) => item[title] as number);
    const max = Math.max(...values);

    // Check if this value is the max AND it's the only max (not tied with others)
    return (
      max === content &&
      values.filter((val) => val === max).length === 1 &&
      selectedIDs.length > 1
    );
  }, [content, selectedIDs, items, title]);

  const isMin = useMemo(() => {
    if (!selectedIDs || selectedIDs.length === 0) return false;
    const selectedItems = items.filter((item) => selectedIDs.includes(item.id));
    const values = selectedItems.map((item) => item[title] as number);
    const min = Math.min(...values);

    // Check if this value is the min AND it's the only min (not tied with others)
    return (
      min === content &&
      values.filter((val) => val === min).length === 1 &&
      selectedIDs.length > 1
    );
  }, [content, selectedIDs, items, title]);

  return (
    <div
      className={
        "flex flex-col justify-between items-center p-2 bg-zinc-100 rounded-md hover:inner-border-2 border-4 w-64 cursor-pointer hover:bg-zinc-200 transition-colors " +
        (isMax ? " border-success" : "") +
        (isMin ? " border-error" : "")
      }
      onClick={handleContainerClick}
    >
      <div className="w-full flex justify-between items-center p-2 h-8 gap-2">
        <span className="text-sm font-medium text-gray-800 truncate grow">
          {title} ({weight && weight.toFixed(2)}):
        </span>
        <div className="flex-none flex items-center gap-1">
          <input
            type="text"
            value={inputValue}
            className="input input-bordered input-sm w-16 text-gray-800"
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onClick={(e) => e.stopPropagation()}
            disabled={!isEditing}
          />
          {editable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                  if (content === null || content === undefined) {
                    setValue(0.0);
                    setInputValue("0");
                  } else {
                    // Ensure we're working with a valid number when entering edit mode
                    const numValue = toNumber(content);
                    setValue(numValue);
                    setInputValue(isNaN(numValue) ? "0" : numValue.toString());
                  }
                }
              }}
              className="text-gray-400 hover:text-gray-800"
            >
              {isEditing ? <TbCheck size={20} /> : <TbPencil size={20} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NumberEntry;
