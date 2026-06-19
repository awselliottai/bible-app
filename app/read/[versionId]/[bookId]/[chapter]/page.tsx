import { notFound } from "next/navigation";
import { BibleReaderView } from "@/app/components/BibleReaderView";
import { getReaderData } from "@/app/lib/bible/reader";

export const dynamic = "force-dynamic";

type ReadChapterPageProps = {
  params: Promise<{
    versionId: string;
    bookId: string;
    chapter: string;
  }>;
};

export default async function ReadChapterPage({ params }: ReadChapterPageProps) {
  const { versionId, bookId, chapter } = await params;
  const chapterNumber = Number(chapter);

  if (!Number.isInteger(chapterNumber) || chapterNumber < 1) {
    console.log("[page:read-chapter] invalid chapter", versionId, bookId, chapter);
    notFound();
  }

  console.log("[page:read-chapter] rendering chapter", versionId, bookId, chapterNumber);
  const readerData = await getReaderData({
    versionId,
    bookId,
    chapter: chapterNumber,
  });

  return <BibleReaderView {...readerData} />;
}
