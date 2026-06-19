import type { Metadata, Viewport } from "next";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bible",
  description: "Read, search, and navigate scripture by version, book, and chapter.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f3eb" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1210" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-theme="dark">
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme-mode');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){}",
          }}
        />
        <a className="skip-link" href="#reader-content">
          Skip to scripture
        </a>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
