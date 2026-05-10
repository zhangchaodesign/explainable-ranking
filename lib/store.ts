import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { DataPoint, Criteria } from "@/lib/type";
import { get, set, del, clear } from "idb-keyval";
import { aggregateScore } from "@/lib/svm";
import { DatasetType } from "./constants";

const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    console.log(name, "has been retrieved");
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    console.log(name, "has been saved");
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    console.log(name, "has been deleted");
    await del(name);
  },
};

// Add event listener to clear IndexedDB when the app is closed
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    clear(); // Clear all data in IndexedDB
    console.log("IndexedDB has been cleared");
  });
}

export type OpenAIAPIState = {
  apiKey: string;
  aiEnabled: boolean;
};

export type OpenAIAPIActions = {
  setApiKey: (apiKey: string) => void;
  setAiEnabled: (enabled: boolean) => void;
};

export const useOpenAIAPI = create<OpenAIAPIState & OpenAIAPIActions>()(
  persist(
    (set) => ({
      apiKey: "",
      aiEnabled: false,
      setApiKey: (apiKey: string) => set({ apiKey }),
      setAiEnabled: (aiEnabled: boolean) => set({ aiEnabled }),
    }),
    { name: "openai-api-ier", skipHydration: false },
  ),
);

export type reasonPanelConfigState = {
  conflictingIds: number[];
  currentConflits: Array<{
    pair: [number, number];
    previous: number;
    new: number;
  }>;
  newComparisons: Array<[number, number, number]>;
  showReasonPanel: boolean;
  reasonReference: number | null;
};

export type setReasonPanelConfigActions = {
  setConflictingIds: (conflictingIds: number[]) => void;
  setCurrentConflits: (
    conflicts: Array<{
      pair: [number, number];
      previous: number;
      new: number;
    }>,
  ) => void;
  setNewComparisons: (comparisons: Array<[number, number, number]>) => void;
  setShowReasonPanel: (showSearchPanel: boolean) => void;
  setReasonReference: (id: number | null) => void;
};

export const useReasonPanelConfigStore = create<
  reasonPanelConfigState & setReasonPanelConfigActions
>()(
  persist(
    (set) => ({
      conflictingIds: [],
      showReasonPanel: false,
      reasonReference: null,
      currentConflits: [],
      newComparisons: [],
      setConflictingIds: (conflictingIds) => set({ conflictingIds }),
      setCurrentConflits: (currentConflits) => set({ currentConflits }),
      setNewComparisons: (newComparisons) => set({ newComparisons }),
      setShowReasonPanel: (showReasonPanel) => set({ showReasonPanel }),
      setReasonReference: (reasonReference) => set({ reasonReference }),
    }),
    {
      name: "reason-panel",
      skipHydration: true,
    },
  ),
);

export type searchPanelConfigState = {
  searchNumber: number;
  enableSearch: boolean;
  showSearchPanel: boolean;
  searchReference: number | null;
  result: number[] | null;
};

export type setSearchPanelConfigActions = {
  setSearchNumber: (searchNumber: number) => void;
  setEnableSearch: (ifSearch: boolean) => void;
  setShowSearchPanel: (showSearchPanel: boolean) => void;
  setSearchReference: (id: number | null) => void;
  setResult: (result: number[] | null) => void;
};

export const useSearchPanelConfigStore = create<
  searchPanelConfigState & setSearchPanelConfigActions
>()(
  persist(
    (set) => ({
      searchNumber: 3,
      enableSearch: true,
      showSearchPanel: false,
      searchReference: null,
      result: null,
      setSearchNumber: (searchNumber) => set({ searchNumber }),
      setEnableSearch: (enableSearch) => set({ enableSearch }),
      setShowSearchPanel: (showSearchPanel) => set({ showSearchPanel }),
      setSearchReference: (searchReference) => set({ searchReference }),
      setResult: (result) => set({ result }),
    }),
    {
      name: "search-panel",
      skipHydration: true,
    },
  ),
);

