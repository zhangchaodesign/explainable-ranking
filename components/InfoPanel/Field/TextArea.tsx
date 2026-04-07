import React, { useState, useEffect } from "react";
import { TbPencil, TbCheck } from "react-icons/tb";
import { cn } from "@/lib/utils";

export interface TextAreaProps {
  classes?: string;
  content: string | null | number;
  editable?: boolean;
  onChange?: (value: string | number) => void;
}

// URL detection regex - matches http://, https://, and www. URLs
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;

const isURL = (text: string): boolean => {
  return URL_REGEX.test(text);
};

const renderTextWithLinks = (text: string | number) => {
  const textStr = String(text);

  // Check if the entire content is a URL
  const trimmed = textStr.trim();
  if (isURL(trimmed)) {
    const url = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline break-all"
      >
        {trimmed}
      </a>
    );
  }

  // Otherwise, find and replace URLs within the text
  const parts = [];
  let lastIndex = 0;
  let match;

  // Reset regex lastIndex
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(textStr)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(textStr.substring(lastIndex, match.index));
    }

    // Add the URL as a link
    const urlText = match[0];
    const url = urlText.startsWith('http') ? urlText : `https://${urlText}`;
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline break-all"
      >
        {urlText}
      </a>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last URL
  if (lastIndex < textStr.length) {
    parts.push(textStr.substring(lastIndex));
  }

  return parts.length > 0 ? parts : textStr;
};

const TextArea = ({
  classes,
  content,
  editable = false,
  onChange,
}: TextAreaProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(content || "");

  useEffect(() => {
    setValue(content || "");
  }, [content]);

  const handleSave = () => {
    if (onChange) onChange(value);
    setIsEditing(false);
  };

  return (
    <div className={cn(classes, "relative")}>
      {isEditing ? (
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full p-2 pr-8 text-sm font-medium bg-slate-50 rounded-md border focus:outline-none max-h-48 overflow-y-auto text-neutral leading-relaxed"
            rows={4}
          />
          <button
            onClick={handleSave}
            className="absolute right-2 bottom-2 text-neutral"
          >
            <TbCheck size={18} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <p className="w-full text-sm font-medium text-neutral max-h-32  leading-relaxed overflow-y-auto border-r pr-2">
            {value ? renderTextWithLinks(value) : "N/A"}
          </p>
          {editable && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-ghost p-1 h-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 shadow-none border-none"
            >
              <TbPencil size={18} className="" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TextArea;
