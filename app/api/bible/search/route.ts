import { bibleError, bibleJson } from "@/app/lib/bible/http";
import { resolveBibleProvider } from "@/app/lib/bible/provider";
import { BibleProviderError } from "@/app/lib/bible/types";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const versionId = url.searchParams.get("version") ?? "BSB";
    const query = url.searchParams.get("q") ?? "";
    const limit = Number(url.searchParams.get("limit") ?? "25");
    const offset = Number(url.searchParams.get("offset") ?? "0");

    console.log("[api:bible:search] request", versionId, query);
    const provider = await resolveBibleProvider(versionId);

    if (!provider.search) {
      throw new BibleProviderError("Search is not enabled for this provider.", 501);
    }

    const results = await provider.search(versionId, query, {
      limit,
      offset,
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
