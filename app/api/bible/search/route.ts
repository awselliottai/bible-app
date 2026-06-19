import { bibleError, bibleJson } from "@/app/lib/bible/http";
import { bibleProvider } from "@/app/lib/bible/provider";
import { BibleProviderError } from "@/app/lib/bible/types";

export async function GET(request: Request) {
  try {
    if (!bibleProvider.search) {
      throw new BibleProviderError("Search is not enabled for this provider.", 501);
    }

    const url = new URL(request.url);
    const versionId = url.searchParams.get("version") ?? "BSB";
    const query = url.searchParams.get("q") ?? "";
    const limit = Number(url.searchParams.get("limit") ?? "25");

    console.log("[api:bible:search] request", versionId, query);
    const results = await bibleProvider.search(versionId, query, {
      limit,
    });

    return bibleJson(results, {
      headers: {
        "cache-control": "s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    return bibleError(error);
  }
}
