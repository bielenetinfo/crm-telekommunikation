import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Clock, AlertTriangle, Plus, Search, ListTodo, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { KpiCard } from "@/components/ui/kpi-card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { taskService } from "@/domain/task/service";
import { mapQuickTaskInput } from "@/domain/task/mappers/taskMappers";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Tasks() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState("all"); // all, open, done
  const [search, setSearch] = useState("");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.list()
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => taskService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success("Aufgabe erstellt");
    }
  });

  const handleCreateTask = () => {
    const title = window.prompt("Titel der Aufgabe:");
    if (title) {
      createTaskMutation.mutate(mapQuickTaskInput(title));
    }
  };

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ id, status }) => taskService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success("Status aktualisiert");
    }
  });

  const filteredTasks = tasks.filter(t => {
    const matchesFilter = filter === "all" || t.status === filter;
    const matchesSearch = !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.customer_name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const priorityColors = {
    niedrig: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    normal: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    hoch: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    dringend: "bg-rose-500/10 text-rose-500 border-rose-500/20"
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="app-page-shell">
      {/* Header - Dashboard Pattern */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="app-page-title">
            Aufgaben
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            {filteredTasks.length} von {tasks.length} Aufgaben
          </p>
        </div>

        {/* Desktop: Button - Mobile: FAB */}
        {!isMobile && (
          <Button className="btn-premium bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 h-12 shadow-lg shadow-primary/20 text-sm rounded-xl">
            <Plus className="h-4 w-4 mr-2" /> Neue Aufgabe
          </Button>
        )}
      </div>

      {/* KPI Cards Row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6"
      >
        <motion.div variants={itemVariants}>
          <KpiCard icon={ListTodo} value={tasks.length} label="Gesamt Aufgaben" color="blue" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard icon={Clock} value={tasks.filter(t => t.status === 'offen').length} label="Offen" color="amber" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard icon={CheckCheck} value={tasks.filter(t => t.status === 'erledigt').length} label="Erledigt" color="green" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard icon={AlertTriangle} value={tasks.filter(t => t.priority === 'dringend').length} label="Dringend" color="rose" />
        </motion.div>
      </motion.div>

      {/* Quick Add & Controls */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {/* Quick Add Bar */}
        <div className="glass-card card-premium p-1.5 pr-2 rounded-[18px] flex items-center gap-2 border-primary/20 shadow-lg shadow-primary/5 focus-within:shadow-primary/20 ">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <Input
            className="h-10 border-none bg-transparent focus-visible:ring-0 text-base font-medium placeholder:text-muted-foreground/70"
            placeholder="Neue Aufgabe schnell erstellen... (Eingabetaste drücken)"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                taskService.create({
                  ...mapQuickTaskInput(e.currentTarget.value),
                  due_date: new Date().toISOString()
                }).then(() => {
                  queryClient.invalidateQueries({ queryKey: ['tasks'] });
                  e.currentTarget.value = "";
                  const successAudio = new Audio('/sounds/success.mp3'); // Optional if you have it
                  // toast.success("Aufgabe erstellt!");
                });
              }
            }}
          />
          <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 border-l border-white/5">
            <span>Enter ↵</span>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-3 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between bg-card/10">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              className="pl-9 h-9 bg-secondary/50 border-transparent focus:bg-background focus:border-primary/50 text-foreground rounded-lg  text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
            {['all', 'offen', 'erledigt'].map(f => (
              <Button
                key={f}
                variant="ghost"
                className={cn(
                  "rounded-md px-4 h-7 text-[10px] uppercase font-bold tracking-wider ",
                  filter === f
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setFilter(f)}
                size="sm"
              >
                {f === 'all' ? 'Alle' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4 mt-6"
      >
        {filteredTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card border-dashed border-border/50 p-20 rounded-3xl text-center flex flex-col items-center gap-4 bg-card/20"
          >
            <div className="h-16 w-16 rounded-3xl bg-secondary/50 flex items-center justify-center mb-2">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div>
              <h3 className="text-foreground font-black text-lg mb-1">Alles erledigt!</h3>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest italic">Keine Aufgaben in dieser Ansicht.</p>
            </div>
          </motion.div>
        ) : (
          filteredTasks.map((t) => (
            <motion.div variants={itemVariants} key={t.id}>
              <Card className="glass-card card-premium overflow-hidden group hover:-translate-y-1 transition-all duration-300 rounded-2xl border-white/5 hover:border-primary/50 relative">
                <div className="h-1.5 bg-gradient-to-r from-primary via-orange-400 to-primary/50"></div>
                <div className="flex items-center p-5 gap-6">
                  <button
                    onClick={() => updateTaskStatusMutation.mutate({ id: t.id, status: t.status === 'erledigt' ? 'offen' : 'erledigt' })}
                    className={cn(
                      "h-10 w-10 rounded-2xl border-2 flex items-center justify-center flex-shrink-0   shadow-lg",
                      t.status === 'erledigt'
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-500"
                        : "border-border text-transparent hover:border-primary "
                    )}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-2">
                      <span className={cn(
                        "text-[15px] font-black tracking-tight truncate",
                        t.status === 'erledigt' ? "text-muted-foreground line-through" : "text-foreground"
                      )}>
                        {t.title}
                      </span>
                      <Badge variant="outline" className={cn("text-[9px] px-2 h-5 uppercase tracking-tighter font-black border-none mix-blend-multiply dark:mix-blend-screen", priorityColors[t.priority] || priorityColors.normal)}>
                        {t.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      <span className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {t.customer_name || 'Allgemein'}
                      </span>
                      {t.due_date && (
                        <span className={cn(
                          "flex items-center gap-2",
                          new Date(t.due_date) < new Date() && t.status !== 'erledigt' ? "text-rose-500" : ""
                        )}>
                          <Clock className="h-3 w-3 opacity-60" /> {format(new Date(t.due_date), 'dd. MMM yyyy', { locale: de })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-3">
                    <div className="px-3 py-1 bg-secondary/50 rounded-lg border border-border/50">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl opacity-0 group-hover:opacity-100  border border-transparent hover:border-rose-500/20">
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Mobile: FAB */}
      {isMobile && (
        <FloatingActionButton
          actions={[
            {
              icon: Plus,
              label: 'Neue Aufgabe',
              onClick: () => { } // Add task creation logic
            }
          ]}
        />
      )}
    </div>
  );
}
