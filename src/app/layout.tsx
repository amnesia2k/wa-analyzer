import { type Metadata } from "next";
import { Sofia_Sans } from "next/font/google";

import "./globals.css";
import { Suspense } from "react";
import { QueryProvider } from "./utils/query-provider";

export const metadata: Metadata = {
  title: "WhatsApp Chat Analyzer",
  description:
    "Analyze your WhatsApp chats and discover insights about your conversations",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const sofia = Sofia_Sans({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <QueryProvider>
      <html lang="en" className={`${sofia.className}`}>
        <body>
          <Suspense fallback={null}>{children}</Suspense>
        </body>
      </html>
    </QueryProvider>
  );
}
