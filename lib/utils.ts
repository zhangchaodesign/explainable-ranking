import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DataPoint } from "@/lib/type";
import {
  useItemDataStore,
  useEmbeddingCache,
  useStudyManagerStore,
  useOpenAIAPI,
} from "@/lib/store";
import * as d3 from "d3";
import { removeStopwords } from "stopword";
import { push, ref } from "firebase/database";
import { database } from "@/app/firebaseConfig";
import { useCriteriaDataStore } from "@/lib/store";

export function eventTracker(event: {
  action: string;
  data: object | string | null;
}) {
  if (!database) {
    return;
  }

  try {
    const dataset = useStudyManagerStore.getState().dataset;
    const user = useStudyManagerStore.getState().user;
    const refId = ref(database, "events/" + user + "/" + dataset);
    // Create a cleaned version of the event data
    const cleanedData = sanitizeData(event.data);
    const newEvent = {
      action: event.action,
      data: cleanedData,
      timestamp: Date.now(),
    };
    push(refId, newEvent);
  } catch (error) {
    console.log("event:", event);
    console.error("Error tracking event:", error);
  }
}

function sanitizeData(data: any): any {
  if (data === undefined) {
    return null;
  }

  if (data === null || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  const sanitizedObject: Record<string, any> = {};

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      // Sanitize the key by replacing invalid Firebase characters
      const sanitizedKey = sanitizeFirebaseKey(key);
      const value = data[key];
      sanitizedObject[sanitizedKey] = sanitizeData(value);
    }
  }

  return sanitizedObject;
}

/**
 * Sanitizes a key to be valid for Firebase
 * Firebase doesn't allow '.', '$', '#', '[', ']', '/' in keys
 */
