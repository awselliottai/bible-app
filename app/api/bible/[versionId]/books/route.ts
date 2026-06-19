import { bibleError, bibleJson } from "@/app/lib/bible/http";
import { resolveBibleProvider } from "@/app/lib/bible/provider";

type RouteParams = {
  params: Promise<{
    versionId: string;
  }>;
};

export async function GET(_request: Request, context: RouteParams) {
  try {
    const { versionId } = await context.params;
    console.log("[api:bible:books] request", versionId);
    const provider = await resolveBibleProvider(versionId);
    const books = await provider.listBooks(versionId);
    return bibleJson({
      versionId,
      books,
    });
  } catch (error) {
    return bibleError(error);
  }
}
