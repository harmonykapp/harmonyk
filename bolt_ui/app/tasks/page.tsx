'use client';

import { useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckSquare,
  Plus,
  Calendar,
  User,
  FileText,
  Filter,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tasks = [
  {
    id: '1',
    title: 'Review Partnership Agreement with Acme Corp',
    status: 'in-progress',
    priority: 'high',
    dueDate: 'Today',
    assignee: 'You',
    document: 'Acme Corp Partnership Agreement',
    completed: false,
  },
  {
    id: '2',
    title: 'Send NDA to CloudSystems for signature',
    status: 'todo',
    priority: 'high',
    dueDate: 'Tomorrow',
    assignee: 'You',
    document: 'CloudSystems Vendor NDA',
    completed: false,
  },
  {
    id: '3',
    title: 'Update employee handbook with new policies',
    status: 'in-progress',
    priority: 'medium',
    dueDate: 'Nov 25',
    assignee: 'Sarah Chen',
    document: 'Employee Handbook 2024',
    completed: false,
  },
  {
    id: '4',
    title: 'Finalize Q4 financial report',
    status: 'todo',
    priority: 'high',
    dueDate: 'Nov 22',
    assignee: 'Mike Johnson',
    document: 'Q4 Financial Report',
    completed: false,
  },
  {
    id: '5',
    title: 'Archive outdated vendor contracts',
    status: 'todo',
    priority: 'low',
    dueDate: 'Nov 30',
    assignee: 'Lisa Wong',
    document: null,
    completed: false,
  },
  {
    id: '6',
    title: 'Review and approve sales proposal',
    status: 'completed',
    priority: 'medium',
    dueDate: 'Nov 18',
    assignee: 'You',
    document: 'Sales Proposal - TechStart Inc',
    completed: true,
  },
];

const priorityColors = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
};

export default function TasksPage() {
  const [taskList, setTaskList] = useState(tasks);

  const toggleTask = (taskId: string) => {
    setTaskList(
      taskList.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const todoTasks = taskList.filter((t) => !t.completed && t.status === 'todo');
  const inProgressTasks = taskList.filter((t) => !t.completed && t.status === 'in-progress');
  const completedTasks = taskList.filter((t) => t.completed);

  return (
    <AppShell monoContext="/tasks">
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground mt-1">
              Manage document-related tasks and to-dos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">To Do</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todoTasks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Pending tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressTasks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">This week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">On track</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="high-priority">High Priority</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Tasks</CardTitle>
                    <CardDescription>
                      {taskList.filter((t) => !t.completed).length} active tasks
                    </CardDescription>
                  </div>
                  <Input
                    placeholder="Search tasks..."
                    className="max-w-xs"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {taskList.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        'flex items-start gap-4 p-4 border rounded-lg transition-colors',
                        task.completed && 'opacity-50'
                      )}
                    >
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <h3
                            className={cn(
                              'font-medium',
                              task.completed && 'line-through text-muted-foreground'
                            )}
                          >
                            {task.title}
                          </h3>
                          <Badge
                            variant="secondary"
                            className={priorityColors[task.priority as keyof typeof priorityColors]}
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{task.dueDate}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{task.assignee}</span>
                          </div>
                          {task.document && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span className="text-xs">{task.document}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Tasks</CardTitle>
                <CardDescription>
                  Tasks assigned to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {taskList
                    .filter((task) => task.assignee === 'You')
                    .map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          'flex items-start gap-4 p-4 border rounded-lg',
                          task.completed && 'opacity-50'
                        )}
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <h3
                            className={cn(
                              'font-medium',
                              task.completed && 'line-through text-muted-foreground'
                            )}
                          >
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{task.dueDate}</span>
                            </div>
                            {task.document && (
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                <span className="text-xs">{task.document}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={priorityColors[task.priority as keyof typeof priorityColors]}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="high-priority" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>High Priority Tasks</CardTitle>
                <CardDescription>
                  Tasks requiring immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {taskList
                    .filter((task) => task.priority === 'high' && !task.completed)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-4 p-4 border rounded-lg"
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <h3 className="font-medium">{task.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                Due {task.dueDate}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{task.assignee}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Completed Tasks</CardTitle>
                <CardDescription>
                  {completedTasks.length} completed tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-4 p-4 border rounded-lg opacity-50"
                    >
                      <Checkbox checked={true} disabled className="mt-1" />
                      <div className="flex-1">
                        <h3 className="font-medium line-through text-muted-foreground">
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <span>Completed {task.dueDate}</span>
                          <span>•</span>
                          <span>{task.assignee}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
