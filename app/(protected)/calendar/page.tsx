"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TaskSource = "activity" | "mono" | "manual";
type TaskStatus = "open" | "done";

type Task = {
  id: string;
  org_id: string;
  user_id: string | null;
  source: TaskSource;
  title: string;
  status: TaskStatus;
  due_at: string | null;
  doc_id: string | null;
  activity_id: string | null;
  created_at: string;
  updated_at: string;
};

type TaskResponse = {
  tasks: Task[];
};

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const diff = (day + 6) % 7; // make Monday = 0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDayLabel(date: Date, today: Date): string {
  const isToday = isSameDay(date, today);
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });

  if (isToday) {
    return `Today · ${weekday} ${day} ${month}`;
  }

  return `${weekday} ${day} ${month}`;
}

function formatWeekRange(start: Date): string {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const sameMonth = start.getMonth() === end.getMonth();

  const endLabel = end.toLocaleDateString("en-US", {
    month: sameMonth ? undefined : "short",
    day: "numeric",
  });

  return `${startLabel} – ${endLabel}`;
}

function formatTime(dateString: string | null): string | null {
  if (!dateString) return null;
  try {
    const d = new Date(dateString);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

export default function CalendarPage() {
  const { toast } = useToast();
  const [isReady, setIsReady] = useState(false);
  const [referenceDate, setReferenceDate] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsReady(true);
    setReferenceDate(new Date());
  }, []);

  useEffect(() => {
    if (!isReady) return;

    let cancelled = false;

    const loadTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        // Calendar is focused on upcoming work: only open tasks
        params.append("status", "open");
        params.append("limit", "200");

        const response = await fetch(`/api/tasks?${params.toString()}`);
        if (!response.ok) {
          let responseText = "";
          try {
            responseText = await response.text();
          } catch {
            // ignore
          }

          let errorData: { error?: string; details?: string; code?: string } = {};

          if (responseText) {
            try {
              errorData = JSON.parse(responseText);
            } catch {
              errorData = { error: responseText || `HTTP ${response.status}` };
            }
          }

          let errorMessage = errorData?.error || `Failed to load tasks (HTTP ${response.status})`;
          if (errorData?.details && errorData.details !== errorMessage) {
            errorMessage = `${errorMessage}: ${errorData.details}`;
          }

          setError(errorMessage);
          setTasks([]);

          const isTableNotFound =
            errorData?.code === "42P01" ||
            errorMessage.includes("table not found") ||
            errorMessage.includes("Tasks table not found");
          const isSchemaError =
            errorMessage.includes("column") && errorMessage.includes("does not exist");

          if (isTableNotFound || isSchemaError) {
            const issue = isSchemaError
              ? "Tasks table schema is outdated (missing columns)"
              : "Tasks table not found";
            console.warn(
              `[CalendarPage] ${issue}. ` +
                `Error: ${errorMessage}. ` +
                `Run migration: supabase/migrations/202511281030_tasks_org_scoped_v1.sql`,
            );
          } else {
            console.error("[CalendarPage] Failed to fetch tasks -", errorMessage);
          }

          return;
        }

        const data = (await response.json()) as TaskResponse;
        if (cancelled) return;
        setTasks(data.tasks || []);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const errorMessage = err instanceof Error ? err.message : "Failed to load tasks";
        setError(errorMessage);
        setTasks([]);
        console.error("[CalendarPage] Unexpected error loading tasks:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadTasks();

    return () => {
      cancelled = true;
    };
  }, [isReady]);

  const today = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => {
    if (!referenceDate) return startOfWeek(today);
    return startOfWeek(referenceDate);
  }, [referenceDate, today]);

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekStart]);

  const overdueTasks = useMemo(() => {
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    return tasks.filter((task) => {
      if (task.status !== "open" || !task.due_at) return false;
      const due = new Date(task.due_at);
      return due < todayStart;
    });
  }, [tasks, today]);

  const tasksByDay = useMemo(
    () =>
      weekDays.map((day) =>
        tasks.filter((task) => {
          if (!task.due_at) return false;
          const due = new Date(task.due_at);
          return isSameDay(due, day);
        }),
      ),
    [tasks, weekDays],
  );

  const hasAnyScheduled = tasksByDay.some((bucket) => bucket.length > 0);

  if (!isReady || !referenceDate) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto">
        <p className="text-sm text-muted-foreground">Loading calendar…</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
        <Link
          href="/tasks"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <LayoutDashboard className="h-4 w-4" />
          Overview
        </Link>
        <Link
          href="/calendar"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background text-foreground shadow-sm"
        >
          <CalendarIcon className="h-4 w-4" />
          Calendar
        </Link>
      </div>

      {/* Week controls + summary */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-sm sm:text-base">Week Overview</CardTitle>
            <CardDescription>
              {formatWeekRange(weekStart)} · {tasks.length} open task
              {tasks.length === 1 ? "" : "s"} with due dates
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const prev = new Date(weekStart);
                prev.setDate(prev.getDate() - 7);
                setReferenceDate(prev);
              }}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous week
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setReferenceDate(new Date());
              }}
            >
              This week
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const next = new Date(weekStart);
                next.setDate(next.getDate() + 7);
                setReferenceDate(next);
              }}
            >
              Next week
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Badge variant="outline">
              {overdueTasks.length} overdue task{overdueTasks.length === 1 ? "" : "s"}
            </Badge>
            {!loading && !error && (
              <Badge variant="outline">
                {hasAnyScheduled ? "Tasks scheduled this week" : "No tasks scheduled this week"}
              </Badge>
            )}
          </div>
          {overdueTasks.length > 0 && (
            <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-xs font-semibold text-destructive mb-1">Overdue tasks</p>
              <ul className="space-y-1">
                {overdueTasks.slice(0, 5).map((task) => (
                  <li key={task.id} className="text-xs text-destructive flex justify-between gap-2">
                    <span className="truncate">{task.title}</span>
                    <span className="shrink-0">
                      {task.due_at ? formatTime(task.due_at) ?? "" : ""}
                    </span>
                  </li>
                ))}
                {overdueTasks.length > 5 && (
                  <li className="text-xs text-destructive/80">
                    +{overdueTasks.length - 5} more overdue task
                    {overdueTasks.length - 5 === 1 ? "" : "s"}
                  </li>
                )}
              </ul>
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive mt-2">
              {error.includes("table not found") || error.includes("Tasks table not found")
                ? "The tasks table is missing. Please run the tasks migration, then refresh."
                : error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Week agenda */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {weekDays.map((day, index) => {
          const bucket = tasksByDay[index];
          const isToday = isSameDay(day, today);

          return (
            <Card
              key={day.toISOString()}
              className={cn(
                "flex flex-col",
                isToday && "border-primary/70 shadow-sm shadow-primary/10",
              )}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {formatDayLabel(day, today)}
                </CardTitle>
                <CardDescription>
                  {bucket.length === 0
                    ? "No tasks scheduled"
                    : `${bucket.length} task${bucket.length === 1 ? "" : "s"} scheduled`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {loading ? (
                  <p className="text-xs text-muted-foreground">Loading…</p>
                ) : bucket.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Use the Task Hub to add tasks with due dates and they&apos;ll appear here.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {bucket.map((task) => {
                      const timeLabel = formatTime(task.due_at);
                      return (
                        <li
                          key={task.id}
                          className="rounded border bg-card/50 px-3 py-2 text-xs flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium truncate">{task.title}</span>
                            {timeLabel && (
                              <span className="shrink-0 text-[11px] text-muted-foreground">
                                {timeLabel}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase tracking-wide"
                            >
                              {task.source}
                            </Badge>
                            {task.doc_id && (
                              <Link
                                href="/vault"
                                className="text-[11px] text-primary hover:underline"
                              >
                                View doc
                              </Link>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground">
        Tip: Use the{" "}
        <Link href="/tasks" className="underline underline-offset-2">
          Task Hub
        </Link>{" "}
        to toggle status, adjust due dates, or create new tasks. The calendar is a read-only
        agenda over your open tasks with due dates.
      </div>
    </div>
  );
}