function sanitizeFirebaseKey(key: string): string {
  // Replace each invalid character with an underscore followed by its character code
  return key
    .replace(/\./g, "_dot_")
    .replace(/\$/g, "_dollar_")
    .replace(/\#/g, "_hash_")
    .replace(/\[/g, "_lbracket_")
    .replace(/\]/g, "_rbracket_")
    .replace(/\//g, "_slash_");
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toNumber(value: string | number | null): number {
  if (value === null) {
    return 0;
  }

  return typeof value === "string" ? parseFloat(value) : value;
}

export function getAverageScore(...scores: (number | string | null)[]) {
  // Filter out null or undefined values
  const validScores = scores
    .filter((score) => score !== null && score !== undefined)
    .map((score) => (typeof score === "string" ? Number(score) : score))
    .filter((score) => !isNaN(score as number)) as number[];

  // If no valid scores, return null
  if (validScores.length === 0) {
    return null;
  }

  // Calculate the average of valid scores
  const total = sum(...validScores);
  return total / validScores.length;
}

export function sum(...numbers: number[]): number {
  return numbers.reduce((total, num) => total + num, 0);
}

// Convert a Google Drive share link to a direct link
export const getDirectImageLink = (url: string) => {
  const match = url.match(/\/d\/(.*?)\//);
  if (match && match[1]) {
    // return `https://drive.google.com/thumbnail?id=${match[1]}`;
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url; // Return the original URL if it doesn't match the pattern
};

export function getBgColorScale(maxScore: number, minScore: number) {
  return d3
    .scaleSequential()
    .domain([minScore, maxScore])
    .interpolator(d3.interpolateGnBu);
}

export async function searchMostRelevantItem(
  query: string,
  items: { id: number; text: string }[],
  n = 3,
) {
  const queryEmbedding = await getTextEmbedding(query);

  const withSimilarities = items.map(async (item) => {
    const itemEmbedding = await getTextEmbedding(item.text);
    const similarity = cosineSimilarity(queryEmbedding, itemEmbedding);
    return { ...item, similarity };
  });

  const results = await Promise.all(withSimilarities);

  // return results.sort((a, b) => b.similarity - a.similarity)[0].id;
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, n)
    .map((item) => item.id);
}

export function sortOption(labelName: string, displayName?: string) {
  return {
    labelName: labelName,
    displayName: displayName ?? labelName,
  };
}

export const concatItemFields = (
  item: DataPoint,
  options: {
    separator?: string;
    handleNull?: "keep" | "remove" | "placeholder";
    nullPlaceholder?: string;
  } = {},
  relevanceFields?: string[],
): string => {
  const {
    separator = "",
    handleNull = "remove",
    nullPlaceholder = "N/A",
  } = options;

  return Object.entries(item)
    .filter(([key]) =>
      relevanceFields
        ? relevanceFields.includes(key) ?? true
        : key !== "id" && key !== "order" && key !== "image",
    )
    .map(([_, value]) => {
      if (value === null) {
        switch (handleNull) {
          case "keep":
            return "null";
          case "placeholder":
            return nullPlaceholder;
          default:
            return "";
        }
      }
      return typeof value !== "string" ? "" : value;
    })
    .filter((str) => str !== "")
    .join(separator);
};

export const getTextColorBasedOnBgColor = (bgColor: string) => {
  // Check if the color is in rgba or rgb format
  let r, g, b;
  if (bgColor.startsWith("rgba") || bgColor.startsWith("rgb")) {
    // Extract RGB values from 'rgb(r, g, b)' or 'rgba(r, g, b, a)'
    const colorValues = bgColor.match(/\d+/g);
    if (colorValues) {
      [r, g, b] = colorValues.map(Number);
    }
  } else if (bgColor.startsWith("#")) {
    // Hex format
    const color = bgColor.substring(1);
    r = parseInt(color.substring(0, 2), 16);
    g = parseInt(color.substring(2, 4), 16);
    b = parseInt(color.substring(4, 6), 16);
  }
  // console.log(r, g, b);

  // Calculate luminance
  if (r !== undefined && g !== undefined && b !== undefined) {
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.7 ? "black" : "white";
  }

  // Default to black if color parsing fails
  return "black";
};

export function capitalizeWords(str: string) {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function cosineSimilarity(A: number[], B: number[]): number {
  if (A.length !== B.length) {
    throw new Error("A.length !== B.length");
  }
  let dotProduct = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < A.length; i++) {
    dotProduct += A[i] * B[i];
    normA += A[i] * A[i];
    normB += B[i] * B[i];
  }
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  return dotProduct / (normA * normB);
}

export async function clipScore(image_url: string, text: string) {
  const payload = {
    image_url: image_url,
    text: text,
  };

  try {
    const response = await fetch("/api/clip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Similarity results:", data);
    return data["similarity"];
  } catch (error) {
    console.error("Prediction request failed:", error);
  }
}

export async function sortDataPointsBySimilarity(
  dataPoints: DataPoint[],
  text: string,
  relevanceField: string,
): Promise<
  {
    id: number;
    score: number;
  }[]
> {
  console.log("Sorting data points by similarity");

  let results: {
    id: number;
    score: number;
  }[] = [];
  if (relevanceField === "image") {
    results = await Promise.all(
      dataPoints.map(async (dataPoint) => {
        let similarityImage: number | undefined = undefined;
        similarityImage = await clipScore(dataPoint.image as string, text);
        if (
          similarityImage === undefined ||
          similarityImage === null ||
          isNaN(similarityImage)
        ) {
          return { id: dataPoint.id, score: 0 };
        }

        return { id: dataPoint.id, score: similarityImage };
      }),
    );
  } else {
    results = await Promise.all(
      dataPoints.map(async (dataPoint) => {
        const res = await fetch("/api/classify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: text,
            description: dataPoint[relevanceField] as string,
            apiKey: useOpenAIAPI.getState().apiKey,
          }),
        });
        if (!res.ok) {
          console.error("Error in classification request:", res.statusText);
          return { id: dataPoint.id, score: 0 };
        }
        const data = await res.json();
        return { id: dataPoint.id, score: data.result };
      }),
    );
  }

  console.log("Results:", results);

  // Sort by score
  results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return results;
}

export async function getDescriptionEmbedding(
  id: number,
  relevanceFields?: string[],
) {
  const item = useItemDataStore.getState().items.find((item) => item.id === id);
  if (!item) {
    throw new Error(`Item with id ${id} not found`);
  }

  const desciprtion = relevanceFields
    ? concatItemFields(
        item,
        {
          separator: "\n",
        },
        relevanceFields,
      )
    : concatItemFields(item, { separator: "\n" });

  if (desciprtion === "") {
    return null;
  }

  const textEmbedding = await getTextEmbedding(
    desciprtion,
    "text-embedding-3-small",
  );

  return textEmbedding;
}

export async function getTextEmbedding(
  text: string,
  model: string = "text-embedding-3-small",
) {
  const textWithoutStopwords = removeStopwords(text.split(" ")).join(" ");

  const embeddingCache = useEmbeddingCache.getState().embeddingCache;
  const cachedEmbedding = embeddingCache[textWithoutStopwords];
  if (cachedEmbedding) {
    return cachedEmbedding;
  }
  let embedding: number[] = [];
  try {
    const response = await fetch("/api/embedding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        input: textWithoutStopwords,
        apiKey: useOpenAIAPI.getState().apiKey,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Embedding generation failed");
    }

    const data = await response.json();
    embedding = data.embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }

  useEmbeddingCache
    .getState()
    .addEmbeddingToCache(textWithoutStopwords, embedding);

  return embedding;
}

// Slope chart
// Get color based on rank change
export const getStrongerColor = (rankChange: number) => {
  if (rankChange > 0) return "#00D291"; // Green for improvement
  if (rankChange < 0) return "#ff627d"; // Red for decline
  return "#d1d5db"; // Gray for no change
};

// Bar color based on value sign with stronger colors
export const getBarFill = (value: number) => {
  return value >= 0 ? "#00bafe" : "#ff627d"; // Blue for positive, Red for negative
};

// Function to truncate long item names
export const truncateName = (name: string, maxLength: number) => {
  if (!name) return "";
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 3) + "...";
};

