"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";

type BibleStudyPanelProps = {
  versionId: string;
  bookId: string;
  chapter: number;
  reference: string;
};

type StudyMessage = {
  role: "user" | "assistant";
  content: string;
};

const maxSelectedTextLength = 2400;
const markdownLinkPattern = /\[([^\]]+)]\((https?:\/\/[^)\s]+)\)/g;

function cleanSelectedText(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, maxSelectedTextLength);
}

function cleanCitationUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.delete("utm_source");
    return parsedUrl.toString();
  } catch {
    return url;
  }
}

function renderInlineCitations(text: string) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(markdownLinkPattern)) {
    const [rawLink, label, url] = match;
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    const cleanUrl = cleanCitationUrl(url);
    nodes.push(
      <a
        className="font-semibold text-[#315f63] underline decoration-[#9bbabd] underline-offset-2 transition hover:text-[#21484b]"
        href={cleanUrl}
        key={`${cleanUrl}-${index}`}
        rel="noreferrer"
        target="_blank"
      >
        {label}
      </a>,
    );

    lastIndex = index + rawLink.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : text;
}

function renderResponseText(content: string) {
  const lines = content.split("\n");

  return lines.map((line, index) => {
    const trimmedLine = line.trim();
    const bulletText = trimmedLine.match(/^[-*]\s+(.+)$/)?.[1];

    if (bulletText) {
      return (
        <div className="flex gap-2" key={`${line}-${index}`}>
          <span aria-hidden="true" className="text-[#6f5336]">
            •
          </span>
          <span>{renderInlineCitations(bulletText)}</span>
        </div>
      );
    }

    if (trimmedLine.length === 0) {
      return <br key={`break-${index}`} />;
    }

    return <span key={`${line}-${index}`}>{renderInlineCitations(line)}</span>;
  });
}

export function BibleStudyPanel({
  versionId,
  bookId,
  chapter,
  reference,
}: BibleStudyPanelProps) {
  const [selectedText, setSelectedText] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<StudyMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    function handleSelectionChange() {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        return;
      }

      const anchorNode = selection.anchorNode;
      const focusNode = selection.focusNode;
      const anchorElement =
        anchorNode?.nodeType === Node.ELEMENT_NODE
          ? (anchorNode as Element)
          : anchorNode?.parentElement;
      const focusElement =
        focusNode?.nodeType === Node.ELEMENT_NODE
          ? (focusNode as Element)
          : focusNode?.parentElement;

      const anchorPassage = anchorElement?.closest("[data-bible-passage]");
      const focusPassage = focusElement?.closest("[data-bible-passage]");

      if (!anchorPassage || !focusPassage || anchorPassage !== focusPassage) {
        return;
      }

      const nextSelectedText = cleanSelectedText(selection.toString());

      if (nextSelectedText.length === 0) {
        return;
      }

      setSelectedText((currentSelectedText) => {
        if (currentSelectedText === nextSelectedText) {
          return currentSelectedText;
        }

        console.log("[component:BibleStudyPanel] selected passage", {
          reference,
          selectedLength: nextSelectedText.length,
        });
        return nextSelectedText;
      });
    }

    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      abortRef.current?.abort();
    };
  }, [reference]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isStreaming) {
      return;
    }

    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    console.log("[component:BibleStudyPanel] asking study question", {
      reference,
      hasSelectedText: selectedText.length > 0,
      questionLength: trimmedQuestion.length,
    });

    setError("");
    setIsStreaming(true);
    setQuestion("");
    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "user", content: trimmedQuestion },
      { role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch("/api/ai/study", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          versionId,
          bookId,
          chapter,
          question: trimmedQuestion,
          selectedText: selectedText || undefined,
          webSearch: true,
          searchContextSize: "medium",
        }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("The study response could not be started.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        setMessages((currentMessages) => {
          const nextMessages = [...currentMessages];
          const lastMessage = nextMessages.at(-1);

          if (lastMessage?.role === "assistant") {
            nextMessages[nextMessages.length - 1] = {
              ...lastMessage,
              content: lastMessage.content + chunk,
            };
          }

          return nextMessages;
        });
      }

      console.log("[component:BibleStudyPanel] study response complete", {
        reference,
      });
    } catch (streamError) {
      if (abortController.signal.aborted) {
        console.log("[component:BibleStudyPanel] study response aborted", {
          reference,
        });
        return;
      }

      console.log("[component:BibleStudyPanel] study response error", streamError);
      setError("Unable to stream a study response.");
    } finally {
      setIsStreaming(false);
    }
  }

  function handleStop() {
    console.log("[component:BibleStudyPanel] stopping study response", {
      reference,
    });
    abortRef.current?.abort();
    setIsStreaming(false);
  }

  return (
    <section className="w-full rounded-lg border border-[#dfd8c9] bg-[#eef3ef] p-5 transition-shadow duration-300 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:overscroll-contain">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f5336]">
            Study
          </p>
          <h2 className="mt-1 text-lg font-semibold">{reference}</h2>
        </div>
        {isStreaming ? (
          <button
            className="rounded-md border border-[#bac8be] px-3 py-2 text-xs font-semibold text-[#33433a] transition hover:border-[#33433a]"
            onClick={handleStop}
            type="button"
          >
            Stop
          </button>
        ) : null}
      </div>

      <div className="mt-4 rounded-md border border-[#cbd8ce] bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6f5336]">
          Selected
        </p>
        <p className="mt-2 max-h-32 overflow-auto text-sm leading-6 text-[#3f3d35]">
          {selectedText || "Full chapter"}
        </p>
      </div>

      {messages.length > 0 ? (
        <div className="mt-4 max-h-96 space-y-3 overflow-auto pr-1">
          {messages.map((message, index) => (
            <div
              className={`rounded-md border p-3 text-sm leading-6 ${
                message.role === "user"
                  ? "border-[#d7ccb8] bg-[#fbfaf7] text-[#2e3029]"
                  : "border-[#cbd8ce] bg-white text-[#2e3029]"
              }`}
              key={`${message.role}-${index}`}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#6f5336]">
                {message.role === "user" ? "Question" : "Response"}
              </p>
              <div className="space-y-2 whitespace-pre-wrap">
                {message.content
                  ? message.role === "assistant"
                    ? renderResponseText(message.content)
                    : message.content
                  : "..."}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-md border border-[#d8b7a8] bg-[#fff7f3] p-3 text-sm text-[#7a3525]">
          {error}
        </p>
      ) : null}

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="study-question">
          Ask a question
        </label>
        <textarea
          className="min-h-28 w-full resize-y rounded-md border border-[#cbd8ce] bg-white p-3 text-sm leading-6 text-[#1f201b] outline-none transition focus:border-[#33433a]"
          id="study-question"
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about this passage"
          value={question}
        />
        <button
          className="w-full rounded-md bg-[#33433a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#28362f] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isStreaming || question.trim().length === 0}
          type="submit"
        >
          Ask
        </button>
      </form>
    </section>
  );
}
