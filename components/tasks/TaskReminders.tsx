"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, Calendar, CheckSquare, Clock, FileText } from "lucide-react";
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

export default function TaskReminders() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadReminders = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/tasks?status=open");
      if (!response.ok) {
        // Silently handle errors - don't log or throw
        // The main TasksPage will show the error message
        setError(true);
        setTasks([]);
        return;
      }

      const data = (await response.json()) as TaskResponse;
      const allTasks = data.tasks || [];

      // Filter for tasks where due_at <= today and status = open
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      const reminders = allTasks.filter((task) => {
        if (!task.due_at || task.status !== "open") return false;
        const dueDate = new Date(task.due_at);
        return dueDate <= today;
      });

      // Sort by due date (overdue first, then due today)
      reminders.sort((a, b) => {
        if (!a.due_at || !b.due_at) return 0;
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      });

      setTasks(reminders.slice(0, 5)); // Show max 5 reminders
      setError(false);
    } catch (error) {
      // Silently handle errors - don't spam console
      setError(true);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const overdueTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((task) => {
      if (!task.due_at) return false;
      return new Date(task.due_at) < now;
    });
  }, [tasks]);

  const dueTodayTasks = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter((task) => {
      if (!task.due_at) return false;
      const dueDate = new Date(task.due_at);
      return dueDate >= today && dueDate < tomorrow;
    });
  }, [tasks]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (dueDate.getTime() === today.getTime()) {
        return "Today";
      }

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <section className="rounded-2xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">Reminders</h3>
        </div>
        <div className="text-sm opacity-70">Loading…</div>
      </section>
    );
  }

  if (error || tasks.length === 0) {
    // Silently return null if there's an error - don't show error state here
    // The main TasksPage will show the error message
    return null;
  }

  return (
    <section className="rounded-2xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">Reminders</h3>
        <Badge variant={overdueTasks.length > 0 ? "destructive" : "secondary"} className="text-xs">
          {overdueTasks.length > 0
            ? `${overdueTasks.length} overdue`
            : `${dueTodayTasks.length} due today`}
        </Badge>
      </div>

      <ul className="space-y-2">
        {tasks.map((task) => {
          const isOverdue = task.due_at && new Date(task.due_at) < new Date();
          const formattedDate = formatDate(task.due_at);

          return (
            <li
              key={task.id}
              className={cn(
                "flex items-start gap-3 rounded border p-3",
                isOverdue && "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
              )}
            >
              {isOverdue ? (
                <AlertCircle className="h-4 w-4 mt-0.5 text-red-600 dark:text-red-400 flex-shrink-0" />
              ) : (
                <Clock className="h-4 w-4 mt-0.5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "text-xs flex items-center gap-1",
                      isOverdue
                        ? "text-red-600 dark:text-red-400 font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    <Calendar className="h-3 w-3" />
                    {formattedDate}
                  </span>
                  {task.doc_id && (
                    <Link
                      href="/vault"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3" />
                      View Doc
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-3">
        <Link href="/tasks">
          <Button variant="outline" size="sm" className="w-full">
            <CheckSquare className="h-4 w-4 mr-2" />
            View All Tasks
          </Button>
        </Link>
      </div>
    </section>
  );
}

