import { BibleReaderView } from "@/app/components/BibleReaderView";
import { getReaderData } from "@/app/lib/bible/reader";

export const dynamic = "force-dynamic";

export default async function Home() {
  console.log("[page:home] rendering live Bible reader");
  const readerData = await getReaderData();

  return <BibleReaderView {...readerData} />;
}
