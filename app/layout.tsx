import type { Metadata } from "next";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bible",
  description: "Read, search, and navigate scripture by version, book, and chapter.",
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
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
