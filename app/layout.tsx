// app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PRODUCT_NAME } from "@/lib/brand";
import AnalyticsInit from "./analytics"; // PostHog init (client-safe)
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: PRODUCT_NAME,
    template: `%s · ${PRODUCT_NAME}`,
  },
  applicationName: PRODUCT_NAME,
  icons: {
    // NOTE: browsers still prefer /favicon.ico at the web root.
    // Keep /public/favicon.ico in sync with /public/brand/favicon.ico.
    // Currently using /favicon.png until .ico files are available.
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
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
