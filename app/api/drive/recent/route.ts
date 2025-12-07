import { NextResponse } from "next/server";

export async function GET() {
    // Lightweight "recent drive files" placeholder so Workbench has a safe, GA-friendly default.
    const recent = [
        { id: "a1", name: "NDA (Mutual).docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", updated: "2025-11-05T12:20:00Z" },
        { id: "b2", name: "Founders Agreement.docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", updated: "2025-11-05T10:03:00Z" },
        { id: "c3", name: "Pitch Deck v3.pptx", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", updated: "2025-11-02T08:44:00Z" },
    ];
    return NextResponse.json({ items: recent });
}

