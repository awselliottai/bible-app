import { bibleError, bibleJson } from "@/app/lib/bible/http";
import { bibleProvider } from "@/app/lib/bible/provider";

export async function GET() {
  try {
    console.log("[api:bible:versions] request");
    const versions = await bibleProvider.listVersions();
    return bibleJson({
      versions,
    });
  } catch (error) {
    return bibleError(error);
  }
}
