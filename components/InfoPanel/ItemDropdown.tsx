import React from "react";
import {
  useItemDataStore,
  useInfoPanelConfigStore,
  useSharedConfigStore,
} from "@/lib/store";

const ItemDropdown = () => {
  const { nameKey } = useSharedConfigStore();
  const { selectedIDs, addID, removeID } = useInfoPanelConfigStore();
  const { gridItems } = useItemDataStore();
  const ids = gridItems.map((item) => item["id"]);

  return (
    <div className="dropdown">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-sm bg-white shadow-none hover:bg-gray-100"
      >
        Add Items to Compare
      </div>
      <div
        tabIndex={0}
        className="dropdown-content z-[1] bg-base-100 rounded-box shadow max-h-48 overflow-y-auto w-full"
      >
        <ul className="menu p-2 w-full">
          {ids.map((id) => (
            <li key={id} className="">
              {id.toString() && (
                <div className="form-control">
                  <label className="label cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox mr-2"
                      checked={selectedIDs.includes(id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          addID(id);
                        } else {
                          removeID(id);
                        }
                      }}
                    />
                    <span className="label-text">
                      {gridItems.find((item) => item.id === id)?.[nameKey]}
                    </span>
                  </label>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ItemDropdown;