// Function to get explanation text based on rank change
export const getRankChangeExplanation = (name: string, rankChange: number) => {
  if (rankChange < 0) {
    return `${name} either deserves a higher ranking, or its scores on certain criteria might need to be decreased.`;
  } else if (rankChange > 0) {
    return `${name} either deserves a lower ranking, or its scores on certain criteria might need to be increased.`;
  } else {
    return `${name} is in the right place.`;
  }
};

// Helper function to calculate a point on a cubic bezier curve at parameter t
export const bezierPoint = (
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
) => {
  const mt = 1 - t;
  return {
    x:
      mt * mt * mt * p0.x +
      3 * mt * mt * t * p1.x +
      3 * mt * t * t * p2.x +
      t * t * t * p3.x,
    y:
      mt * mt * mt * p0.y +
      3 * mt * mt * t * p1.y +
      3 * mt * t * t * p2.y +
      t * t * t * p3.y,
  };
};

// Generalized normalization function that can be used across components
export const normalizeValue = (
  value: number,
  allValues: number[],
  targetRange: [number, number] = [0, 1],
): number => {
  const [targetMin, targetMax] = targetRange;
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);

  if (dataMax === dataMin) {
    return (targetMin + targetMax) / 2;
  }

  const normalized = (value - dataMin) / (dataMax - dataMin);
  return targetMin + normalized * (targetMax - targetMin);
};

