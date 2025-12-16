import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isRagEnabled } from "@/lib/feature-flags";

/**
 * Middleware guard for Maestro RAG dev endpoints.
 *
 * GA posture:
 * - All /api/mono/* routes that are RAG-related should be blocked unless
 *   MONO_RAG_ENABLED / NEXT_PUBLIC_MONO_RAG_ENABLED is explicitly true.
 * - This ensures GA tenants cannot accidentally hit dev-only RAG scaffolding.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Block Maestro RAG-related API routes unless RAG is explicitly enabled.
  if (pathname.startsWith("/api/mono/")) {
    if (!isRagEnabled()) {
      return NextResponse.json(
        {
          error:
            "Maestro RAG is disabled for this environment. This endpoint is dev-only until promoted post-GA.",
        },
        { status: 403 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Only intercept Maestro API routes (e.g. /api/mono/train, /api/mono/context).
   */
  matcher: ["/api/mono/:path*"],
};

