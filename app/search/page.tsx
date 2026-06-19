import { BibleReaderView } from "@/app/components/BibleReaderView";
import { getReaderData, searchBible } from "@/app/lib/bible/reader";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{
    version?: string;
    q?: string;
    limit?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { version, q, limit } = await searchParams;
  const limitNumber = Number(limit ?? "20");
  console.log("[page:search] rendering search page", version, q);
  const readerData = await getReaderData({
    versionId: version,
  });
  const search =
    q && q.trim().length >= 2
      ? await searchBible({
          versionId: readerData.selectedVersionId,
          query: q,
          limit: Number.isInteger(limitNumber) ? limitNumber : 20,
        })
      : undefined;

  return <BibleReaderView {...readerData} search={search} searchQuery={q} />;
}
