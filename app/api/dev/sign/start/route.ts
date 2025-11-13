import { NextResponse } from "next/server";

type SignStartRequest = {
  docId: string;
};

type SignStartResponse = {
  url: string;
};

function buildUrl(docId: string): string {
  const encoded = encodeURIComponent(docId);
  return `/sign/${encoded}?mock=true`;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    typeof (payload as SignStartRequest).docId !== "string" ||
    (payload as SignStartRequest).docId.trim().length === 0
  ) {
    return NextResponse.json({ error: "docId is required" }, { status: 400 });
  }

  const docId = (payload as SignStartRequest).docId.trim();
  const body: SignStartResponse = {
    url: buildUrl(docId),
  };

  return NextResponse.json(body, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

