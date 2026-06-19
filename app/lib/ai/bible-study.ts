import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { resolveBibleProvider } from "@/app/lib/bible/provider";

export type BibleStudyPrompt = {
  versionId?: string;
  bookId: string;
  chapter: number;
  question: string;
};

export async function streamBibleStudyResponse({
  versionId = "BSB",
  bookId,
  chapter,
  question,
}: BibleStudyPrompt) {
  console.log("[ai:bible-study] preparing context", versionId, bookId, chapter);
  const provider = await resolveBibleProvider(versionId);
  const bibleChapter = await provider.getChapter(versionId, bookId, chapter);
  const passage =
    bibleChapter.verses.length > 0
      ? bibleChapter.verses.map((verse) => `${verse.number}. ${verse.text}`).join("\n")
      : JSON.stringify(bibleChapter.contentBlocks ?? bibleChapter.contentHtml ?? "");

  return streamText({
    model: openai(process.env.OPENAI_MODEL ?? "gpt-4.1-mini"),
    system:
      "You are a careful Bible study assistant. Use the supplied passage as primary context, distinguish textual observation from interpretation, and avoid claiming certainty where traditions differ.",
    prompt: [
      `Passage: ${bibleChapter.reference} (${versionId})`,
      passage,
      `Question: ${question}`,
    ].join("\n\n"),
  });
}
