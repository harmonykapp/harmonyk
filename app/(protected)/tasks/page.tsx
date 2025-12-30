"use client";

import TaskReminders from "@/components/tasks/TaskReminders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
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
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
      {/* Heading + tagline */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Task Hub</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Schedule your important tasks, get reminders.
        </p>
      </div>

      {/* Top tabs (Overview / Calendar) */}
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
            <CardTitle className="text-lg font-semibold text-red-700 dark:text-red-300">
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

      <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{openTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{doneTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Finished tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{filteredTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{overdueTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Task</CardTitle>
          <CardDescription>Create a new task manually</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
          <Button onClick={createTask} disabled={!title.trim()} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </CardContent>
      </Card>

      <Card>
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
              <h3 className="text-lg font-semibold mb-2">
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