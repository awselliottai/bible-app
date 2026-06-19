import { streamBibleStudyResponse } from "@/app/lib/ai/bible-study";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      versionId?: string;
      bookId?: string;
      chapter?: number;
      question?: string;
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

    console.log("[api:ai:study] request", body.versionId, body.bookId, body.chapter);
    const result = await streamBibleStudyResponse({
      versionId: body.versionId,
      bookId: body.bookId,
      chapter: body.chapter,
      question: body.question,
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
