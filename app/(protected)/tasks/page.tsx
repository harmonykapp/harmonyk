"use client";

import TaskReminders from "@/components/tasks/TaskReminders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { WidgetCard } from "@/components/widgets/WidgetCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CheckSquare,
  Clock,
  FileText,
  Filter,
  LayoutDashboard,
  Plus
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Task = {
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
};

type TaskResponse = {
  tasks: Task[];
};

type CreateTaskResponse = {
  task?: Task;
};

export default function TasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "done">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "activity" | "mono" | "manual">("all");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (sourceFilter !== "all") {
        params.append("source", sourceFilter);
      }

      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (!response.ok) {
        // Try to get the response text first
        let responseText = "";
        try {
          responseText = await response.text();
        } catch (e) {
          // Silently handle response read errors
        }

        let errorData: { error?: string; details?: string; code?: string } = {};
        if (responseText) {
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = { error: responseText || `HTTP ${response.status}` };
          }
        }

        // Build comprehensive error message
        let errorMessage = errorData?.error || `Failed to load tasks (HTTP ${response.status})`;
        if (errorData?.details && errorData.details !== errorMessage) {
          errorMessage = `${errorMessage}: ${errorData.details}`;
        }

        // Set error state instead of throwing
        setError(errorMessage);
        setTasks([]);

        // Check if it's a table-not-found or schema mismatch error
        const isTableNotFound = errorData?.code === "42P01" ||
          errorMessage.includes("table not found") ||
          errorMessage.includes("Tasks table not found");
        const isSchemaError = errorMessage.includes("column") && errorMessage.includes("does not exist");

        // For table/schema errors, use console.warn with helpful migration message
        if (isTableNotFound || isSchemaError) {
          const issue = isSchemaError
            ? "Tasks table schema is outdated (missing columns)"
            : "Tasks table not found";
          console.warn(
            `[TasksPage] ${issue}. ` +
            `Error: ${errorMessage}. ` +
            `Run migration: supabase/migrations/202511281030_tasks_org_scoped_v1.sql`
          );
        } else {
          // Log other errors as string-based message to avoid serialization issues
          const logParts: string[] = [
            `Status: ${response.status}`,
            `Error: ${errorMessage}`,
          ];
          if (errorData?.code) logParts.push(`Code: ${errorData.code}`);
          if (errorData?.details && errorData.details !== errorMessage) {
            logParts.push(`Details: ${errorData.details}`);
          }
          console.error("[TasksPage] Failed to fetch tasks - " + logParts.join(", "));
        }

        return;
      }

      const data = (await response.json()) as TaskResponse;
      setTasks(data.tasks || []);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load tasks";
      setError(errorMessage);
      setTasks([]);
      console.error("[TasksPage] Unexpected error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sourceFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function createTask() {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task title",
        variant: "destructive",
      });
      return;
    }

    let createdTask: Task | null = null;

    try {
      const dueAt = dueDate ? new Date(dueDate).toISOString() : null;
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          source: "manual",
          status: "open",
          due_at: dueAt,
        }),
      });

      if (!response.ok) {
        let responseText = "";
        try {
          responseText = await response.text();
        } catch (e) {
          console.error("[TasksPage] Failed to read create task response:", e);
        }

        let errorData: { error?: string; details?: string; code?: string } = {};
        if (responseText) {
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = { error: responseText || `HTTP ${response.status}: ${response.statusText}` };
          }
        }

        const errorMessage = errorData?.error || `Failed to create task (HTTP ${response.status})`;

        console.error("[TasksPage] Failed to create task:");
        console.error("  Status:", response.status);
        console.error("  StatusText:", response.statusText);
        console.error("  Error:", errorMessage);
        console.error("  Details:", errorData?.details || "none");
        console.error("  RawResponse:", responseText.substring(0, 200) || "(empty)");

        throw new Error(errorMessage);
      }

      // Try to parse the created task from the response
      try {
        const data = (await response.json()) as CreateTaskResponse | null;
        if (data && data.task) {
          createdTask = data.task;
        }
      } catch (parseError) {
        console.error("[TasksPage] Failed to parse create task response JSON:", parseError);
      }

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      // Reset form inputs
      setTitle("");
      setDueDate("");

      // If we successfully parsed a task from the response, prepend it into local state.
      // This keeps dev/demo environments working even if the API is stubbed or the
      // tasks table is missing, and avoids a hard dependency on the GET endpoint.
      if (createdTask) {
        setTasks((prev) => [createdTask as Task, ...prev]);
      } else {
        // Fallback: if for some reason we couldn't parse the created task,
        // reload from the API. In dev/demo this may still be empty, but in
        // a real environment it will reflect the DB state.
        await loadTasks();
      }
    } catch (error) {
      console.error("Failed to create task:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task",
        variant: "destructive",
      });
    }
  }

  async function updateTaskStatus(taskId: string, newStatus: "open" | "done") {
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Failed to update task");
      }

      await loadTasks();
    } catch (error) {
      console.error("Failed to update task:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update task",
        variant: "destructive",
      });
    }
  }

  async function updateTaskDueDate(taskId: string, newDueDate: string | null) {
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          due_at: newDueDate,
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Failed to update task");
      }

      await loadTasks();
    } catch (error) {
      console.error("Failed to update task:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update task",
        variant: "destructive",
      });
    }
  }

  const filteredTasks = useMemo(() => {
    return tasks;
  }, [tasks]);

  const openTasks = filteredTasks.filter((t) => t.status === "open");
  const doneTasks = filteredTasks.filter((t) => t.status === "done");
  const overdueTasks = openTasks.filter((t) => {
    if (!t.due_at) return false;
    return new Date(t.due_at) < new Date();
  });

  const dueTodayTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return openTasks.filter((t) => {
      if (!t.due_at) return false;
      const due = new Date(t.due_at);
      return due >= today && due < tomorrow;
    });
  }, [openTasks]);

  const completedLast7Days = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return doneTasks.filter((t) => {
      const updated = new Date(t.updated_at);
      return updated >= sevenDaysAgo;
    });
  }, [doneTasks]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    return openTasks
      .filter((t) => t.due_at && new Date(t.due_at) > now)
      .sort((a, b) => {
        if (!a.due_at) return 1;
        if (!b.due_at) return -1;
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      })
      .slice(0, 5);
  }, [openTasks]);

  const waitingBlockedTasks = useMemo(() => {
    return openTasks
      .filter((t) =>
        t.title.toLowerCase().includes("waiting") ||
        t.title.toLowerCase().includes("blocked") ||
        t.title.toLowerCase().includes("pending")
      )
      .slice(0, 5);
  }, [openTasks]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };

  const sourceLabels: Record<Task["source"], string> = {
    activity: "Activity",
    mono: "Maestro",
    manual: "Manual",
  };

  const sourceColors: Record<Task["source"], string> = {
    activity: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    mono: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
    manual: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto space-y-6">
      <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
        <a
          href="/tasks"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background text-foreground shadow-sm"
        >
          <LayoutDashboard className="h-4 w-4" />
          Overview
        </a>
        <a
          href="/calendar"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Calendar className="h-4 w-4" />
          Calendar
        </a>
      </div>

      {!error && <TaskReminders />}

      {error && (
        <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-red-700 dark:text-red-300">
              Unable to Load Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              {error.includes("table not found") || error.includes("Tasks table not found")
                ? "The tasks database table hasn't been created yet. Please run the database migration first."
                : error.includes("schema is outdated") || error.includes("column") && error.includes("does not exist")
                  ? "The tasks table exists but has an outdated schema. Please run the database migration to update it."
                  : error}
            </p>
            {(error.includes("table not found") ||
              error.includes("Tasks table not found") ||
              error.includes("schema is outdated") ||
              (error.includes("column") && error.includes("does not exist"))) ? (
              <div className="space-y-2">
                <p className="text-xs text-red-600 dark:text-red-400 font-mono bg-red-100 dark:bg-red-950/50 p-2 rounded">
                  Migration file: supabase/migrations/202511281030_tasks_org_scoped_v1.sql
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Note: This migration will drop and recreate the tasks table if it exists.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTasks()}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadTasks()}
                className="mt-2"
              >
                Retry
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Row 1: Four S KPI cards (150px height) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-3" style={{ height: "150px" }}>
          <WidgetCard title="Open" className="h-full">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-2xl font-semibold tracking-tight">{openTasks.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Pending tasks</div>
            </div>
          </WidgetCard>
        </div>
        <div className="md:col-span-3" style={{ height: "150px" }}>
          <WidgetCard title="Due Today" className="h-full">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-2xl font-semibold tracking-tight">{dueTodayTasks.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Tasks due today</div>
            </div>
          </WidgetCard>
        </div>
        <div className="md:col-span-3" style={{ height: "150px" }}>
          <WidgetCard title="Overdue" className="h-full">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-2xl font-semibold tracking-tight">{overdueTasks.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Requires attention</div>
            </div>
          </WidgetCard>
        </div>
        <div className="md:col-span-3" style={{ height: "150px" }}>
          <WidgetCard title="Completed (7d)" className="h-full">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-2xl font-semibold tracking-tight">{completedLast7Days.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Last 7 days</div>
            </div>
          </WidgetCard>
        </div>
      </div>

      {/* Row 2: L + M + M widgets (280px height) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6" style={{ height: "280px" }}>
          <WidgetCard title="My Focus Today" subtitle="Top 5 priority tasks" footer={<button className="text-xs hover:underline">View all →</button>}>
            <div className="space-y-2">
              {openTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-start justify-between gap-2 p-2 rounded border border-border/40">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{task.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {task.due_at ? formatDate(task.due_at) : "No due date"}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{sourceLabels[task.source]}</Badge>
                </div>
              ))}
              {openTasks.length === 0 && (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No open tasks
                </div>
              )}
            </div>
          </WidgetCard>
        </div>

        <div className="md:col-span-3" style={{ height: "280px" }}>
          <WidgetCard title="Upcoming Deadlines" subtitle="Next 5 due" footer={<button className="text-xs hover:underline">View all →</button>}>
            <div className="space-y-2">
              {upcomingDeadlines.map((task) => (
                <div key={task.id} className="p-2 rounded border border-border/40">
                  <div className="text-sm font-medium truncate">{task.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {task.due_at ? formatDate(task.due_at) : "—"}
                  </div>
                </div>
              ))}
              {upcomingDeadlines.length === 0 && (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No upcoming deadlines
                </div>
              )}
            </div>
          </WidgetCard>
        </div>

        <div className="md:col-span-3" style={{ height: "280px" }}>
          <WidgetCard title="Waiting/Blocked" subtitle="Pending items" footer={<button className="text-xs hover:underline">View all →</button>}>
            <div className="space-y-2">
              {waitingBlockedTasks.map((task) => (
                <div key={task.id} className="p-2 rounded border border-border/40">
                  <div className="text-sm font-medium truncate">{task.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {task.source ? sourceLabels[task.source] : "—"}
                  </div>
                </div>
              ))}
              {waitingBlockedTasks.length === 0 && (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No blocked tasks
                </div>
              )}
            </div>
          </WidgetCard>
        </div>
      </div>

      {/* Row 3: L completion trend + Add Task form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6" style={{ height: "280px" }}>
          <WidgetCard title="Completion Trend" subtitle="Last 14 days">
            <div className="h-full flex items-end justify-between gap-1 pb-4">
              {(() => {
                const days = Array.from({ length: 14 }, (_, i) => {
                  const dayStart = Date.now() - (13 - i) * 24 * 60 * 60 * 1000;
                  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
                  const count = doneTasks.filter((t) => {
                    const updated = new Date(t.updated_at).getTime();
                    return updated >= dayStart && updated < dayEnd;
                  }).length;
                  return count;
                });
                const maxCount = Math.max(...days, 1);

                return days.map((count, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-emerald-400/40 rounded-t"
                      style={{ height: `${(count / maxCount) * 140}px`, minHeight: count > 0 ? "4px" : "0" }}
                    />
                  </div>
                ));
              })()}
            </div>
          </WidgetCard>
        </div>

        <div className="md:col-span-6" style={{ height: "280px" }}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Add New Task</CardTitle>
              <CardDescription className="text-xs">Create a new task manually</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Task Title</label>
                <Input
                  placeholder="Task title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      createTask();
                    }
                  }}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date (optional)</label>
                <Input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button onClick={createTask} disabled={!title.trim()} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tasks Table */}
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>
                {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""} total
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as typeof sourceFilter)}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="mono">Maestro</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading tasks...
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {error.includes("table not found") || error.includes("Tasks table not found")
                  ? "Please run the database migration to create the tasks table."
                  : "Unable to load tasks. Please try again."}
              </p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-base font-semibold mb-2">
                {statusFilter === "done" ? "No completed tasks yet" : "No tasks yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter === "done"
                  ? "Complete some tasks to see them here."
                  : "Create your first task to get started."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <span className="sr-only">Status</span>
                    </TableHead>
                    <TableHead className="min-w-[200px]">Title</TableHead>
                    <TableHead className="min-w-[100px]">Source</TableHead>
                    <TableHead className="min-w-[80px]">Status</TableHead>
                    <TableHead className="min-w-[140px]">Due Date</TableHead>
                    <TableHead className="min-w-[120px]">Related Doc</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => {
                    const isOverdue =
                      task.status === "open" &&
                      task.due_at &&
                      new Date(task.due_at) < new Date();

                    return (
                      <TableRow
                        key={task.id}
                        className={cn(
                          task.status === "done" && "opacity-60",
                          isOverdue && "bg-red-50 dark:bg-red-950/20"
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            checked={task.status === "done"}
                            aria-label={
                              task.status === "done"
                                ? `Mark task "${task.title}" as open`
                                : `Mark task "${task.title}" as done`
                            }
                            onCheckedChange={(checked) => {
                              updateTaskStatus(task.id, checked ? "done" : "open");
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-medium",
                                task.status === "done" && "line-through text-muted-foreground"
                              )}
                            >
                              {task.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn("capitalize", sourceColors[task.source])}
                          >
                            {sourceLabels[task.source]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={task.status === "done" ? "secondary" : "default"}
                            className="capitalize"
                          >
                            {task.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {task.due_at ? (
                              <>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span
                                  className={cn(
                                    isOverdue && "text-red-600 dark:text-red-400 font-medium"
                                  )}
                                >
                                  {formatDate(task.due_at)}
                                </span>
                                {isOverdue && (
                                  <Badge variant="destructive" className="text-xs">
                                    Overdue
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground text-sm">No due date</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {task.doc_id ? (
                            <Link
                              href={`/vault`}
                              className="flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              View Doc
                            </Link>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newDueDate = prompt(
                                  "Enter new due date (YYYY-MM-DDTHH:mm) or leave empty to clear:",
                                  task.due_at
                                    ? new Date(task.due_at).toISOString().slice(0, 16)
                                    : ""
                                );
                                if (newDueDate !== null) {
                                  updateTaskDueDate(
                                    task.id,
                                    newDueDate.trim() ? newDueDate.trim() : null
                                  );
                                }
                              }}
                              title="Change due date"
                              aria-label={
                                task.due_at
                                  ? `Change due date for "${task.title}"`
                                  : `Set due date for "${task.title}"`
                              }
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}