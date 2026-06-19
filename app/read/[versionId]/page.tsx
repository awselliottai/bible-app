import { redirect } from "next/navigation";
import { getReaderData } from "@/app/lib/bible/reader";

export const dynamic = "force-dynamic";

type ReadVersionPageProps = {
  params: Promise<{
    versionId: string;
  }>;
};

export default async function ReadVersionPage({ params }: ReadVersionPageProps) {
  const { versionId } = await params;
  console.log("[page:read-version] resolving default chapter", versionId);
  const readerData = await getReaderData({
    versionId,
  });

  redirect(
    `/read/${encodeURIComponent(readerData.selectedVersionId)}/${encodeURIComponent(
      readerData.chapter.bookId,
    )}/${readerData.chapter.chapter}`,
  );
}
