import { ThemeProvider } from "@/components/theme-provider";
import { ASSISTANT_NAME, PRODUCT_NAME } from "@/lib/brand";
import PostHogInit from "@/components/telemetry/PostHogInit";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: PRODUCT_NAME,
    template: `%s — ${PRODUCT_NAME}`,
  },
  description: `${PRODUCT_NAME} — all your docs. One brain. Powered by ${ASSISTANT_NAME}.`,
  applicationName: PRODUCT_NAME,
  icons: {
    icon: "/brand/favicon.png",
    shortcut: "/brand/favicon.png",
    apple: "/brand/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: PRODUCT_NAME,
    description: `${PRODUCT_NAME} — all your docs. One brain.`,
    images: [
      {
        url: "/brand/og.png",
        width: 1200,
        height: 630,
        alt: PRODUCT_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PRODUCT_NAME,
    description: `${PRODUCT_NAME} — all your docs. One brain.`,
    images: ["/brand/og.png"],
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
          {/* Client-only analytics init (must run globally) */}
          <PostHogInit />
        </ThemeProvider>
      </body>
    </html>
  );
}
