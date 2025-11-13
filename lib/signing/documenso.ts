"use server";

import fs from "fs/promises";
import path from "path";

const DOCUMENSO_BASE_URL = process.env.DOCUMENSO_API_URL ?? "";
const DOCUMENSO_API_KEY = process.env.DOCUMENSO_API_KEY ?? "";
const DOCUMENSO_TEAM_ID = process.env.DOCUMENSO_TEAM_ID ?? "";

type EnvelopeRecipient = {
    email: string;
    name?: string;
    signerOrder?: number;
};

type SupportedDocFormat = "markdown" | "html";

export type CreateEnvelopeArgs = {
    title: string;
    bodyPath: string;
    recipients: EnvelopeRecipient[];
};

export type CreateEnvelopeResult =
    | { ok: true; envelopeId: string; shareUrl: string }
    | { ok: false; error: string };

// Wraps Documenso API with config checks + file loading (North Star).
export async function createDocumensoEnvelope(args: CreateEnvelopeArgs): Promise<CreateEnvelopeResult> {
    if (!DOCUMENSO_BASE_URL || !DOCUMENSO_API_KEY || !DOCUMENSO_TEAM_ID) {
        return { ok: false, error: "Documenso not configured." };
    }

    const body = await loadDocumentBody(args.bodyPath);
    if (!body) {
        return { ok: false, error: "Document content not found." };
    }

    const payload = {
        name: args.title,
        team_id: DOCUMENSO_TEAM_ID,
        recipients: args.recipients.map((recipient) => ({
            email: recipient.email,
            name: recipient.name ?? recipient.email,
            signer_order: recipient.signerOrder ?? 1,
            role: "signer",
        })),
        documents: [
            {
                title: args.title,
                content: body.content,
                format: body.format,
            },
        ],
    };

    try {
        const res = await fetch(`${DOCUMENSO_BASE_URL}/api/v1/envelopes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${DOCUMENSO_API_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const text = await res.text();
            return { ok: false, error: `Documenso error (${res.status}): ${text}` };
        }

        const data = (await res.json()) as { id: string; share_url: string };
        return { ok: true, envelopeId: data.id, shareUrl: data.share_url };
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Documenso request failed." };
    }
}

// Loads doc body from /public and infers format for Documenso.
async function loadDocumentBody(relativePath: string): Promise<{ content: string; format: SupportedDocFormat } | null> {
    const normalized = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
    const absolutePath = path.join(process.cwd(), "public", normalized);

    try {
        const file = await fs.readFile(absolutePath, "utf8");
        const ext = path.extname(normalized).toLowerCase();
        const format: SupportedDocFormat = ext === ".html" ? "html" : "markdown";
        return { content: file, format };
    } catch {
        return null;
    }
}

