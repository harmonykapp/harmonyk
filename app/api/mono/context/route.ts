import { NextResponse } from "next/server";

import {
    getMonoContext,
    type MonoContextRequest,
} from "@/lib/mono-training";

type MonoContextRequestBody = {
  orgId?: unknown;
  query?: unknown;
  maxItems?: unknown;
};

function parseRequestBody(body: unknown): MonoContextRequest {
  if (body === null || typeof body !== "object") {
    throw new Error("Invalid JSON body");
  }

  const value = body as MonoContextRequestBody;

  const orgIdRaw = value.orgId;
  if (typeof orgIdRaw !== "string" || orgIdRaw.trim().length === 0) {
    throw new Error("orgId is required");
  }

  const queryRaw = value.query;
  const maxItemsRaw = value.maxItems;

  const request: MonoContextRequest = {
    orgId: orgIdRaw,
  };

  if (typeof queryRaw === "string" && queryRaw.trim().length > 0) {
    request.query = queryRaw;
  }

  if (typeof maxItemsRaw === "number" && Number.isFinite(maxItemsRaw)) {
    request.maxItems = maxItemsRaw;
  }

  return request;
}

export async function POST(request: Request) {
  let parsedBody: unknown;

  try {
    parsedBody = (await request.json()) as unknown;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid JSON in request body",
      },
      { status: 400 },
    );
  }

  let contextRequest: MonoContextRequest;
  try {
    contextRequest = parseRequestBody(parsedBody);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid request payload";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 400 },
    );
  }

  try {
    const result = await getMonoContext(contextRequest);

    return NextResponse.json(
      {
        ok: true,
        orgId: result.orgId,
        query: result.query,
        docs: result.docs,
        source: "stubbed-mono-training-library",
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get Maestro context";

    // Safe server-side log for now; can be wired into structured telemetry later.
    // eslint-disable-next-line no-console
    console.error("[mono-context] error resolving context", {
      message,
    });

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}

