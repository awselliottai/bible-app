import { helloAoBibleProvider } from "./helloao-provider";
import {
  apiBibleProvider,
  mayBeApiBibleVersion,
} from "./providers/apiBibleProvider";
import type { BibleProvider, BibleVersion } from "./types";

function versionKeys(version: BibleVersion) {
  return [
    version.id,
    version.abbreviation,
    version.providerId,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toUpperCase());
}

export async function listBibleVersions() {
  const helloAoVersions = await helloAoBibleProvider.listVersions();

  try {
    const apiBibleVersions = await apiBibleProvider.listVersions();
    const seen = new Set<string>();

    return [...apiBibleVersions, ...helloAoVersions].filter((version) => {
      const key = `${version.source}:${version.id}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  } catch (error) {
    console.log("[bible:provider] API.Bible versions unavailable", error);
    return helloAoVersions;
  }
}

export async function resolveBibleProvider(
  versionId: string,
): Promise<BibleProvider> {
  if (mayBeApiBibleVersion(versionId)) {
    return apiBibleProvider;
  }

  try {
    const apiBibleVersions = await apiBibleProvider.listVersions();
    const requested = versionId.toUpperCase();
    const apiMatch = apiBibleVersions.some((version) => {
      return versionKeys(version).includes(requested);
    });

    if (apiMatch) {
      return apiBibleProvider;
    }
  } catch (error) {
    console.log("[bible:provider] API.Bible provider resolution skipped", error);
  }

  return helloAoBibleProvider;
}
