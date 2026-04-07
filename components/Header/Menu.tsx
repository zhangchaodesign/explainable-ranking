import React from "react";
import { cn, eventTracker } from "@/lib/utils";
import {
  useItemDataStore,
  useColorStore,
  useSharedConfigStore,
  useCriteriaPanelStore,
  useCriteriaDataStore,
} from "@/lib/store";
import { DataPoint } from "@/lib/type";
import Dropdown from "@/components/Header/Dropdown";
import NewCriteriaPanel from "@/components/CriteriaPanel/NewCriteriaPanel";

type MenuProps = {
  classes?: string;
  onDataLoad: (data: DataPoint[], isDefaultData: boolean) => void;
};

const Menu = ({ classes, onDataLoad }: MenuProps) => {
  const { isNewCriteriaOpen, setIsNewCriteriaOpen } =
    useSharedConfigStore();
  const { criteriaData } = useCriteriaDataStore();
  const { items } = useItemDataStore();
  const { setCurrentCriteria, setShowCriteriaPanel } = useCriteriaPanelStore();
  // Coloring
  const [colorBy, colorText, setColorBy, setColorText] = useColorStore(
    (state) => [
      state.colorBy,
      state.colorText,
      state.setColorBy,
      state.setColorText,
    ],
  );

  const handleBgColorChange = (value: string) => {
    setColorBy(value);
  };

  return (
    <div className={cn(classes, "flex flex-row select-none items-center")}>
      <div className="flex flex-row gap-2 items-center">
        <Dropdown
          title="Color by"
          sortBy={colorBy}
          setSortBy={setColorBy}
          sortText={colorText}
          setSortText={setColorText}
          handleSortChange={handleBgColorChange}
        />
      </div>

      <div className="divider divider-horizontal my-2"></div>

      <div className="flex flex-row gap-2 items-center">
        <button
          onClick={() => {
            setShowCriteriaPanel(true);
            setCurrentCriteria(
              useCriteriaDataStore.getState().criteriaData[0].name,
            );
            eventTracker({
              action: "open criteria panel",
              data: {},
            });
          }}
          className="btn btn-sm btn-secondary shadow-none"
          disabled={items.length === 0 || criteriaData.length === 0}
        >
          Criteria Panel
        </button>
      </div>

      {isNewCriteriaOpen && (
        <NewCriteriaPanel onClose={() => setIsNewCriteriaOpen(false)} />
      )}
    </div>
  );
};

export default Menu;
