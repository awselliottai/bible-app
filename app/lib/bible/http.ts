import { BibleProviderError } from "./types";

export function bibleJson(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      "cache-control": "s-maxage=3600, stale-while-revalidate=86400",
      ...init?.headers,
    },
  });
}

export function bibleError(error: unknown) {
  if (error instanceof BibleProviderError) {
    console.log("[bible:api] provider error", error.status, error.message);
    return Response.json(
      {
        error: error.message,
      },
      {
        status: error.status,
      },
    );
  }

  console.log("[bible:api] unexpected error", error);
  return Response.json(
    {
      error: "Unexpected Bible API error.",
    },
    {
      status: 500,
    },
  );
}
