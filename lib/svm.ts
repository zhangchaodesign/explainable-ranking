import { DataPoint } from "@/lib/type";
import {
  useItemDataStore,
  useWeightPanelStore,
  useIsLoading,
  useSVMResultStore,
} from "@/lib/store";
import { getNormalizedValueForCriterion } from "@/lib/utils";

// Check if data is already ordered by weighted scores (descending)
export const isDataOrdered = (
  data: any[],
  weights: { [key: string]: number },
): boolean => {
  if (data.length <= 1) return true;

  for (let i = 0; i < data.length - 1; i++) {
    let scoreA = 0;
    let scoreB = 0;
    Object.keys(weights).forEach((key) => {
      scoreA += weights[key] * (data[i][key] || 0);
      scoreB += weights[key] * (data[i + 1][key] || 0);
    });

    const roundedScoreA = parseFloat(scoreA.toFixed(2));
    const roundedScoreB = parseFloat(scoreB.toFixed(2));

    if (roundedScoreA < roundedScoreB) {
      return false;
    }
  }

  return true;
};

// Refactored aggregateScore function
export const aggregateScore = (
  item: DataPoint,
  weights?: { [key: string]: number },
) => {
  // console.log("item:", item["title"]);
  // console.log("item:", item);
  let score = 0;

  let thisWeight = weights;
  if (!thisWeight) {
    const weightSort = useWeightPanelStore.getState().weightSort;
    const weightSortState = useWeightPanelStore.getState().weightSortState;

    // create a new weight based on whether the weight in weightSortState is true
    thisWeight = Object.fromEntries(
      Object.entries(weightSort).filter(([key]) => weightSortState[key]),
    );
  }

  const rawScores: { [key: string]: number } = {};

  // Use normalized values if criterion has normalization enabled, otherwise use raw values
  Object.keys(thisWeight).forEach((key) => {
    const valueToUse = getNormalizedValueForCriterion(item, key);
    rawScores[key] = valueToUse;
    score += thisWeight[key] * valueToUse;
  });

  // console.log({ score, rawScores });

  return { score, weightedScores: rawScores };
};

export const rankingSVMWithGroups = async (
  groups: number[][],
  removedCriteria?: string,
) => {
  const setIsLoading = useIsLoading.getState().setIsLoading;
  setIsLoading(true);

  let weightSort = useWeightPanelStore.getState().weightSort;
  let weightSortState = useWeightPanelStore.getState().weightSortState;
  // Create a new weight based on whether the weight in weightSortState is true
  let filteredWeight = Object.fromEntries(
    Object.entries(weightSort).filter(([key]) => weightSortState[key]),
  );

  const items = useItemDataStore.getState().gridItems;
  const selectedIds = groups.flat();
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));
  let data = selectedItems.map((item) => {
    const newItem: any = { id: item.id };
    Object.keys(filteredWeight).forEach((criteria) => {
      // Use normalized value if normalization is enabled for this criterion
      newItem[criteria] = getNormalizedValueForCriterion(item, criteria);
    });
    return newItem;
  });

  if (removedCriteria) {
    data = data.map((item) => {
      delete item[removedCriteria];
      return item;
    });
    filteredWeight = Object.fromEntries(
      Object.entries(filteredWeight).filter(([key]) => key !== removedCriteria),
    );
  }

  console.log("input data", data);
  console.log("ranking_groups", groups);

  const response = await fetch("/api/svm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: data,
      ranking_groups: groups,
    }),
  });

  if (!response.ok) {
    console.error(`HTTP error! status: ${response.status}`);
    // Clear loading state
    setIsLoading(false);

    // Return a default/fallback result
    return {
      scores: {},
      weights: weightSort, // Return current weights as fallback
      error: true,
    };
  }

  const results = await response.json();
  console.log("Ranking SVM results:", results);

  const setSvmScores = useSVMResultStore.getState().setSvmScores;
  const setSvmWeights = useSVMResultStore.getState().setSvmWeights;

  setSvmScores(results.scores);
  setSvmWeights(results.weights);

  setIsLoading(false);

  // Update useWeightPanelStore.getState().weightSort with the new weights by name
  const updatedWeightSort = {
    ...weightSort,
    ...results.weights,
  };
  if (removedCriteria) {
    delete updatedWeightSort[removedCriteria];
  }

  // console.log("Updated weightSort:", updatedWeightSort);

  return {
    scores: results.scores,
    weights: updatedWeightSort,
    error: false,
  };
};

export const rankingSVM = async (removedCriteria?: string) => {
  const setIsLoading = useIsLoading.getState().setIsLoading;
  setIsLoading(true);

  let weightSort = useWeightPanelStore.getState().weightSort;
  let weightSortState = useWeightPanelStore.getState().weightSortState;
  // Create a new weight based on whether the weight in weightSortState is true
  let filteredWeight = Object.fromEntries(
    Object.entries(weightSort).filter(([key]) => weightSortState[key]),
  );

  const rankItems = useItemDataStore.getState().rankItems;
  let data = rankItems.map((item) => {
    const newItem: any = { id: item.id };
    Object.keys(filteredWeight).forEach((criteria) => {
      // Use normalized value if normalization is enabled for this criterion
      newItem[criteria] = getNormalizedValueForCriterion(item, criteria);
    });
    return newItem;
  });

  if (removedCriteria) {
    data = data.map((item) => {
      delete item[removedCriteria];
      return item;
    });
    filteredWeight = Object.fromEntries(
      Object.entries(filteredWeight).filter(([key]) => key !== removedCriteria),
    );
  }

  console.log("input data", data);

  // Check if data is already ordered by aggregateScore
  const isAlreadyOrdered = isDataOrdered(data, filteredWeight);

  if (isAlreadyOrdered) {
    console.log("Data is already ordered by aggregateScore");
    setIsLoading(false);
    return {
      scores: {},
      weights: weightSort,
      error: false,
    };
  }

  const response = await fetch("/api/svm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: data,
      initial_weights: weightSort,
    }),
  });

  if (!response.ok) {
    console.error(`HTTP error! status: ${response.status}`);
    // Clear loading state
    setIsLoading(false);

    // Return a default/fallback result
    return {
      scores: {},
      weights: weightSort, // Return current weights as fallback
      error: true,
    };
  }

  const results = await response.json();
  console.log("Ranking SVM results:", results);

  const setSvmScores = useSVMResultStore.getState().setSvmScores;
  const setSvmWeights = useSVMResultStore.getState().setSvmWeights;

  setSvmScores(results.scores);
  setSvmWeights(results.weights);

  setIsLoading(false);

  // Update useWeightPanelStore.getState().weightSort with the new weights by name
  const updatedWeightSort = {
    ...weightSort,
    ...results.weights,
  };
  if (removedCriteria) {
    delete updatedWeightSort[removedCriteria];
  }

  // console.log("Updated weightSort:", updatedWeightSort);

  return {
    scores: results.scores,
    weights: updatedWeightSort,
    error: false,
  };
};
