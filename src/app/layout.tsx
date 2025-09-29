import { type Metadata } from "next";
import { Sofia_Sans } from "next/font/google";

import "./globals.css";
import { Suspense } from "react";
import { QueryProvider } from "./utils/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

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
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster richColors closeButton position="top-center" />
            <Suspense fallback={null}>{children}</Suspense>
          </ThemeProvider>
        </body>
      </html>
    </QueryProvider>
  );
}
