import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week"); // week or month

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  const getTasksForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return tasks.filter(t => t.due_date === dateStr && t.is_calendar_event);
  };

  // Week View
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Month View
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = addDays(calendarStart, 41); // 6 weeks
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const navigateWeek = (direction) => {
    setSelectedDate(addDays(selectedDate, direction * 7));
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  return (
    <div className="app-page-shell">
      {/* Header - Dashboard Pattern */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="app-page-title">
            Kalender
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            {tasks.length} Termine
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("week")}
            className={cn(
              "rounded-xl border-border",
              viewMode === "week" && "bg-primary text-primary-foreground"
            )}
          >
            Woche
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("month")}
            className={cn(
              "rounded-xl border-border",
              viewMode === "month" && "bg-primary text-primary-foreground"
            )}
          >
            Monat
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => viewMode === "week" ? navigateWeek(-1) : navigateMonth(-1)}
            className="text-foreground hover:bg-secondary"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">
              {viewMode === "week"
                ? `${format(weekStart, 'd. MMM', { locale: de })} - ${format(addDays(weekStart, 6), 'd. MMM yyyy', { locale: de })}`
                : format(selectedDate, 'MMMM yyyy', { locale: de })}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => viewMode === "week" ? navigateWeek(1) : navigateMonth(1)}
            className="text-foreground hover:bg-secondary"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </Card>

      {/* Calendar View */}
      <AnimatePresence mode="wait">
        {viewMode === "week" ? (
          <motion.div
            key="week-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="glass-card card-premium overflow-hidden border-transparent">
              <div className="grid grid-cols-7 border-b border-border/50">
                {weekDays.map(day => (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "p-4 text-center transition-colors border-r last:border-r-0 border-border",
                      isSameDay(day, selectedDate) && "bg-primary/10",
                      isSameDay(day, new Date()) && "bg-amber-500/10"
                    )}
                  >
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      {format(day, 'EEE', { locale: de })}
                    </p>
                    <p className={cn(
                      "text-2xl font-bold mt-1",
                      isSameDay(day, selectedDate) ? "text-primary" : "text-foreground"
                    )}>
                      {format(day, 'd')}
                    </p>
                    {getTasksForDate(day).length > 0 && (
                      <div className="flex justify-center mt-2">
                        <div className="h-2 w-2 rounded-full bg-[#FFD24D]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Day Details */}
              <div className="p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  {format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de })}
                </h3>

                {getTasksForDate(selectedDate).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Keine Termine für diesen Tag</p>
                ) : (
                  <div className="space-y-3">
                    {getTasksForDate(selectedDate)
                      .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""))
                      .map(task => (
                        <div key={task.id} className="p-4 rounded-xl bg-secondary border border-border">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-foreground">{task.title}</p>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                {task.start_time && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{task.start_time}</span>
                                    {task.end_time && <span>- {task.end_time}</span>}
                                  </div>
                                )}
                                {task.customer_name && (
                                  <span>{task.customer_name}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="month-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="glass-card card-premium overflow-hidden border-transparent">
              <div className="grid grid-cols-7 border-b border-border/50">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0 border-border">
                    {day}
                  </div>
                ))}
              </div>
              <motion.div
                className="grid grid-cols-7"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {monthDays.map((day, idx) => {
                  const tasksForDay = getTasksForDate(day);
                  return (
                    <motion.button
                      key={day.toISOString()}
                      onClick={() => { setSelectedDate(day); setViewMode("week"); }}
                      className={cn(
                        "min-h-[100px] p-2 text-left border-r border-b border-border hover:bg-secondary transition-colors",
                        !isSameMonth(day, selectedDate) && "bg-[#0F1115] text-muted-foreground",
                        isSameDay(day, new Date()) && "bg-amber-500/10"
                      )}
                      variants={itemVariants}
                    >
                      <span className={cn(
                        "text-sm font-medium",
                        isSameMonth(day, selectedDate) ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {format(day, 'd')}
                      </span>
                      <div className="mt-1 space-y-1">
                        {tasksForDay.slice(0, 2).map(task => (
                          <div key={task.id} className="text-xs p-1 rounded bg-primary/20 text-primary truncate">
                            {task.start_time} {task.title}
                          </div>
                        ))}
                        {tasksForDay.length > 2 && (
                          <div className="text-xs text-muted-foreground">+{tasksForDay.length - 2} mehr</div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}