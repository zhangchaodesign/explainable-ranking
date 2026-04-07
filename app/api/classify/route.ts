import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      prompt,
      description,
      apiKey,
    }: {
      prompt: string;
      description: string;
      apiKey?: string;
    } = body;

    const resolvedKey = apiKey || process.env.OPENAI_API_KEY;
    if (!resolvedKey) {
      return NextResponse.json(
        { error: "No OpenAI API key provided" },
        { status: 401 },
      );
    }

    const openai = new OpenAI({ apiKey: resolvedKey });

    // Check for required parameters
    if (!prompt || !description) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const systemPrompt = `Perform classification by following these steps:
    1. Evaluate if the text description meet the specified criteria
    2. Respond with "1" (meets criteria) or "0" (does not meet)

    **Criteria to apply:**
    ${prompt}

    Important notes:
    - Account for explicit preferences in criteria
    - Never provide explanations - only 0/1 response`;

    // Construct messages
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    // Add a new user message
    const currentContent: OpenAI.ChatCompletionContentPart[] = [];

    if (description) {
      currentContent.push({ type: "text", text: description });
    }

    messages.push({
      role: "user",
      content: currentContent,
    });

    // Call the OpenAI apiKey
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      messages,
      temperature: 0,
    });

    // Parse the response
    const rawResult = completion.choices[0].message.content?.trim();
    const cleanedResult = rawResult?.replace(/\D/g, "");

    if (cleanedResult !== "0" && cleanedResult !== "1") {
      return NextResponse.json(
        {
          error: "Invalid model response",
          response: rawResult,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      result: parseInt(cleanedResult) as 0 | 1,
    });
  } catch (error) {
    console.error("Classification error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
