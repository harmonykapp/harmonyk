"use server";

import { createDocumensoEnvelope } from "@/lib/signing/documenso";
import { supabaseServer } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

type SendSignatureArgs = {
    docId: string;
    email: string;
    userId: string;
};

type SendSignatureSuccess = {
    ok: true;
    envelopeId: string;
    shareUrl: string;
};

type SendSignatureFailure = {
    ok: false;
    error: string;
};

type SendSignatureResult = SendSignatureSuccess | SendSignatureFailure;

// Server action: fetch latest version, call Documenso, and surface typed result.
export async function sendDocumensoEnvelope(args: SendSignatureArgs): Promise<SendSignatureResult> {
    if (!args.docId || !args.email || !args.userId) {
        return { ok: false, error: "Missing required fields." };
    }

    const supabase = supabaseServer();

    const { data: document, error: docError } = await supabase
        .from("documents")
        .select("id, title")
        .eq("id", args.docId)
        .eq("owner_id", args.userId) // ensure caller can only send their own docs
        .maybeSingle();

    if (docError || !document) {
        return { ok: false, error: docError?.message ?? "Document not found." };
    }

    const { data: version, error: versionError } = await supabase
        .from("versions")
        .select("number, content_url")
        .eq("doc_id", args.docId)
        .order("number", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (versionError || !version?.content_url) {
        return { ok: false, error: versionError?.message ?? "No available document content." };
    }

    const envelope = await createDocumensoEnvelope({
        title: document.title,
        bodyPath: version.content_url,
        recipients: [{ email: args.email }],
    });

    if (!envelope.ok) {
        return { ok: false, error: envelope.error };
    }

    revalidatePath("/signatures");
    return { ok: true, envelopeId: envelope.envelopeId, shareUrl: envelope.shareUrl };
}

