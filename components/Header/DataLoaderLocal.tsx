import React, { useEffect, useRef, useState } from "react";
import {
  useItemDataStore,
  // useOpenAIAPI,
  useSharedConfigStore,
} from "@/lib/store";
import { DataPoint } from "@/lib/type";

interface DataLoaderProps {
  onDataLoad: (data: DataPoint[], isDefaultData: boolean) => void;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
}

const DataLoader = ({ onDataLoad, onClose }: DataLoaderProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [filename, setFilename] = useState<string>("");
  // const { apiKey, setApiKey } = useOpenAIAPI();
  const { items } = useItemDataStore();
  const { setImageKey, setNumberKeys, setStringKeys, setAllKeys } =
    useSharedConfigStore();

  // File input and output
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    // const dataWithoutIds = items.map(({ id, ...rest }) => rest);
    const dataWithoutIds = items;
    // let nentries = items.length;
    // for (let a = 0; a < nentries; a++) {
    //   console.log(`${a}: ${items[a].id}`);
    //   items[a]["SortOrder"] = nentries - a;
    // }
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(dataWithoutIds, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "assignment_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          onDataLoad(data, false);
        } catch (error) {
          console.error("Error parsing JSON file", error);
        }
      };
      reader.readAsText(file);
    }
  };

  const loadDefaultData = async (filename: string) => {
    try {
      const response = await fetch(filename + ".json");
      if (response.ok) {
        const data = await response.json();
        onDataLoad(data, true);
      } else {
        console.error("Failed to load default data");
      }
    } catch (error) {
      console.error("Error fetching default data", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        onClose(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-2" ref={contentRef}>
      <div className="join">
        {/* <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          className="btn join-item"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload Data
        </button> */}
        <div className="dropdown join-item">
          <div
            tabIndex={0}
            role="button"
            className="btn bg-white join-item rounded-r-none w-28 shadow-none"
          >
            {filename || "Select Data"}
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
          >
            <li
              onClick={() => {
                setFilename("Cat");
              }}
            >
              <a>Cat</a>
            </li>
            <li
              onClick={() => {
                setFilename("Book");
              }}
            >
              <a>Book</a>
            </li>
            <li
              onClick={() => {
                setFilename("Movie");
              }}
            >
              <a>Movie</a>
            </li>
          </ul>
        </div>
        <button
          className="btn btnn join-item shadow-none"
          onClick={() => {
            if (filename) {
              loadDefaultData(filename);
              setImageKey("");
              setNumberKeys([]);
              setStringKeys([]);
              setAllKeys([]);
            } else alert("Please select a data file");
          }}
        >
          Load Data
        </button>
        <button onClick={handleExport} className="btn join-item shadow-none">
          Export Data
        </button>
      </div>
      {/* <label className="input input-bordered flex items-center gap-2">
        <input
          type="text"
          value={apiKey}
          placeholder={"Your OpenAI apiKey Key..."}
          onChange={(event) => {
            setApiKey(event.target.value);
          }}
          className="grow w-16 text-sm"
        />
      </label> */}
    </div>
  );
};

export default DataLoader;
