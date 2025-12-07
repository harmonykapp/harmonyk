import { createServerSupabaseClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const DEMO_OWNER_ID =
  process.env.NEXT_PUBLIC_DEMO_OWNER_ID ?? "00000000-0000-0000-0000-000000000000";

interface Task {
  id: string;
  org_id: string;
  user_id: string | null;
  source: "activity" | "mono" | "manual";
  title: string;
  status: "open" | "done";
  due_at: string | null;
  doc_id: string | null;
  activity_id: string | null;
  created_at: string;
  updated_at: string;
}

async function getUserAndOrg(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  req: NextRequest
) {
  let userId: string | null = DEMO_OWNER_ID;
  let orgId: string | null = null;

  // Try to get user from auth session via cookies
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = supabaseUrl?.match(/https?:\/\/([^.]+)\./)?.[1] || "default";
  const authCookieName = `sb-${projectRef}-auth-token`;

  const authCookie = cookieStore.get(authCookieName);
  if (authCookie?.value) {
    try {
      const session = JSON.parse(authCookie.value);
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch {
      // Ignore parse errors, fall back to demo user
    }
  }

  // Get user's first org membership, or create a default org
  if (userId && userId !== DEMO_OWNER_ID) {
    const { data: memberships } = await supabase
      .from("member")
      .select("org_id")
      .eq("user_id", userId)
      .limit(1);

    if (memberships && memberships.length > 0) {
      orgId = memberships[0].org_id;
    } else {
      // Create a default org for the user if none exists
      const { data: defaultOrg, error: orgError } = await supabase
        .from("org")
        .insert({
          name: "My Workspace",
          plan: "free",
        })
        .select("id")
        .single();

      if (!orgError && defaultOrg) {
        orgId = defaultOrg.id;
        await supabase.from("member").insert({
          org_id: orgId,
          user_id: userId,
          role: "owner",
        });
      }
    }
  }

  // For demo user, try to get or create a demo org
  if (!orgId) {
    const { data: demoOrgs } = await supabase
      .from("org")
      .select("id")
      .eq("name", "Demo Workspace")
      .limit(1);

    if (demoOrgs && demoOrgs.length > 0) {
      orgId = demoOrgs[0].id;
    } else {
      const { data: demoOrg } = await supabase
        .from("org")
        .insert({
          name: "Demo Workspace",
          plan: "free",
        })
        .select("id")
        .single();

      if (demoOrg) {
        orgId = demoOrg.id;
      }
    }
  }

  return { userId, orgId };
}

// GET /api/tasks - List tasks with filters
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { orgId } = await getUserAndOrg(supabase, req);

    if (!orgId) {
      return NextResponse.json({ error: "Organization not found." }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    let query = supabase
      .from("tasks")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && (status === "open" || status === "done")) {
      query = query.eq("status", status);
    }

    if (source && (source === "activity" || source === "mono" || source === "manual")) {
      query = query.eq("source", source);
    }

    const { data: tasks, error } = await query;

    if (error) {
      // Log error details
      console.error("[api/tasks] Database error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        orgId,
      });

      // Check if table doesn't exist
      if (error.code === "42P01") {
        return NextResponse.json(
          {
            error: "Tasks table not found. Please run the database migration.",
            details: error.message,
            code: error.code,
          },
          { status: 500 }
        );
      }

      // Check if column doesn't exist (schema mismatch)
      if (error.code === "42703" || (error.message && error.message.includes("column") && error.message.includes("does not exist"))) {
        return NextResponse.json(
          {
            error: "Tasks table schema is outdated. Please run the database migration.",
            details: error.message,
            code: error.code,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to fetch tasks",
          details: error.message || "Database error",
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ tasks: tasks || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch tasks";
    console.error("[api/tasks] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch tasks",
        details: message,
      },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(req: NextRequest) {
  try {
    // 1) Parse and validate body
    const body = (await req.json()) as {
      title: string;
      source?: "activity" | "mono" | "manual";
      status?: "open" | "done";
      due_at?: string | null;
      doc_id?: string | null;
      activity_id?: string | null;
    };

    // Basic title validation
    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "Missing or invalid title" }, { status: 400 });
    }

    // 2) Resolve user + org context
    const supabase = createServerSupabaseClient();
    const { userId, orgId } = await getUserAndOrg(supabase, req);

    if (!orgId) {
      return NextResponse.json({ error: "Organization not found." }, { status: 400 });
    }

    // 3) Validate enums
    const source = body.source || "manual";
    if (source !== "activity" && source !== "mono" && source !== "manual") {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }

    const status = body.status || "open";
    if (status !== "open" && status !== "done") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const dueAt = body.due_at ? new Date(body.due_at).toISOString() : null;
    const nowIso = new Date().toISOString();

    // 4) Build a task payload that we can reuse for:
    //    - Demo / non-production stub responses (no DB write)
    //    - Production DB insert
    const demoId =
      typeof crypto !== "undefined" &&
      "randomUUID" in crypto &&
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `demo-task-${Date.now()}`;

    const baseTask: Task = {
      id: demoId,
      org_id: orgId,
      user_id: userId,
      source,
      title: body.title.trim(),
      status,
      due_at: dueAt,
      doc_id: body.doc_id ?? null,
      activity_id: body.activity_id ?? null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    // 5) Non-production behaviour:
    //    For local dev / preview environments we DO NOT require the "tasks"
    //    table to exist. Instead we:
    //      - Return a demo task
    //      - Let the Tasks UI manage state locally
    //
    //    This keeps Week 20 GA-safe without forcing new migrations.
    if (process.env.NODE_ENV !== "production") {
      console.warn("[api/tasks] Returning demo task in non-production; no DB write performed.", {
        orgId,
        userId,
        source,
      });

      return NextResponse.json({ task: baseTask }, { status: 201 });
    }

    // 6) Production behaviour:
    //    In production we expect a real "tasks" table and write to it.
    const { data: task, error: insertError } = await supabase
      .from("tasks")
      .insert({
        org_id: orgId,
        user_id: userId,
        source,
        title: body.title.trim(),
        status,
        due_at: dueAt,
        doc_id: body.doc_id || null,
        activity_id: body.activity_id || null,
      })
      .select("*")
      .single();

    if (insertError || !task) {
      // Log full error details for ops
      console.error("[api/tasks] Failed to insert task:", {
        orgId,
        userId,
        source,
        status,
        dueAt,
        code: insertError?.code,
        message: insertError?.message,
        details: insertError?.details,
        hint: insertError?.hint,
      });

      // Table missing
      if (insertError?.code === "42P01") {
        return NextResponse.json(
          {
            error: "Tasks table not found. Please run the database migration.",
            details: insertError.message,
            code: insertError.code,
          },
          { status: 500 },
        );
      }

      // Column missing / schema mismatch
      if (
        insertError?.code === "42703" ||
        (insertError?.message &&
          insertError.message.includes("column") &&
          insertError.message.includes("does not exist"))
      ) {
        return NextResponse.json(
          {
            error: "Tasks table schema is outdated. Please run the database migration.",
            details: insertError.message,
            code: insertError.code,
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { error: "Failed to create task", details: insertError?.message ?? "Unknown error" },
        { status: 500 },
      );
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create task";
    console.error("[api/tasks] Unexpected error in POST /api/tasks/create:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/tasks - Update task (requires task ID in body)
export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      id: string;
      status?: "open" | "done";
      due_at?: string | null;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Missing task id" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { orgId } = await getUserAndOrg(supabase, req);

    if (!orgId) {
      return NextResponse.json({ error: "Organization not found." }, { status: 400 });
    }

    // Verify task belongs to org
    const { data: existingTask, error: fetchError } = await supabase
      .from("tasks")
      .select("id")
      .eq("id", body.id)
      .eq("org_id", orgId)
      .single();

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updates: Partial<Task> = {};

    if (body.status !== undefined) {
      if (body.status !== "open" && body.status !== "done") {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = body.status;
    }

    if (body.due_at !== undefined) {
      updates.due_at = body.due_at ? new Date(body.due_at).toISOString() : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", body.id)
      .eq("org_id", orgId)
      .select()
      .single();

    if (updateError || !updatedTask) {
      return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

