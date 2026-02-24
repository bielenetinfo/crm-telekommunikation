import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, CheckCircle2, ArrowRight, Clock, TrendingUp, Sparkles, UserPlus } from "lucide-react";
import { format, differenceInDays, startOfMonth, endOfMonth } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import CommandPalette from "@/components/search/CommandPalette";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";

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

  return (
    <div className="space-y-3 px-4 md:px-8 pt-3 md:pt-4 pb-24 w-full text-foreground">

      {/* Zone 2: Content Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gradient">
            CRM Cockpit
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-0.5">
            Willkommen zurück! Hier ist der Tagesüberblick.
          </p>
        </div>

        {/* Desktop: Button rechts oben - Mobile: FAB unten */}
        {!isMobile && (
          <Button
            onClick={() => navigate(`${createPageUrl('CustomerDetail')}?new=true`)}
            className="btn-premium bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 h-12 shadow-lg shadow-primary/20 text-sm rounded-xl"
          >
            <UserPlus className="h-4 w-4 mr-2" /> Neuer Kunde
          </Button>
        )}
      </div>

      {/* Zone 3: KPI Row - Horizontal Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">

        {/* KPI 1: Kunden */}
        <Card className="glass-card card-premium p-4 rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 opacity-70 flex-shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-3xl font-black text-foreground leading-none">{customers.length}</div>
              <div className="text-xs text-muted-foreground/70 font-semibold mt-1">Kunden</div>
            </div>
          </div>
        </Card>

        {/* KPI 2: Verträge */}
        <Card className="glass-card card-premium p-4 rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary opacity-70 flex-shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-3xl font-black text-foreground leading-none">{activeContracts.length}</div>
              <div className="text-xs text-muted-foreground/70 font-semibold mt-1">Verträge</div>
            </div>
          </div>
        </Card>

        {/* KPI 3: Provision */}
        <Card className="glass-card card-premium p-4 rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 opacity-70 flex-shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-3xl font-black text-foreground leading-none">{monthlyCommission.toFixed(0)}€</div>
              <div className="text-xs text-muted-foreground/70 font-semibold mt-1">Provision</div>
            </div>
          </div>
        </Card>

        {/* KPI 4: Offene VVL */}
        <Card className="glass-card card-premium p-4 rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 opacity-70 flex-shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-3xl font-black text-foreground leading-none">{vvlCandidates.length}</div>
              <div className="text-xs text-muted-foreground/70 font-semibold mt-1">Offene VVL</div>
            </div>
          </div>
        </Card>

      </div>

      {/* Zone 4 & 5: Main Grid - 3 Columns (1:2 ratio) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN - Activity & To-Do */}
        <div className="lg:col-span-1 space-y-6">

          {/* Activity Card */}
          <Card className="glass-card card-premium p-6 rounded-3xl">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              Aktivität
            </h3>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Keine Aktivitäten</p>
              ) : (
                activities.slice(0, 5).map((act, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground leading-snug">{act.short_text}</p>
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
          <Card className="glass-card card-premium p-6 rounded-3xl">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-rose-400" />
              To-Do
            </h3>
            <div className="space-y-3">
              {combinedTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Alles erledigt!</p>
              ) : (
                combinedTasks.slice(0, 6).map((t, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl hover:bg-secondary/50 cursor-pointer group"
                    onClick={() => navigate(`${createPageUrl('CustomerDetail')}?id=${t.customer_id}`)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        t.due_date && new Date(t.due_date) < today
                          ? "bg-rose-500/10 text-rose-500"
                          : "bg-secondary text-muted-foreground"
                      )}>
                        {t.due_date ? format(new Date(t.due_date), 'dd.MM') : 'Heute'}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-foreground group-hover:text-primary line-clamp-2">
                      {t.note || t.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground/70 mt-1 truncate">{t.customer_name}</div>
                  </div>
                ))
              )}
            </div>
          </Card>

        </div>

        {/* RIGHT COLUMN - VVL Focus (double width) */}
        <div className="lg:col-span-2">
          <Card className="glass-card card-premium p-0 rounded-3xl overflow-hidden h-full flex flex-col">

            {/* Header */}
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-card/30">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-primary" />
                VVL Chancen & Fristen
              </h3>
              <Badge className="text-sm font-mono bg-primary/15 border-primary/30 text-primary px-4 py-2">
                {vvlCandidates.length} Offen
              </Badge>
            </div>

            {/* VVL List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[600px] custom-scrollbar">
              {vvlCandidates.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
                  <CheckCircle2 className="h-12 w-12 mb-3 opacity-20" />
                  <span className="text-sm">Keine anstehenden Verlängerungen</span>
                </div>
              ) : (
                vvlCandidates.map(c => {
                  const days = differenceInDays(new Date(c.cancellation_deadline), today);
                  const isCritical = days <= 30;
                  return (
                    <div
                      key={c.id}
                      onClick={() => navigate(`${createPageUrl('ContractDetail')}?id=${c.id}`)}
                      className="group flex items-center justify-between p-5 rounded-2xl hover:bg-secondary/50 cursor-pointer border border-transparent hover:border-border/50 transition-all"
                    >
                      <div className="flex items-center gap-5 overflow-hidden flex-1">
                        <div className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-base",
                          isCritical ? "bg-rose-500/15 text-rose-400" : "bg-primary/15 text-primary"
                        )}>
                          {days}t
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-base font-bold text-foreground truncate group-hover:text-primary">
                            {c.customer_name}
                          </div>
                          <div className="text-sm text-muted-foreground/70 font-medium truncate">
                            {c.provider_name} • {c.category}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground/60 group-hover:text-primary flex-shrink-0 ml-4" />
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/50 bg-secondary/20 text-center">
              <Button
                variant="ghost"
                className="w-full text-sm hover:text-primary h-10 font-semibold"
                onClick={() => navigate('/vvl')}
              >
                Alle anzeigen
              </Button>
            </div>

          </Card>
        </div>

      </div>

      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

      {/* FAB only on Mobile */}
      {isMobile && (
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
      )}
    </div>
  );
}