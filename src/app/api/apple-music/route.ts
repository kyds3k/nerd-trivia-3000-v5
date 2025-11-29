import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const term = searchParams.get("term");
  const limit = searchParams.get("limit") || "10";

  try {
    let url = "";
    if (id) {
      url = `https://itunes.apple.com/lookup?id=${id}`;
    } else if (term) {
      const encodedQuery = encodeURIComponent(term);
      url = `https://itunes.apple.com/search?term=${encodedQuery}&media=music&entity=song&limit=${limit}`;
    } else {
      return NextResponse.json({ error: "Missing id or term parameter" }, { status: 400 });
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`iTunes API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching from Apple Music:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Apple Music" },
      { status: 500 }
    );
  }
}
