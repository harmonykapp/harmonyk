// Week 7 Day 4: Dev-only endpoint to test Playbook event wiring.
//
// POST /api/dev/playbooks/test-event
//
// Body:
// {
//   "type": "share_link_created" | "signature_completed",
//   "payload": { ...eventPayload }
// }
//
// Behaviour:
//  - Validates the type.
//  - Calls queuePlaybooksForEvent to exercise the event helper.
//  - Returns the helper result (count of enabled playbooks etc.)
//
// This is a DEV endpoint. Do not expose it in production UI.

import {
    queuePlaybooksForEvent,
    type PlaybookEventPayload,
    type PlaybookEventType,
} from "@/lib/playbooks/events";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json().catch(() => null)) as
            | {
                type?: string;
                payload?: PlaybookEventPayload;
            }
            | null;

        const type = body?.type as PlaybookEventType | undefined;
        const payload = (body?.payload ?? {}) as PlaybookEventPayload;

        const allowed: PlaybookEventType[] = [
            "share_link_created",
            "signature_completed",
        ];

        if (!type || !allowed.includes(type)) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "type is required and must be one of 'share_link_created' or 'signature_completed'",
                },
                { status: 400 },
            );
        }

        const result = await queuePlaybooksForEvent({
            type,
            payload,
        });

        return NextResponse.json(
            {
                ok: result.ok,
                message: result.message ?? null,
                count: result.count ?? 0,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("Error in POST /api/dev/playbooks/test-event:", error);
        return NextResponse.json(
            {
                ok: false,
                message: "UNEXPECTED_ERROR: Failed to process test event.",
            },
            { status: 500 },
        );
    }
}

