import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const spreadsheetId = searchParams.get("id");

  if (!spreadsheetId) {
    return NextResponse.json(
      { error: "Missing spreadsheet ID" },
      { status: 400 },
    );
  }

  try {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.error("GOOGLE_API_KEY not found in environment variables");
      return NextResponse.json(
        {
          error:
            "Google API key not configured. Please add GOOGLE_API_KEY to .env.local",
        },
        { status: 500 },
      );
    }

    // First, get the spreadsheet metadata to find the first sheet name
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
    const metadataResponse = await fetch(metadataUrl);

    if (!metadataResponse.ok) {
      throw new Error(`Google Sheets API returned ${metadataResponse.status}`);
    }

    const metadata = await metadataResponse.json();
    const firstSheetName = metadata.sheets?.[0]?.properties?.title;

    if (!firstSheetName) {
      throw new Error("No sheets found in the spreadsheet");
    }

    // Now fetch the data from the first sheet
    const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(firstSheetName)}?key=${apiKey}`;
    const dataResponse = await fetch(dataUrl);

    if (!dataResponse.ok) {
      throw new Error(`Google Sheets API returned ${dataResponse.status}`);
    }

    const data = await dataResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching Google Sheets data:", error);
    return NextResponse.json(
      { error: "Failed to fetch spreadsheet data" },
      { status: 500 },
    );
  }
}