export type InfoPanelConfigState = {
  isInfoOpen: boolean;
  infoId: number | null;
  selectedIDs: number[];
  crossingPairs: { id1: string; id2: string; name1: string; name2: string }[];
  highlightedPair: {
    id1: string;
    id2: string;
  } | null;
};

export type InfoPanelConfigActions = {
  setIsInfoOpen: (isInfoOpen: boolean) => void;
  setInfoId: (id: number | null) => void;
  setSelectedIDs: (IDs: number[]) => void;
  addID: (ID: number) => void;
  removeID: (ID: number) => void;
  setCrossingPairs: (
    pairs: { id1: string; id2: string; name1: string; name2: string }[],
  ) => void;
  setHighlightedPair: (pair: { id1: string; id2: string } | null) => void;
};

export const useInfoPanelConfigStore = create<
  InfoPanelConfigState & InfoPanelConfigActions
>()(
  persist(
    (set) => ({
      isInfoOpen: false,
      infoId: null,
      selectedIDs: [],
      crossingPairs: [],
      highlightedPair: null,
      setSelectedIDs: (IDs: number[]) => set({ selectedIDs: IDs }),
      addID: (ID: number) =>
        set((state) => ({
          selectedIDs: [...state.selectedIDs, ID],
        })),
      removeID: (ID: number) =>
        set((state) => ({
          selectedIDs: state.selectedIDs.filter((id) => id !== ID),
        })),
      // when set to false, infoId is set to null
      setIsInfoOpen: (isInfoOpen: boolean) => {
        set({ isInfoOpen });
        if (!isInfoOpen) set({ infoId: null });
      },
      setInfoId: (id: number | null) => set({ infoId: id }),
      setCrossingPairs: (pairs) => set({ crossingPairs: pairs }),
      setHighlightedPair: (pair) => set({ highlightedPair: pair }),
    }),
    { name: "info", skipHydration: true },
  ),
);

export type ItemDataState = {
  items: DataPoint[];
  gridItems: DataPoint[];
  rankItems: DataPoint[];
};

export type ItemDataActions = {
  setItems: (items: DataPoint[]) => void;
  updateItemById: (id: number, item: DataPoint) => void;
  setGridItems: (items: DataPoint[]) => void;
  setRankItems: (items: DataPoint[]) => void;
  updateRankItems: (items: DataPoint[]) => void;
};