export const normalize = (item: DataPoint, criterion: string): number => {
  // Calculate min and max for the criterion
  let min = Infinity;
  let max = -Infinity;

  const criteriaData = useCriteriaDataStore.getState().criteriaData;
  const thisCriterionData = criteriaData.find(
    (data) => data.name === criterion,
  );

  if (thisCriterionData) {
    const allNumbers = [
      ...Object.keys(thisCriterionData.groups.positive).map((key) =>
        Number(key),
      ),
      0,
      ...Object.keys(thisCriterionData.groups.negative)
        .map((key) => {
          if (thisCriterionData.groups.negative[Number(key)].length > 0) {
            return -Number(key);
          }
          return undefined; // Explicitly return undefined
        })
        .filter((value): value is number => value !== undefined), // Filter out undefined values
    ];

    // console.log("allNumbers:", allNumbers);
    // Set the max as the max key (number) in the criterion data postive group
    max = Math.max(...allNumbers);
    min = Math.min(...allNumbers);
    if (min === max) {
      max = min + 1; // If min and max are the same, add 1 to max
    }
  } else {
    let hasValidValues = false;
    const items = useItemDataStore.getState().gridItems;
    items.forEach((dataItem) => {
      const value = dataItem[criterion];
      if (value !== undefined && value !== null) {
        const num =
          typeof value === "number" ? value : parseFloat(value as string);
        if (!isNaN(num)) {
          hasValidValues = true;
          if (num < min) min = num;
          if (num > max) max = num;
        }
      }
    });

    // If no valid values, set min and max to 0 and 1
    if (!hasValidValues) {
      min = 0;
      max = 1;
    } else if (min === max) {
      max = min + 1; // If min and max are the same, add 1 to max
    }
  }

  // console.log("criterion:", criterion);
  // console.log("Min:", min, "Max:", max);
  // Normalize the value for the given item and criterion
  const value = item[criterion];
  if (value !== undefined && value !== null) {
    const num = typeof value === "number" ? value : parseFloat(value as string);
    if (!isNaN(num)) {
      // Use max absolute value from max and min for normalization
      const maxAbsValue = Math.max(Math.abs(max), Math.abs(min));
      return num / maxAbsValue;
    }
  }

  // Return 0 if the value is invalid
  return 0;
};

// Get normalized value for a criterion if normalization is enabled for that criterion
export const getNormalizedValueForCriterion = (
  item: DataPoint,
  criterion: string,
): number => {
  const criteriaData = useCriteriaDataStore.getState().criteriaData;
  const thisCriterionData = criteriaData.find(
    (data) => data.name === criterion,
  );

  // If normalization is not enabled for this criterion, return the raw value
  if (!thisCriterionData?.normalized) {
    const value = item[criterion];
    return typeof value === "number" ? value : parseFloat(value as string) || 0;
  }

  const targetRange = thisCriterionData.normalizeRange || [0, 1];

  // Get all values for this criterion to calculate min/max
  let allValues: number[] = [];

  if (thisCriterionData) {
    // Get values from criteria groups
    allValues = [
      ...Object.keys(thisCriterionData.groups.positive).map((key) =>
        Number(key),
      ),
      0,
      ...Object.keys(thisCriterionData.groups.negative)
        .map((key) => {
          if (thisCriterionData.groups.negative[Number(key)].length > 0) {
            return -Number(key);
          }
          return undefined;
        })
        .filter((value): value is number => value !== undefined),
    ];
  } else {
    // Fallback: get values from all items
    const items = useItemDataStore.getState().gridItems;
    items.forEach((dataItem) => {
      const value = dataItem[criterion];
      if (value !== undefined && value !== null) {
        const num =
          typeof value === "number" ? value : parseFloat(value as string);
        if (!isNaN(num)) {
          allValues.push(num);
        }
      }
    });
  }

  if (allValues.length === 0) {
    return targetRange[0]; // Return target minimum if no valid values
  }

  const value = item[criterion];
  if (value !== undefined && value !== null) {
    const num = typeof value === "number" ? value : parseFloat(value as string);
    if (!isNaN(num)) {
      return normalizeValue(num, allValues, targetRange);
    }
  }

  return targetRange[0]; // Return target minimum if value is invalid
};
