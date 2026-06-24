import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const term = searchParams.get("term");
  const limit = searchParams.get("limit") || "10";

  try {
    let url = "";
    if (id) {
      url = `https://itunes.apple.com/lookup?id=${id}&country=US`;
    } else if (term) {
      const encodedQuery = encodeURIComponent(term);
      url = `https://itunes.apple.com/search?term=${encodedQuery}&media=music&entity=song&country=US&limit=${limit}`;
    } else {
      return NextResponse.json({ error: "Missing id or term parameter" }, { status: 400 });
    }

    // iTunes rejects/rate-limits requests without a browser-like User-Agent
    // (often surfacing as a 403/500), so send one. Don't cache search results.
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      // Surface the real upstream status so the client/log shows the actual cause.
      const body = await response.text().catch(() => "");
      console.error(`iTunes upstream ${response.status} for ${url}: ${body.slice(0, 300)}`);
      return NextResponse.json(
        { error: "iTunes upstream error", upstreamStatus: response.status },
        { status: 502 }
      );
    }

    // iTunes returns text/javascript content-type; parse defensively.
    const text = await response.text();
    const data = text ? JSON.parse(text) : { resultCount: 0, results: [] };
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching from Apple Music:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Apple Music" },
      { status: 500 }
    );
  }
}
