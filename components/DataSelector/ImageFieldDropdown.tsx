import React from "react";

interface ImageFieldDropdownProps {
  allKeys: string[];
  selectedImageField: string | null;
  setSelectedImageField: (field: string | null) => void;
}

const ImageFieldDropdown = ({
  allKeys,
  selectedImageField,
  setSelectedImageField,
}: ImageFieldDropdownProps) => {
  return (
    <div className="flex flex-col gap-3 w-64">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <p>Image</p>
        </div>
        <div className="dropdown">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-sm btn-neutral bg-white shadow-none hover:bg-gray-100 border border-gray-100 w-72 justify-start overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <span className="text-gray-400 font-medium">Image Link: </span>
            <span className="text-gray-800">
              {selectedImageField || "Select field  with image links"}
            </span>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] w-full p-2 shadow gap-2 mt-1 max-h-48 flex-nowrap overflow-y-auto overflow-x-hidden"
          >
            {allKeys.map((key) => (
              <li
                key={key}
                className="w-full"
                onClick={() =>
                  setSelectedImageField(key === selectedImageField ? null : key)
                }
              >
                <a
                  className={`block w-full ${selectedImageField === key ? "active" : ""} !overflow-visible`}
                >
                  <div className="flex justify-between items-center w-full min-w-0">
                    <span className="truncate">{key}</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImageFieldDropdown;
