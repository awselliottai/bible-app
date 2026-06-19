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
        className="citation-link font-semibold underline underline-offset-2 transition"
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
          <span aria-hidden="true" className="citation-bullet">
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

function StudyLoadingIndicator() {
  return (
    <div
      aria-label="Response loading"
      className="study-loading"
      role="status"
    >
      <span className="study-loading-bar" />
      <span className="study-loading-bar" />
      <span className="study-loading-bar" />
    </div>
  );
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

  function handleClearChat() {
    console.log("[component:BibleStudyPanel] clearing study chat", {
      reference,
      messageCount: messages.length,
    });
    abortRef.current?.abort();
    setMessages([]);
    setError("");
    setIsStreaming(false);
  }

  return (
    <section
      aria-labelledby="study-panel-heading"
      className="study-panel w-full rounded-lg border p-4 transition-shadow duration-300 sm:p-5 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:overscroll-contain"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="app-eyebrow text-xs font-semibold uppercase tracking-normal">
            Study
          </p>
          <h2 className="mt-1 text-base font-semibold sm:text-lg" id="study-panel-heading">
            {reference}
          </h2>
        </div>
        {isStreaming ? (
          <button
            className="app-button-secondary min-h-11 rounded-md border px-3 py-2 text-xs font-semibold transition"
            onClick={handleStop}
            type="button"
          >
            Stop
          </button>
        ) : null}
      </div>

      <div className="study-inner-card mt-4 rounded-md border p-3">
        <p className="app-eyebrow text-xs font-semibold uppercase tracking-normal">
          Selected
        </p>
        <p className="mt-2 max-h-32 overflow-auto text-sm leading-6">
          {selectedText || "Full chapter"}
        </p>
      </div>

      {messages.length > 0 ? (
        <div
          aria-live="polite"
          aria-relevant="additions text"
          className="mt-4 max-h-72 space-y-3 overflow-auto pr-1 sm:max-h-96"
        >
          {messages.map((message, index) => (
            <div
              className={`rounded-md border p-3 text-sm leading-6 ${
                message.role === "user"
                  ? "study-message-user"
                  : "study-message-assistant"
              }`}
              key={`${message.role}-${index}`}
            >
              <p className="app-eyebrow mb-1 text-xs font-semibold uppercase tracking-normal">
                {message.role === "user" ? "Question" : "Response"}
              </p>
              <div className="space-y-2 whitespace-pre-wrap">
                {message.content
                  ? message.role === "assistant"
                    ? renderResponseText(message.content)
                    : message.content
                  : message.role === "assistant" &&
                      isStreaming &&
                      index === messages.length - 1
                    ? <StudyLoadingIndicator />
                  : "..."}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="study-error mt-3 rounded-md border p-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="study-question">
          Ask a question
        </label>
        <textarea
          className="app-control min-h-28 w-full resize-y rounded-md border p-3 text-base leading-6 outline-none transition sm:text-sm"
          id="study-question"
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about this passage"
          value={question}
        />
        <button
          className="app-button-primary min-h-11 w-full rounded-md px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isStreaming || question.trim().length === 0}
          type="submit"
        >
          Ask
        </button>
        {messages.length > 0 ? (
          <button
            className="app-button-secondary min-h-11 w-full rounded-md border px-4 py-3 text-sm font-semibold transition"
            onClick={handleClearChat}
            type="button"
          >
            Clear chat
          </button>
        ) : null}
      </form>
    </section>
  );
}
