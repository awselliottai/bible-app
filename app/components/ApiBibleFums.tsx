import Script from "next/script";

type ApiBibleFumsProps = {
  fumsJsInclude?: string;
  fumsJs?: string;
};

export function ApiBibleFums({ fumsJsInclude, fumsJs }: ApiBibleFumsProps) {
  if (!fumsJsInclude && !fumsJs) {
    return null;
  }

  const src = fumsJsInclude?.startsWith("http")
    ? fumsJsInclude
    : fumsJsInclude
      ? `https://${fumsJsInclude}`
      : undefined;

  return (
    <>
      {src ? <Script src={src} strategy="afterInteractive" /> : null}
      {fumsJs ? (
        <Script id="api-bible-fums" strategy="afterInteractive">
          {fumsJs}
        </Script>
      ) : null}
    </>
  );
}
