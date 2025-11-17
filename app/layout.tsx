// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnalyticsInit from "./analytics"; // PostHog init (client-safe)
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monolyth",
  description: "Unified AI document platform",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const bodyClass = [
    "min-h-screen",
    "bg-slate-50",
    "text-slate-900",
    "dark:bg-slate-950",
    "dark:text-slate-100",
    geistSans.variable,
    geistMono.variable,
  ].join(" ");

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClass}>
        <ThemeProvider>
          {children}
          {/* Initializes PostHog if NEXT_PUBLIC_POSTHOG_KEY is set; no-ops otherwise */}
          <AnalyticsInit />
        </ThemeProvider>
      </body>
    </html>
  );
}
