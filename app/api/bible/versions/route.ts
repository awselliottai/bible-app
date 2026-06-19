import { bibleError, bibleJson } from "@/app/lib/bible/http";
import { listBibleVersions } from "@/app/lib/bible/provider";

export async function GET() {
  try {
    console.log("[api:bible:versions] request");
    const versions = await listBibleVersions();
    return bibleJson({
      versions,
    });
  } catch (error) {
    return bibleError(error);
  }
}
