import {
  type BibleStudySearchContextSize,
  streamBibleStudyResponse,
} from "@/app/lib/ai/bible-study";

export const maxDuration = 60;

const searchContextSizes = new Set<BibleStudySearchContextSize>([
  "low",
  "medium",
  "high",
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      versionId?: string;
      bookId?: string;
      chapter?: number;
      question?: string;
      webSearch?: boolean;
      searchContextSize?: BibleStudySearchContextSize;
    };

    if (!body.bookId || !body.chapter || !body.question) {
      console.log("[api:ai:study] invalid request body");
      return Response.json(
        {
          error: "bookId, chapter, and question are required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      body.searchContextSize &&
      !searchContextSizes.has(body.searchContextSize)
    ) {
      console.log("[api:ai:study] invalid search context size", body.searchContextSize);
      return Response.json(
        {
          error: "searchContextSize must be one of: low, medium, high.",
        },
        {
          status: 400,
        },
      );
    }

    console.log("[api:ai:study] request", {
      versionId: body.versionId,
      bookId: body.bookId,
      chapter: body.chapter,
      webSearch: body.webSearch ?? true,
      searchContextSize: body.searchContextSize ?? "medium",
    });
    const result = await streamBibleStudyResponse({
      versionId: body.versionId,
      bookId: body.bookId,
      chapter: body.chapter,
      question: body.question,
      webSearch: body.webSearch,
      searchContextSize: body.searchContextSize,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.log("[api:ai:study] error", error);
    return Response.json(
      {
        error:
          "Unable to stream a Bible study response. Check OPENAI_API_KEY and request input.",
      },
      {
        status: 500,
      },
    );
  }
}
