import { NextResponse } from "next/server";

interface PredictionRequest {
  image_url: string;
  text: string;
}

interface PredictionResponse {
  similarities: number[];
  sorted_indices: number[];
}

export async function POST(req: Request) {
  try {
    const { image_url, text }: PredictionRequest = await req.json();

    if (!image_url || !text) {
      return NextResponse.json(
        { error: "Missing image_url or texts array" },
        { status: 400 },
      );
    }

    // Call HuggingFace API
    const hfResponse = await fetch(
      "https://zhangchaodesign-clip-similarity.hf.space/predict",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url,
          text,
        }),
      },
    );

    // Check if the response is OK
    if (!hfResponse.ok) {
      const error = await hfResponse.text();
      throw new Error(`HF API Error: ${error}`);
    }

    const result: PredictionResponse = await hfResponse.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Prediction error:", error);
    return NextResponse.json(
      {
        error: "Prediction failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
