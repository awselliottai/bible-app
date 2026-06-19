import "server-only";
import { BibleProviderError } from "../types";

const DEFAULT_API_BIBLE_ENDPOINT = "https://rest.api.bible";

function apiBaseUrl() {
  const rawEndpoint = process.env.BIBLE_API_ENDPOINT ?? DEFAULT_API_BIBLE_ENDPOINT;
  const endpoint = rawEndpoint.replace(/\/+$/, "");
  return endpoint.endsWith("/v1") ? endpoint : `${endpoint}/v1`;
}

export function hasApiBibleCredentials() {
  return Boolean(process.env.BIBLE_API_KEY);
}

export async function apiBibleFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const bibleApiKey = process.env.BIBLE_API_KEY;

  if (!bibleApiKey) {
    throw new BibleProviderError("Missing BIBLE_API_KEY.", 500);
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${apiBaseUrl()}${normalizedPath}`;
  console.log("[bible:api-bible] fetch", url);

  const response = await fetch(url, {
    ...init,
    headers: {
      accept: "application/json",
      "api-key": bibleApiKey,
      ...init?.headers,
    },
    next: {
      revalidate: 60 * 60 * 24,
      ...init?.next,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.log("[bible:api-bible] fetch failed", response.status, body);
    throw new BibleProviderError(
      `API.Bible request failed: ${response.status} ${response.statusText}`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}
