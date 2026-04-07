import React, { useState, useEffect } from "react";
import { TbPencil, TbCheck } from "react-icons/tb";

interface GeneralEntryProps {
  title: string;
  content: string | number | null;
  editable?: boolean;
  onChange?: (value: string | number) => void;
}

const GeneralEntry = ({
  title,
  content,
  editable = false,
  onChange,
}: GeneralEntryProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(content || "N/A");

  useEffect(() => {
    setValue(content || "N/A");
  }, [content]);

  const handleSave = () => {
    if (onChange) onChange(value);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-row justify-between items-center p-2 bg-zinc-100 rounded-md hover:inner-border-2">
      <span className="text-sm font-medium text-gray-800 w-32">{title}</span>
      <div className="flex items-center gap-2 input input-bordered bg-white relative">
        <input
          type="text"
          value={
            typeof value === "number" ? value.toFixed(2) : (value as string)
          }
          className="p-2 text-sm font-medium rounded-md w-full text-gray-800"
          onChange={(e) => setValue(e.target.value)}
          disabled={!isEditing}
        />
        {editable && (
          <button
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            className="text-gray-400 hover:text-gray-800 absolute right-2"
          >
            {isEditing ? <TbCheck size={20} /> : <TbPencil size={20} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default GeneralEntry;
