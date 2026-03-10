import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users, FileText, CheckCircle2, ArrowRight, Clock, TrendingUp, Sparkles, UserPlus } from "lucide-react";
import { format, differenceInDays, startOfMonth, endOfMonth } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CommandPalette from "@/components/search/CommandPalette";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const isMobile = useIsMobile();
  const today = new Date();

  // Queries
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => base44.entities.Customer.list() });
  const { data: contracts = [] } = useQuery({ queryKey: ['contracts'], queryFn: () => base44.entities.Contract.list() });
  const { data: followups = [] } = useQuery({ queryKey: ['followups'], queryFn: () => base44.entities.Followup.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list() });
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.Activity.list('-timestamp', 5) });

  // Stats
  const activeContracts = contracts.filter(c => c.status === 'aktiv');
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const monthlyCommission = contracts
    .filter(c => {
      if (!c.commission_date) return false;
      const d = new Date(c.commission_date);
      return d >= monthStart && d <= monthEnd;
    })
    .reduce((sum, c) => sum + (Number(c.commission) || 0), 0);

  // VVL Logic
  const vvlCandidates = activeContracts.filter(c => {
    if (!c.cancellation_deadline) return false;
    const deadline = new Date(c.cancellation_deadline);
    const days = differenceInDays(deadline, today);
    return days <= 90;
  }).sort((a, b) => new Date(a.cancellation_deadline) - new Date(b.cancellation_deadline));

  // Overdue Tasks
  const overdueFollowups = followups
    .filter(f => f.status === 'open' && new Date(f.due_date) <= today)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  const combinedTasks = [...overdueFollowups, ...tasks].sort((a, b) => {
    const dateA = a.due_date ? new Date(a.due_date) : new Date(8640000000000000);
    const dateB = b.due_date ? new Date(b.due_date) : new Date(8640000000000000);
    return dateA - dateB;
  });

  const visibleActivities = isMobile ? activities.slice(0, 5) : activities.slice(0, 4);
  const visibleTasks = isMobile ? combinedTasks.slice(0, 6) : combinedTasks.slice(0, 5);

  return (
    <div
      className={cn(
        "max-w-[1360px] 2xl:max-w-[1440px] mx-auto w-full text-foreground px-3 sm:px-4 md:px-6 xl:px-8",
        "pt-4 sm:pt-6 md:pt-6 pb-28",
        "space-y-4 md:space-y-5",
        !isMobile && "xl:h-[calc(100dvh-72px)] xl:max-h-[calc(100dvh-72px)] xl:overflow-hidden xl:pb-5 xl:grid xl:grid-rows-[auto_auto_minmax(0,1fr)] xl:gap-4 xl:space-y-0"
      )}
    >

      {/* Zone 2: Content Header */}
      <div className="glass-card card-premium rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-5 border-white/10 flex flex-col lg:flex-row lg:items-end justify-between gap-3 md:gap-4 min-w-0">
        <div className="min-w-0">
          <h1 className="app-page-title">
            CRM Cockpit
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Willkommen zurück! Hier ist der Tagesüberblick.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 text-xs">
          <Badge className="justify-center bg-primary/10 text-primary border-primary/20 font-bold h-7 md:h-8 px-2.5 md:px-3">
            {combinedTasks.length} Aufgaben
          </Badge>
          <Badge className="justify-center bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold h-7 md:h-8 px-2.5 md:px-3">
            {vvlCandidates.length} VVL offen
          </Badge>
          <Badge className="justify-center bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold h-7 md:h-8 px-2.5 md:px-3">
            {activities.length} Aktivitäten
          </Badge>
          <Badge className="justify-center bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold h-7 md:h-8 px-2.5 md:px-3">
            {monthlyCommission.toFixed(0)} € Provision
          </Badge>
        </div>
      </div>

      {/* Zone 3: KPI Row - Horizontal Layout */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {/* KPI 1: Kunden */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card card-premium p-4 md:p-5 rounded-2xl md:rounded-3xl group transition-all duration-300 border-white/5 relative overflow-hidden flex flex-col justify-between h-full min-h-[118px] md:min-h-[124px] cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-white/10 motion-reduce:transform-none" onClick={() => navigate('/customers')}>
            {/* Top: Icon */}
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-400 flex flex-col items-center justify-center shadow-inner border border-blue-500/20 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-shadow mb-3">
              <Users className="h-5 w-5 md:h-6 md:w-6" />
            </div>

            {/* Bottom: Value & Label */}
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-black text-foreground leading-none">{customers.length}</span>
              </div>
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider opacity-60">
                Kunden
              </span>
            </div>
          </Card>
        </motion.div>

        {/* KPI 2: Verträge */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card card-premium p-4 md:p-5 rounded-2xl md:rounded-3xl group transition-all duration-300 border-white/5 relative overflow-hidden flex flex-col justify-between h-full min-h-[118px] md:min-h-[124px] cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-white/10 motion-reduce:transform-none" onClick={() => navigate('/contracts')}>
            {/* Top: Icon */}
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex flex-col items-center justify-center shadow-inner border border-primary/20 group-hover:shadow-[0_0_20px_rgba(255,195,0,0.2)] transition-shadow mb-3">
              <FileText className="h-5 w-5 md:h-6 md:w-6" />
            </div>

            {/* Bottom: Value & Label */}
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-black text-foreground leading-none">{activeContracts.length}</span>
              </div>
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider opacity-60">
                Verträge
              </span>
            </div>
          </Card>
        </motion.div>

        {/* KPI 3: Provision */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card card-premium p-4 md:p-5 rounded-2xl md:rounded-3xl group transition-all duration-300 border-white/5 relative overflow-hidden flex flex-col justify-between h-full min-h-[118px] md:min-h-[124px] cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-white/10 motion-reduce:transform-none" onClick={() => navigate('/contracts')}>
            {/* Top: Icon */}
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-400 flex flex-col items-center justify-center shadow-inner border border-emerald-500/20 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-shadow mb-3">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6" />
            </div>

            {/* Bottom: Value & Label */}
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-black text-foreground leading-none">{monthlyCommission.toFixed(0)} €</span>
              </div>
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider opacity-60">
                Provision
              </span>
            </div>
          </Card>
        </motion.div>

        {/* KPI 4: Offene VVL */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card card-premium p-4 md:p-5 rounded-2xl md:rounded-3xl group transition-all duration-300 border-white/5 relative overflow-hidden flex flex-col justify-between h-full min-h-[118px] md:min-h-[124px] cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-white/10 motion-reduce:transform-none" onClick={() => navigate('/vvl')}>
            {/* Top: Icon */}
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-500/5 text-rose-400 flex flex-col items-center justify-center shadow-inner border border-rose-500/20 group-hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] transition-shadow mb-3">
              <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
            </div>

            {/* Bottom: Value & Label */}
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-black text-foreground leading-none">{vvlCandidates.length}</span>
              </div>
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider opacity-60">
                Offene VVL
              </span>
            </div>
          </Card>
        </motion.div>

      </motion.div>

      {/* Zone 4 & 5: Main Grid - 3 Columns (1:2 ratio) */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 xl:grid-cols-[minmax(320px,0.86fr)_minmax(0,1.14fr)] gap-4 min-h-0"
      >
        {/* LEFT COLUMN - Activity & To-Do */}
        <motion.div
          variants={itemVariants}
          className={cn(
            "space-y-4",
            !isMobile && "xl:grid xl:grid-rows-2 xl:gap-4 xl:space-y-0 xl:min-h-0"
          )}
        >

          {/* Activity Card */}
          <Card className={cn("glass-card card-premium p-4 md:p-5 rounded-2xl md:rounded-3xl group transition-all duration-300 flex flex-col h-full min-h-[240px]", !isMobile && "xl:min-h-0")}>
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              Aktivität
            </h3>
            <div className="space-y-3 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                  <p className="text-sm font-bold text-foreground mb-2">Keine Aktivitäten</p>
                  <p className="text-xs text-muted-foreground mb-4 max-w-[220px]">Um Historienpunkte aufzubauen, erfasse Protokolle bei Kunden oder Verträgen.</p>
                  <Button variant="outline" size="sm" className="bg-white/5 hover:bg-white/10 hover:text-white border-white/10 text-xs" onClick={() => navigate('/customers')}>Aktivität protokollieren</Button>
                </div>
              ) : (
                visibleActivities.map((act, i) => (
                  <div key={i} className="flex gap-3 items-start group/item">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0 group-hover/item:scale-150 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground leading-snug group-hover/item:text-primary transition-colors">{act.short_text}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        {act.timestamp ? format(new Date(act.timestamp), 'HH:mm') : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* To-Do Card */}
          <Card className={cn("glass-card card-premium p-4 md:p-5 rounded-2xl md:rounded-3xl transition-all duration-300 flex flex-col h-full min-h-[240px]", !isMobile && "xl:min-h-0")}>
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-rose-400" />
              To-Do
            </h3>
            <div className="space-y-2.5 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1">
              {combinedTasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                  <p className="text-sm font-bold text-foreground mb-2">Alles erledigt!</p>
                  <p className="text-xs text-muted-foreground mb-4 max-w-[220px]">Du hast aktuell keine offenen Aufgaben oder Fristen.</p>
                  <Button variant="outline" size="sm" className="bg-white/5 hover:bg-white/10 hover:text-white border-white/10 text-xs" onClick={() => navigate('/tasks')}>Zur Aufgaben-Übersicht</Button>
                </div>
              ) : (
                visibleTasks.map((t, i) => (
                  <div
                    key={i}
                    className="p-2.5 md:p-3 rounded-xl md:rounded-2xl hover:bg-white/5 cursor-pointer group/todo transition-colors border border-transparent hover:border-white/10"
                    onClick={() => navigate(`${createPageUrl('CustomerDetail')}?id=${t.customer_id}`)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        t.due_date && new Date(t.due_date) < today
                          ? "bg-rose-500/10 text-rose-500"
                          : "bg-secondary text-muted-foreground"
                      )}>
                        {t.due_date ? `Fällig am ${format(new Date(t.due_date), 'dd.MM')}` : 'Heute'}
                      </span>
                    </div>
                    <div className="text-[13px] md:text-sm font-bold text-foreground group-hover/todo:text-primary line-clamp-2 transition-colors leading-snug">
                      {t.note || t.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 truncate font-medium">{t.customer_name}</div>
                  </div>
                ))
              )}
            </div>
            {combinedTasks.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50 text-center">
                <Button variant="link" className="text-xs md:text-sm font-semibold text-muted-foreground hover:text-primary p-0 h-auto no-underline hover:no-underline flex items-center justify-center w-full gap-2" onClick={() => navigate('/tasks')}>
                  Alle Aufgaben anzeigen <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>

        </motion.div>

        {/* RIGHT COLUMN - VVL Focus (double width) */}
        <motion.div variants={itemVariants} className="min-w-0 min-h-0">
          <Card className="glass-card card-premium p-0 rounded-2xl md:rounded-3xl overflow-hidden h-full min-h-[300px] xl:min-h-0 flex flex-col transition-all duration-300">

            {/* Header */}
            <div className="p-4 md:p-5 border-b border-border/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-card/30">
              <h3 className="text-base md:text-lg font-bold flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                VVL Chancen & Fristen
              </h3>
              <Badge className="text-xs md:text-sm font-mono bg-primary/15 border-primary/30 text-primary px-3 py-1.5 w-fit">
                {vvlCandidates.length} Offen
              </Badge>
            </div>

            {/* VVL List */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              {vvlCandidates.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
                  <CheckCircle2 className="h-12 w-12 mb-3 opacity-20" />
                  <span className="text-sm">Keine anstehenden Verlängerungen</span>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {vvlCandidates.map(c => {
                    const days = differenceInDays(new Date(c.cancellation_deadline), today);
                    const isCritical = days <= 30;
                    return (
                      <div
                        key={c.id}
                        onClick={() => navigate(`${createPageUrl('ContractDetail')}?id=${c.id}`)}
                        className="group flex items-center justify-between p-3.5 md:p-4 hover:bg-white/5 cursor-pointer transition-colors duration-200"
                      >
                        <div className="flex items-center gap-3 md:gap-4 overflow-hidden flex-1">
                          <div className={cn(
                            "min-w-[72px] md:min-w-[80px] h-12 md:h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-inner",
                            isCritical ? "bg-rose-500/15 text-rose-400 group-hover:bg-rose-500/25" : "bg-primary/15 text-primary group-hover:bg-primary/25"
                          )}>
                            <span className="text-[9px] uppercase font-black tracking-widest opacity-80 mb-0.5 whitespace-nowrap px-1">
                              {days < 0 ? 'Überfällig seit' : 'Fällig in'}
                            </span>
                            <span className="font-black text-xs md:text-sm leading-none">{Math.abs(days)} Tg</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm md:text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {c.customer_name}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground/70 font-medium truncate">
                              {c.provider_name} • {c.category}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 md:p-4 border-t border-border/50 bg-secondary/10 text-center hover:bg-secondary/20 transition-colors">
              <Button
                variant="link"
                className="w-full text-xs md:text-sm hover:text-primary h-9 md:h-10 font-bold transition-colors no-underline hover:no-underline flex items-center justify-center gap-2"
                onClick={() => navigate('/vvl')}
              >
                Alle VVL-Chancen anzeigen <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

          </Card>
        </motion.div>

      </motion.div>

      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

      {/* FAB only on Mobile */}
      {
        isMobile && (
          <FloatingActionButton
            actions={[
              {
                icon: UserPlus,
                label: 'Neuer Kunde',
                onClick: () => navigate(`${createPageUrl('CustomerDetail')}?new=true`)
              },
              {
                icon: FileText,
                label: 'Neuer Vertrag',
                onClick: () => navigate(`${createPageUrl('ContractDetail')}?new=true`)
              }
            ]}
          />
        )
      }
    </div >
  );
}