export const useItemDataStore = create<ItemDataState & ItemDataActions>()(
  persist(
    (set) => ({
      items: [],
      gridItems: [],
      rankItems: [],
      setItems: (items: DataPoint[]) => set({ items }),
      updateItemById: (id: number, updatedItem: DataPoint) => {
        set((state) => ({
          items: state.items.map((a) => (a["id"] === id ? updatedItem : a)),
          gridItems: state.gridItems.map((a) =>
            a["id"] === id ? updatedItem : a,
          ),
        }));
      },
      setGridItems: (items: DataPoint[]) => {
        const sortedItems = [...items].sort(
          (a, b) => aggregateScore(b).score - aggregateScore(a).score,
        );
        set({ gridItems: sortedItems });
      },
      setRankItems: (items: DataPoint[]) => {
        // console.log("Update items");
        const updatedItems = items.map((item, index) => ({
          ...item,
          order: index + 1,
        }));
        set({ rankItems: updatedItems });
      },
      updateRankItems: (items: DataPoint[]) => set({ rankItems: items }),
    }),
    {
      name: "item-data",
      storage: createJSONStorage(() => {
        // Handle server-side storage safely
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      skipHydration: true,
    },
  ),
);

export type SortState = {
  sortBy: string;
  sortText: string;
};

export type SortActions = {
  setSortBy: (sortBy: string) => void;
  setSortText: (sortText: string) => void;
};

export const useSortStore = create<SortState & SortActions>()(
  persist(
    (set) => ({
      sortBy: "Aggregated Score",
      sortText: "",
      setSortBy: (sortBy: string) => set({ sortBy }),
      setSortText: (sortText: string) => set({ sortText }),
    }),
    { name: "sort", skipHydration: true },
  ),
);

export type ColorState = {
  colorBy: string;
  colorText: string;
};

export type ColorActions = {
  setColorBy: (colorBy: string) => void;
  setColorText: (colorText: string) => void;
};

export const useColorStore = create<ColorState & ColorActions>()(
  persist(
    (set) => ({
      colorBy: "",
      colorText: "",
      setColorBy: (colorBy: string) => set({ colorBy }),
      setColorText: (colorText: string) => set({ colorText }),
    }),
    { name: "color", skipHydration: true },
  ),
);

export type WeightPanelState = {
  showWeightPanel: boolean;
  ifNormalize: boolean;
  weightSort: { [key: string]: number };
  weightSortState: { [key: string]: boolean };
};

export type WeightPanelActions = {
  setShowWeightPanel: (showWeightPanel: boolean) => void;
  setIfNormalize: (ifNormalize: boolean) => void;
  setWeightSort: (weight: { [key: string]: number }) => void;
  setWeightSortState: (weightSortState: { [key: string]: boolean }) => void;
};

export const useWeightPanelStore = create<
  WeightPanelState & WeightPanelActions
>()(
  persist(
    (set, get) => ({
      showWeightPanel: false,
      ifNormalize: true,
      weightSort: {},
      weightSortState: {},
      setShowWeightPanel: (showWeightPanel) => set({ showWeightPanel }),
      setIfNormalize: (ifNormalize) => set({ ifNormalize }),
      setWeightSort: (weight: { [key: string]: number }) => {
        set({ weightSort: weight });
        // Trigger setGridItems with current items when weightSort changes
        const itemDataStore = useItemDataStore.getState();
        if (itemDataStore.items.length > 0) {
          itemDataStore.setGridItems(itemDataStore.items);
        }
      },
      // Update weightSortState when ever weightSort is updated
      setWeightSortState: (weightSortState: { [key: string]: boolean }) => {
        set({ weightSortState });
        const itemDataStore = useItemDataStore.getState();
        if (itemDataStore.items.length > 0) {
          itemDataStore.setGridItems(itemDataStore.items);
        }
      },
    }),
    { name: "weight-panel-store", skipHydration: true },
  ),
);

export type isLoadingState = {
  isLoading: boolean;
};

export type isLoadingActions = {
  setIsLoading: (isLoading: boolean) => void;
};

export const useIsLoading = create<isLoadingState & isLoadingActions>()(
  persist(
    (set) => ({
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "is-loading",
      skipHydration: true,
    },
  ),
);

export type SVMResultState = {
  svmScores: { [key: number]: number };
  svmWeights: { [key: string]: number };
  svmSolved: boolean;
};

export type SVMResultActions = {
  setSvmScores: (scores: { [key: number]: number }) => void;
  setSvmWeights: (weights: { [key: string]: number }) => void;
  setSvmSolved: (solved: boolean) => void;
};

export const useSVMResultStore = create<SVMResultState & SVMResultActions>()(
  persist(
    (set) => ({
      svmScores: {},
      svmWeights: {},
      svmSolved: false,
      setSvmScores: (scores) => set({ svmScores: scores }),
      setSvmWeights: (weights) => set({ svmWeights: weights }),
      setSvmSolved: (solved) => set({ svmSolved: solved }),
    }),
    {
      name: "svm-result",
      skipHydration: true,
    },
  ),
);

export type SharedConfigState = {
  conflictingIds: {
    lower: number[];
    higher: number[];
  };
  isExplainable: boolean;
  isNewCriteriaOpen: boolean;
  mode: "silent" | "highlight" | "detail";
  selectedItemID: number | null;
  isHoverOnScatterPlot: boolean;
  videoKey: string | null;
  linkKey: string | null;
  fileKey: string | null;
  cardKey: string;
  nameKey: string;
  uidKey: string | null;
  imageKey: string | null;
  numberKeys: string[];
  stringKeys: string[];
  allKeys: string[];
  displayedStringKeys: string[];
  sheetLink: string;
  visualizationType: "slope" | "stacked" | "mirrored";
};

export type SharedConfigActions = {
  setConflictingIds: (conflictingIds: {
    lower: number[];
    higher: number[];
  }) => void;
  setIsExplainable: (isExplainable: boolean) => void;
  setIsNewCriteriaOpen: (isNewCriteriaOpen: boolean) => void;
  setMode: (mode: "silent" | "highlight" | "detail") => void;
  setSelectedItemID: (id: number | null) => void;
  setIsHoverOnScatterPlot: (isHoverOnScatterPlot: boolean) => void;
  setVideoKey: (videoKey: string | null) => void;
  setLinkKey: (linkKey: string) => void;
  setFileKey: (fileKey: string | null) => void;
  setCardKey: (cardKey: string) => void;
  setNameKey: (nameKey: string) => void;
  setUidKey: (uidKey: string | null) => void;
  setImageKey: (imageKey: string | null) => void;
  setNumberKeys: (keys: string[]) => void;
  setStringKeys: (keys: string[]) => void;
  setAllKeys: (keys: string[]) => void;
  setDisplayedStringKeys: (keys: string[]) => void;
  setSheetLink: (link: string) => void;
  setVisualizationType: (
    visualizationType: "slope" | "stacked" | "mirrored",
  ) => void;
};

export const useSharedConfigStore = create<
  SharedConfigState & SharedConfigActions
>()(
  persist(
    (set) => ({
      conflictingIds: {
        lower: [],
        higher: [],
      },
      isExplainable: false,
      isNewCriteriaOpen: false,
      mode: "highlight",
      selectedItemID: null,
      isHoverOnScatterPlot: false,
      cardKey: "id",
      nameKey: "name",
      uidKey: null,
      imageKey: null,
      videoKey: null,
      linkKey: null,
      fileKey: null,
      numberKeys: [],
      stringKeys: [],
      allKeys: [],
      displayedStringKeys: [],
      sheetLink: "",
      visualizationType: "slope",
      setConflictingIds: (conflictingIds) => set({ conflictingIds }),
      setIsExplainable: (isExplainable: boolean) => set({ isExplainable }),
      setIsNewCriteriaOpen: (isNewCriteriaOpen: boolean) =>
        set({ isNewCriteriaOpen }),
      setMode: (mode) => set({ mode }),
      setSelectedItemID: (id: number | null) => set({ selectedItemID: id }),
      setIsHoverOnScatterPlot: (isHoverOnScatterPlot: boolean) =>
        set({ isHoverOnScatterPlot }),
      setCardKey: (cardKey) => set({ cardKey }),
      setNameKey: (nameKey) => set({ nameKey }),
      setUidKey: (uidKey) => set({ uidKey }),
      setImageKey: (imageKey) => set({ imageKey }),
      setVideoKey: (videoKey) => set({ videoKey }),
      setLinkKey: (linkKey) => set({ linkKey }),
      setFileKey: (fileKey) => set({ fileKey }),
      setNumberKeys: (keys: string[]) => set({ numberKeys: keys }),
      setStringKeys: (keys: string[]) => set({ stringKeys: keys }),
      setAllKeys: (keys: string[]) => set({ allKeys: keys }),
      setDisplayedStringKeys: (keys: string[]) =>
        set({ displayedStringKeys: keys }),
      setSheetLink: (link: string) => set({ sheetLink: link }),
      setVisualizationType: (
        visualizationType: "slope" | "stacked" | "mirrored",
      ) => set({ visualizationType }),
    }),
    {
      name: "shared-config",
      skipHydration: true,
    },
  ),
);

export type CurveConfigState = {
  selectedGroupIDs: number[];
  currentCurveRef: string;
  curvedValues: { [key: string]: { [key: number]: number } };
};

export type CurveConfigActions = {
  setSelectedGroupIDs: (IDs: number[]) => void;
  setCurrentCurveRef: (ref: string) => void;
  setCurvedValues: (values: {
    [key: string]: { [key: number]: number };
  }) => void;
};

export const useCurveConfigStore = create<
  CurveConfigState & CurveConfigActions
>()(
  persist(
    (set) => ({
      currentCurveRef: "Average Score",
      curvedValues: {},
      selectedGroupIDs: [],
      setSelectedGroupIDs: (IDs: number[]) => set({ selectedGroupIDs: IDs }),
      setCurrentCurveRef: (ref: string) => set({ currentCurveRef: ref }),
      setCurvedValues: (values: { [key: string]: { [key: number]: number } }) =>
        set({ curvedValues: values }),
    }),
    {
      name: "curve-config",
      skipHydration: true,
    },
  ),
);

type ComparisonKey = string;

export type PairwiseComparisonState = {
  comparisons: Record<ComparisonKey, number>;
};

export type PairwiseComparisonActions = {
  addComparison: (a: number, b: number, winner: number) => void;
  getComparison: (a: number, b: number) => number | undefined;
  hasConflict: (a: number, b: number, winner: number) => boolean;
};

const createComparisonKey = (a: number, b: number): ComparisonKey => {
  const [id1, id2] = [a, b].sort((x, y) => x - y);
  return `${id1}-${id2}`;
};

export const usePairwiseComparisonStore = create<
  PairwiseComparisonState & PairwiseComparisonActions
>()(
  persist(
    (set, get) => ({
      comparisons: {},
      addComparison: (a, b, winner) => {
        const key = createComparisonKey(a, b);
        set((state) => ({
          comparisons: { ...state.comparisons, [key]: winner },
        }));
      },
      getComparison: (a, b) => {
        const key = createComparisonKey(a, b);
        return get().comparisons[key];
      },
      hasConflict: (a, b, winner) => {
        const key = createComparisonKey(a, b);
        const existing = get().comparisons[key];
        return existing !== undefined && existing !== winner;
      },
    }),
    {
      name: "pairwise-comparison",
      skipHydration: true,
    },
  ),
);

export type CriteriaPanelState = {
  currentCriteria: string;
  showCriteriaPanel: boolean;
};

export type CriteriaPanelActions = {
  setCurrentCriteria: (currentCriteria: string) => void;
  setShowCriteriaPanel: (showCriteriaPanel: boolean) => void;
};

export const useCriteriaPanelStore = create<
  CriteriaPanelState & CriteriaPanelActions
>()(
  persist(
    (set) => ({
      showCriteriaPanel: false,
      currentCriteria: "",
      setCurrentCriteria: (currentCriteria) => set({ currentCriteria }),
      setShowCriteriaPanel: (showCriteriaPanel) => set({ showCriteriaPanel }),
    }),
    {
      name: "criteria-panel",
      skipHydration: true,
    },
  ),
);

export type PanelLayerState = {
  panelOpenOrder: string[];
};

export type PanelLayerActions = {
  bringPanelToFront: (panelId: string) => void;
  removePanelFromOrder: (panelId: string) => void;
  getPanelZIndex: (panelId: string) => number;
};

export const usePanelLayerStore = create<PanelLayerState & PanelLayerActions>()(
  (set, get) => ({
    panelOpenOrder: [],
    bringPanelToFront: (panelId: string) => {
      const state = get();
      const newOrder = [
        ...state.panelOpenOrder.filter((id) => id !== panelId),
        panelId,
      ];
      set({ panelOpenOrder: newOrder });
    },
    removePanelFromOrder: (panelId: string) => {
      const state = get();
      const newOrder = state.panelOpenOrder.filter((id) => id !== panelId);
      set({ panelOpenOrder: newOrder });
    },
    getPanelZIndex: (panelId: string) => {
      const state = get();
      const index = state.panelOpenOrder.indexOf(panelId);
      if (index === -1) return 1000; // Default z-index for panels not in order
      return 1000 + index; // Base z-index + order position
    },
  }),
);

export type CriteriaDataState = {
  criteriaData: Criteria[];
};

export type CriteriaDataActions = {
  setCriteriaData: (criteriaData: Criteria[]) => void;
  updateGroupByCriteriaAndKey: (
    criteriaName: string,
    type: "positive" | "negative" | "neutral",
    key?: number,
  ) => (group: DataPoint[]) => void;
};

export const useCriteriaDataStore = create<
  CriteriaDataState & CriteriaDataActions
>()(
  persist(
    (set) => ({
      criteriaData: [],
      setCriteriaData: (criteriaData) => set({ criteriaData }),
      updateGroupByCriteriaAndKey: (criteriaName, type, key) => (group) =>
        set((state) => {
          const criteria = state.criteriaData.find(
            (criteria) => criteria.name === criteriaName,
          );
          if (!criteria) return state;

          if (type === "neutral") {
            const newCriteria = {
              ...criteria,
              groups: { ...criteria.groups, neutral: group },
            };
            const newCriteriaData = state.criteriaData.map((criteria) =>
              criteria.name === criteriaName ? newCriteria : criteria,
            );
            return { criteriaData: newCriteriaData };
          } else if (key !== undefined) {
            const typeGroups = criteria.groups[type];
            if (!typeGroups) return state;
            const newTypeGroups = { ...typeGroups, [key]: group };
            const newGroups = { ...criteria.groups, [type]: newTypeGroups };
            const newCriteria = { ...criteria, groups: newGroups };
            const newCriteriaData = state.criteriaData.map((criteria) =>
              criteria.name === criteriaName ? newCriteria : criteria,
            );
            return { criteriaData: newCriteriaData };
          }

          return state;
        }),
    }),
    {
      name: "criteria-data",
      storage: createJSONStorage(() => storage),
    },
  ),
);

// Simple in-memory cache object
// key: the original text, value: its corresponding embedding vector
type embeddingCacheState = {
  embeddingCache: Record<string | number, number[]>;
};

type embeddingCacheActions = {
  setEmbeddingCache: (
    embeddingCache: Record<string | number, number[]>,
  ) => void;
  addEmbeddingToCache: (source: string | number, embedding: number[]) => void;
};

export const useEmbeddingCache = create<
  embeddingCacheState & embeddingCacheActions
>()(
  persist(
    (set) => ({
      embeddingCache: {},
      setEmbeddingCache: (embeddingCache) => set({ embeddingCache }),
      addEmbeddingToCache: (source, embedding) =>
        set((state) => ({
          embeddingCache: { ...state.embeddingCache, [source]: embedding },
        })),
    }),
    {
      name: "item-embedding-cache",
      skipHydration: true,
    },
  ),
);

export type studyManagerState = {
  user: string;
  dataset: DatasetType;
};

export type studyManagerActions = {
  setUser: (user: string) => void;
  setDataset: (dataset: DatasetType) => void;
};

export const useStudyManagerStore = create<
  studyManagerState & studyManagerActions
>()(
  persist(
    (set) => ({
      user: "Anonymous",
      dataset: "demo",
      setUser: (user: string) => set({ user }),
      setDataset: (
        dataset:
          | "cat"
          | "city"
          | "vacation"
          | "video"
          | "minutes"
          | "demo"
          | "grading",
      ) => set({ dataset }),
    }),
    { name: "study-manager", skipHydration: true },
  ),
);
