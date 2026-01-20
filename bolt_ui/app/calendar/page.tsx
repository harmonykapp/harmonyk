import { AppShell } from '@/components/shell/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileSignature,
  Users,
  Plus,
} from 'lucide-react';

const upcomingEvents = [
  {
    id: '1',
    title: 'Partnership Agreement Review',
    type: 'meeting',
    time: '10:00 AM',
    duration: '1h',
    attendees: ['Sarah Chen', 'Mike Johnson'],
    document: 'Acme Corp Partnership Agreement',
  },
  {
    id: '2',
    title: 'NDA Signature Deadline',
    type: 'deadline',
    time: '5:00 PM',
    document: 'CloudSystems Vendor NDA',
  },
  {
    id: '3',
    title: 'Q4 Financial Report Due',
    type: 'deadline',
    time: '11:59 PM',
    document: 'Q4 Financial Report',
  },
];

const thisWeekEvents = [
  { day: 'Mon', date: 18, events: 4, hasDeadline: true },
  { day: 'Tue', date: 19, events: 2, hasDeadline: false },
  { day: 'Wed', date: 20, events: 6, hasDeadline: true },
  { day: 'Thu', date: 21, events: 3, hasDeadline: false },
  { day: 'Fri', date: 22, events: 5, hasDeadline: true },
];

export default function CalendarPage() {
  return (
    <AppShell monoContext="/calendar">
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground mt-1">
              Manage document deadlines and review meetings
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground mt-1">2 deadlines, 1 meeting</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">20</div>
              <p className="text-xs text-muted-foreground mt-1">8 deadlines, 12 meetings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground mt-1">Next 7 days</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>November 2024</CardTitle>
                    <CardDescription>Document deadlines and meetings</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4">
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div
                        key={day}
                        className="text-center text-sm font-medium text-muted-foreground"
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 35 }, (_, i) => {
                      const day = i - 2;
                      const isCurrentMonth = day > 0 && day <= 30;
                      const isToday = day === 20;
                      const hasEvents = [18, 19, 20, 21, 22, 25, 26].includes(day);

                      return (
                        <button
                          key={i}
                          className={`aspect-square p-2 text-sm rounded-lg transition-colors ${
                            !isCurrentMonth
                              ? 'text-muted-foreground opacity-40'
                              : isToday
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : hasEvents
                              ? 'bg-accent hover:bg-accent/80'
                              : 'hover:bg-accent/50'
                          }`}
                        >
                          {isCurrentMonth ? day : ''}
                          {hasEvents && isCurrentMonth && (
                            <div className="flex justify-center gap-0.5 mt-1">
                              <div className="h-1 w-1 rounded-full bg-primary" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>This Week</CardTitle>
                <CardDescription>Quick overview of the week ahead</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
                  {thisWeekEvents.map((day) => (
                    <div key={day.day} className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">{day.day}</div>
                      <div className="text-2xl font-bold mb-2">{day.date}</div>
                      <div className="space-y-1">
                        <Badge variant="secondary" className="text-xs">
                          {day.events} events
                        </Badge>
                        {day.hasDeadline && (
                          <div className="h-1 w-full bg-red-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>Wednesday, November 20</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="space-y-2 pb-4 border-b last:border-0">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <h4 className="font-semibold text-sm">{event.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{event.time}</span>
                              {event.duration && (
                                <>
                                  <span>•</span>
                                  <span>{event.duration}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              event.type === 'deadline'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                                : ''
                            }
                          >
                            {event.type}
                          </Badge>
                        </div>
                        {event.attendees && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{event.attendees.join(', ')}</span>
                          </div>
                        )}
                        {event.document && (
                          <div className="flex items-center gap-2 text-xs">
                            <FileSignature className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{event.document}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
