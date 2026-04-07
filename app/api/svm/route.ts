import { NextResponse } from "next/server";

interface Item {
  id: number | string;
  [key: string]: any;
}

interface RankingRequest {
  items: Item[];
  ranking_groups?: (string | number)[][];
  initial_weights?: {
    [key: string]: number;
  };
  learning_rate?: number;
  epochs?: number;
  regularization?: number;
}

interface FeatureDifferences {
  [feature: string]: number;
}

interface UnsolvedConstraint {
  higher_id: number | string;
  lower_id: number | string;
  higher_score: number;
  lower_score: number;
  score_difference: number;
  feature_differences: FeatureDifferences;
}

interface RankingResponse {
  weights: Record<string, number>;
  scores: Record<string | number, number>;
  warnings: string[];
  unsolved_constraints: UnsolvedConstraint[];
}

export async function POST(req: Request) {
  try {
    const requestData: RankingRequest = await req.json();

    // Validate the request data
    if (
      !requestData.items ||
      !Array.isArray(requestData.items) ||
      requestData.items.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing or empty items array" },
        { status: 400 },
      );
    }

    // Ensure each item has an id
    const missingIds = requestData.items.some((item) => item.id === undefined);
    if (missingIds) {
      return NextResponse.json(
        { error: "All items must have an 'id' property" },
        { status: 400 },
      );
    }

    // Call the Ranking SVM API
    const apiResponse = await fetch("https://ranking-svm.vercel.app/rank", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    // Check if the response is OK
    if (!apiResponse.ok) {
      // Try to parse error response as JSON first
      try {
        const errorJson = await apiResponse.json();
        throw new Error(
          `Ranking SVM API Error (${apiResponse.status}): ${JSON.stringify(errorJson)}`,
        );
      } catch (jsonError) {
        // If JSON parsing fails, fall back to text
        const errorText = await apiResponse.text();
        throw new Error(
          `Ranking SVM API Error (${apiResponse.status}): ${errorText}`,
        );
      }
    }

    const result: RankingResponse = await apiResponse.json();

    // Return the processed result
    return NextResponse.json(result);
  } catch (error) {
    console.error("Ranking SVM error:", error);
    return NextResponse.json(
      {
        error: "Ranking operation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
