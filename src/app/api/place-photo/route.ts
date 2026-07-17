import { NextRequest, NextResponse } from "next/server";

// Free, keyless, no-copyright-risk photo lookup via Wikimedia. Prefers the
// Wikidata P18 (image) claim when a wikidataId is available (many OSM
// attractions carry one); falls back to a plain Commons file search by name.
const USER_AGENT = "Rotanza-Demo/1.0 (+https://rotanza.example; contact: support@rotanza.example)";

async function photoFromWikidata(wikidataId: string): Promise<string | null> {
  const res = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const entity = data.entities?.[wikidataId];
  const filename: string | undefined = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  if (!filename) return null;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=800`;
}

async function photoFromCommonsSearch(query: string): Promise<string | null> {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", `${query} filetype:bitmap`);
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", "1");
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url");
  url.searchParams.set("iiurlwidth", "800");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  const data = await res.json();
  const pages = data.query?.pages;
  if (!pages) return null;
  const first = Object.values(pages)[0] as { imageinfo?: Array<{ thumburl?: string }> } | undefined;
  return first?.imageinfo?.[0]?.thumburl ?? null;
}

export async function GET(req: NextRequest) {
  const wikidataId = req.nextUrl.searchParams.get("wikidataId");
  const name = req.nextUrl.searchParams.get("name");
  const location = req.nextUrl.searchParams.get("location") ?? "";

  try {
    if (wikidataId) {
      const photoUrl = await photoFromWikidata(wikidataId);
      if (photoUrl) return NextResponse.json({ photoUrl });
    }
    if (name) {
      const photoUrl = await photoFromCommonsSearch(`${name} ${location}`.trim());
      if (photoUrl) return NextResponse.json({ photoUrl });
    }
    return NextResponse.json({ photoUrl: null });
  } catch {
    return NextResponse.json({ photoUrl: null, error: "photo_lookup_failed" }, { status: 502 });
  }
}
