export type DataPoint = {
  order: number;
  id: number;
  [key: string]: string | number | null;
};

export type Criteria = {
  name: string;
  explanation: string;
  groups: {
    positive: { [key: number]: DataPoint[] };
    neutral: DataPoint[];
    negative: { [key: number]: DataPoint[] };
  };
  similarity: {
    id: number;
    score: number;
  }[];
  relevance: string;
  isCustom?: boolean; // Track if this criterion was added through NewCriteriaPanel
  normalized?: boolean; // Track if this criterion should use normalized values
  normalizeRange?: [number, number]; // Range for normalization (default 0-1)
};

// Slope chart
export type SlopeChartItem = {
  id: string;
  name: string;
  startRank: number;
  endRank: number;
  startValue: number;
  endValue: number;
  rankChange: number;
  image: string;
};

export type HighlightedPair = {
  id1: string;
  id2: string;
} | null;

export type Intersection = {
  id1: string;
  id2: string;
  x: number;
  y: number;
};

export type CrossingPair = {
  id1: string;
  id2: string;
  name1: string;
  name2: string;
};
