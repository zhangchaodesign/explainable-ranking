import React, { useState, useMemo } from "react";
import {
  useItemDataStore,
  useSortStore,
  useColorStore,
  useSharedConfigStore,
  useWeightPanelStore,
  useCriteriaDataStore,
} from "@/lib/store";
import { noto_serif } from "@/app/fonts";
import { DataPoint, Criteria } from "@/lib/type";
import { eventTracker } from "@/lib/utils";
import ImageFieldDropdown from "./ImageFieldDropdown";
import NumberFields from "./NumberFields";
import StringFields from "./StringFields";
import { normalizeValue } from "@/lib/utils";

interface DataSelectorProps {
  uploadedData: DataPoint[];
  dataTypes?: { [key: string]: string };
  defaultWeights?: { [key: string]: number };
  setIsDataSelectorOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DataSelector = (props: DataSelectorProps) => {
  const { setWeightSort, setWeightSortState } = useWeightPanelStore();
  const {
    imageKey,
    videoKey,
    fileKey,
    setImageKey,
    setNumberKeys,
    setStringKeys,
    setAllKeys,
    setDisplayedStringKeys,
  } = useSharedConfigStore();
  const { setItems } = useItemDataStore();
  const { setSortBy } = useSortStore();
  const { setColorBy } = useColorStore();

  const thisAllKeys = useMemo(() => {
    const keys = new Set<string>();
    props.uploadedData.forEach((item) => {
      Object.keys(item).forEach((key) => keys.add(key));
    });
    return Array.from(keys);
  }, [props.uploadedData]);

  const thisNumberKeys = useMemo(() => {
    const keys = new Set<string>();
    props.uploadedData.forEach((item) => {
      Object.entries(item).forEach(([key, value]) => {
        if (typeof value === "number") keys.add(key);
      });
    });
    return Array.from(keys);
  }, [props.uploadedData]);

  const thisStringKeys = useMemo(() => {
    const keys = new Set<string>();
    props.uploadedData.forEach((item) => {
      Object.entries(item).forEach(([key, value]) => {
        if (typeof value === "string") keys.add(key);
      });
    });
    return Array.from(keys);
  }, [props.uploadedData]);

  const shouldFieldBeEnabled = (key: string) => {
    console.log(`Checking if field "${key}" should be enabled by default.`);
    if (!props.dataTypes || !props.dataTypes[key]) return true;
    const type = props.dataTypes[key].toLowerCase();
    console.log(
      `Checking field "${key}": type="${type}", enabled=${!type.endsWith("!")}`,
    );
    return !type.endsWith("!");
  };

  const [selectedImageField, setSelectedImageField] = useState<string | null>(
    imageKey,
  );
  const [selectedNumberFields, setSelectedNumberFields] = useState<string[]>(
    thisNumberKeys.filter(shouldFieldBeEnabled),
  );
  const [selectedStringFields, setSelectedStringFields] = useState<string[]>(
    thisStringKeys.filter(shouldFieldBeEnabled),
  );

  const [fieldEditableStates, setFieldEditableStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [fieldNormalizeStates, setFieldNormalizeStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [fieldNormalizeRanges, setFieldNormalizeRanges] = useState<{
    [key: string]: [number, number];
  }>({});

  const handleNumberClick = (key: string) => {
    if (selectedNumberFields.includes(key)) {
      setSelectedNumberFields((prev) => prev.filter((k) => k !== key));
      setFieldEditableStates((prev) => {
        const { [key]: removed, ...rest } = prev;
        return rest;
      });
      setFieldNormalizeStates((prev) => {
        const { [key]: removed, ...rest } = prev;
        return rest;
      });
      setFieldNormalizeRanges((prev) => {
        const { [key]: removed, ...rest } = prev;
        return rest;
      });
    } else {
      setSelectedNumberFields((prev) => [...prev, key]);
      setFieldEditableStates((prev) => ({ ...prev, [key]: true }));
      setFieldNormalizeStates((prev) => ({ ...prev, [key]: false }));
      setFieldNormalizeRanges((prev) => ({ ...prev, [key]: [0, 1] }));
    }
  };

  const handleStringClick = (key: string) => {
    setSelectedStringFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleConfirmClick = async () => {
    const selectedFields = [...selectedNumberFields, ...selectedStringFields];

    setAllKeys(selectedFields);
    setImageKey(selectedImageField);
    setNumberKeys(selectedNumberFields);
    setStringKeys(selectedStringFields);
    setDisplayedStringKeys(
      selectedStringFields.filter(
        (key) => key !== imageKey && key !== videoKey && key !== fileKey,
      ),
    );

    let _customScoreWeight: { [key: string]: number } = {};
    selectedNumberFields.map((key) => {
      _customScoreWeight[key] = props.defaultWeights?.[key] ?? 1;
    });
    setWeightSort(_customScoreWeight);
    setWeightSortState(
      Object.keys(_customScoreWeight).reduce(
        (acc, key) => {
          acc[key] = true;
          return acc;
        },
        {} as { [key: string]: boolean },
      ),
    );

    const processData = (data: DataPoint[]) => {
      return data.map((item, index) => {
        const newItem: DataPoint = { id: index, order: index + 1 };

        selectedFields.forEach((field) => {
          const value = item[field];
          if (value !== undefined && value !== null) {
            if (selectedNumberFields.includes(field)) {
              const num =
                typeof value === "number" ? value : parseFloat(value as string);

              if (isNaN(num)) {
                newItem[field] = 0;
              } else {
                if (fieldNormalizeStates[field]) {
                  const fieldValues = props.uploadedData
                    .map((item) => {
                      const val = item[field];
                      return typeof val === "number"
                        ? val
                        : parseFloat(val as string);
                    })
                    .filter((val) => !isNaN(val));

                  newItem[field] = normalizeValue(
                    num,
                    fieldValues,
                    fieldNormalizeRanges[field] ?? [0, 1],
                  );
                } else {
                  newItem[field] = num;
                }
              }
            } else {
              newItem[field] = value;
            }
          }
        });

        if (selectedImageField && item[selectedImageField]) {
          newItem[selectedImageField] = item[selectedImageField] as string;
        }

        return newItem;
      });
    };

    const baseData = processData(props.uploadedData);

    setSortBy("Aggregated Score");
    setColorBy("Aggregated Score");

    baseData.forEach((item, index) => {
      item.order = index + 1;
    });

    setItems(baseData);

    console.log("Current items:", useItemDataStore.getState().items);
    console.log("Current gridItems:", useItemDataStore.getState().gridItems);

    const editableFields = selectedNumberFields.filter(
      (field) => fieldEditableStates[field] ?? true,
    );
    if (editableFields.length > 0) {
      const criteriaData: Criteria[] = editableFields.map((field) => {
        const groups: {
          positive: { [key: number]: DataPoint[] };
          neutral: DataPoint[];
          negative: { [key: number]: DataPoint[] };
        } = {
          positive: {},
          neutral: [],
          negative: {},
        };

        baseData.forEach((item) => {
          const value = item[field];
          if (value !== undefined && value !== null) {
            if (typeof value === "number") {
              if (value > 0) {
                if (!groups.positive[value]) {
                  groups.positive[value] = [];
                }
                groups.positive[value].push(item);
              } else if (value < 0) {
                const absValue = Math.abs(value);
                if (!groups.negative[absValue]) {
                  groups.negative[absValue] = [];
                }
                groups.negative[absValue].push(item);
              } else {
                groups.neutral.push(item);
              }
            }
          }
        });

        return {
          name: field,
          explanation: "",
          groups: groups,
          similarity: [],
          relevance: "",
        };
      });
      const setCriteriaData = useCriteriaDataStore.getState().setCriteriaData;
      setCriteriaData(criteriaData);
    }

    props.setIsDataSelectorOpen(false);

    eventTracker({
      action: "data selected",
      data: {
        image: selectedImageField,
        number: selectedNumberFields,
        string: selectedStringFields,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="flex flex-col gap-6 p-8 bg-white rounded-lg border-2 w-[800px] select-none">
        <p className="font-semibold text-lg">
          📘 Please select data of your interest
        </p>

        <ImageFieldDropdown
          allKeys={thisAllKeys}
          selectedImageField={selectedImageField}
          setSelectedImageField={setSelectedImageField}
        />

        {thisNumberKeys.length > 0 && (
          <NumberFields
            numberKeys={thisNumberKeys}
            selectedNumberFields={selectedNumberFields}
            fieldEditableStates={fieldEditableStates}
            fieldNormalizeStates={fieldNormalizeStates}
            fieldNormalizeRanges={fieldNormalizeRanges}
            onNumberClick={handleNumberClick}
            setFieldEditableStates={setFieldEditableStates}
            setFieldNormalizeStates={setFieldNormalizeStates}
            setFieldNormalizeRanges={setFieldNormalizeRanges}
          />
        )}

        <StringFields
          stringKeys={thisStringKeys}
          selectedStringFields={selectedStringFields}
          onStringClick={handleStringClick}
        />

        <div className="flex flex-col gap-2">
          <button
            className="btn btn-sm btn-neutral shadow-none"
            onClick={handleConfirmClick}
          >
            Confirm
          </button>
          <button
            className="btn btn-sm shadow-none"
            onClick={() => props.setIsDataSelectorOpen(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataSelector;
