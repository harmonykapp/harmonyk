// app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AnalyticsInit from "./analytics"; // PostHog init (client-safe)
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Harmonyk - All your docs. One brain.",
  description: "Document-first business OS with AI assistance",
  /**
   * Favicon / app icons
   *
   * Next.js will generate the proper <link rel="icon"> tags from this.
   * The paths here are relative to /public, so "/favicon.png" resolves
   * to public/favicon.png.
   */
  icons: {
    icon: [
      { url: "/favicon.png", rel: "icon" },
      { url: "/favicon.png", rel: "shortcut icon" },
    ],
    apple: [
      { url: "/favicon.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          {/* Initializes PostHog if NEXT_PUBLIC_POSTHOG_KEY is set; no-ops otherwise */}
          <AnalyticsInit />
        </ThemeProvider>
      </body>
    </html>
  );
}
