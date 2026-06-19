import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { resolveBibleProvider } from "@/app/lib/bible/provider";

export type BibleStudySearchContextSize = "low" | "medium" | "high";

export type BibleStudyPrompt = {
  versionId?: string;
  bookId: string;
  chapter: number;
  question: string;
  selectedText?: string;
  webSearch?: boolean;
  searchContextSize?: BibleStudySearchContextSize;
};

export async function streamBibleStudyResponse({
  versionId = "BSB",
  bookId,
  chapter,
  question,
  selectedText,
  webSearch = true,
  searchContextSize = "medium",
}: BibleStudyPrompt) {
  console.log("[ai:bible-study] preparing context", {
    versionId,
    bookId,
    chapter,
    hasSelectedText: Boolean(selectedText),
    webSearch,
    searchContextSize,
  });
  const provider = await resolveBibleProvider(versionId);
  const bibleChapter = await provider.getChapter(versionId, bookId, chapter);
  const passage =
    bibleChapter.verses.length > 0
      ? bibleChapter.verses.map((verse) => `${verse.number}. ${verse.text}`).join("\n")
      : JSON.stringify(bibleChapter.contentBlocks ?? bibleChapter.contentHtml ?? "");
  const model = process.env.OPENAI_MODEL ?? "gpt-5-mini-2025-08-07";

  console.log("[ai:bible-study] streaming response", {
    model,
    reference: bibleChapter.reference,
    passageVerseCount: bibleChapter.verses.length,
  });

  return streamText({
    model: openai(model),
    tools: webSearch
      ? {
          web_search: openai.tools.webSearch({
            searchContextSize,
            userLocation: {
              type: "approximate",
              country: "US",
              timezone: "America/Chicago",
            },
          }),
        }
      : undefined,
    providerOptions: {
      openai: {
        store: false,
        textVerbosity: "medium",
      },
    },
    system:
      "You are a careful Bible study assistant. Use the supplied Bible passage as primary context. Use the web_search tool to verify historical, linguistic, manuscript, authorship, background, or cross-reference claims before answering. Prefer reputable Bible-reference, academic, publisher, or primary-source pages when web context is needed. Cite sources when web search informs the answer. Distinguish textual observation from interpretation, name major tradition differences when relevant, and say when the supplied passage or searched sources do not establish an answer.",
    prompt: [
      `Passage: ${bibleChapter.reference} (${versionId})`,
      passage,
      selectedText
        ? `Focused selected text from this passage:\n${selectedText}`
        : "No specific text was selected. Use the full supplied chapter as the focus.",
      webSearch
        ? "Web search is enabled. Ground the answer in the supplied passage and use searched sources to verify claims beyond the passage."
        : "Web search is disabled for this request. Do not claim external verification.",
      `Question: ${question}`,
    ].join("\n\n"),
  });
}
