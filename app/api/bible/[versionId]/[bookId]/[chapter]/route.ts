import { bibleError, bibleJson } from "@/app/lib/bible/http";
import { resolveBibleProvider } from "@/app/lib/bible/provider";
import { BibleProviderError } from "@/app/lib/bible/types";

type RouteParams = {
  params: Promise<{
    versionId: string;
    bookId: string;
    chapter: string;
  }>;
};

export async function GET(_request: Request, context: RouteParams) {
  try {
    const { versionId, bookId, chapter } = await context.params;
    const chapterNumber = Number(chapter);

    if (!Number.isInteger(chapterNumber)) {
      throw new BibleProviderError("Chapter must be an integer.", 400);
    }

    console.log("[api:bible:chapter] request", versionId, bookId, chapterNumber);
    const provider = await resolveBibleProvider(versionId);
    const normalizedChapter = await provider.getChapter(
      versionId,
      bookId,
      chapterNumber,
    );
    return bibleJson({
      chapter: normalizedChapter,
    });
  } catch (error) {
    return bibleError(error);
  }
}
