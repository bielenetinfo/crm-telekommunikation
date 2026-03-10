import { useState, useDeferredValue } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, FileText, Calendar, DollarSign, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format, differenceInDays, startOfMonth, endOfMonth } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { KpiCard } from "@/components/ui/kpi-card";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";

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

const statusColors = {
  aktiv: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  gekündigt: "bg-rose-500/15 text-rose-500 border-rose-500/30",
  abgelaufen: "bg-muted text-muted-foreground border-border",
  verlängert: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  pausiert: "bg-amber-500/15 text-amber-500 border-amber-500/30"
};

const categoryColors = {
  mobilfunk: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  festnetz: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  internet: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  tv: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  kombi: "bg-primary/10 text-primary border-primary/20",
  sonstiges: "bg-muted text-muted-foreground border-border"
};

export default function Contracts() {
  const { hasPermission } = useAuth();
  const canDeleteContract = hasPermission('delete_contract');
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState("aktiv");

  const { data: allContracts = [], isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.Contract.list('-created_date')
  });

  // Filter out deleted contracts
  const contracts = allContracts.filter(c => !c.is_deleted);

  const filteredContracts = contracts.filter(c => {
    const searchLower = deferredSearch.toLowerCase();
    const matchesSearch =
      c.customer_name?.toLowerCase().includes(searchLower) ||
      c.contract_number?.toLowerCase().includes(searchLower) ||
      c.provider_name?.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate KPIs
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const activeContracts = contracts.filter(c => c.status === 'aktiv').length;

  const monthlyRevenue = contracts
    .filter(c => c.status === 'aktiv')
    .reduce((sum, c) => sum + (Number(c.monthly_fee) || 0), 0);

  const expiringCount = contracts.filter(c => {
    if (c.status !== 'aktiv' || !c.cancellation_deadline) return false;
    const deadline = new Date(c.cancellation_deadline);
    const days = differenceInDays(deadline, today);
    return days >= 0 && days <= 90;
  }).length;



  return (
    <div className="max-w-[1360px] 2xl:max-w-[1440px] mx-auto space-y-4 md:space-y-5 px-3 sm:px-4 md:px-6 xl:px-8 pt-4 md:pt-6 pb-28 w-full text-foreground">
      {/* Header - Dashboard Pattern */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="app-page-title">
            Verträge
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            {filteredContracts.length} von {contracts.length} Verträgen
          </p>
        </div>

        {/* Desktop: Button rechts - Mobile: FAB */}
        {!isMobile && (
          <Button
            onClick={() => navigate(`${createPageUrl('ContractDetail')}?new=true`)}
            className="btn-premium bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 h-12 shadow-lg shadow-primary/20 text-sm rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neuer Vertrag
          </Button>
        )}
      </div>

      {/* KPI Cards Row - Dashboard Style */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 md:mt-6"
      >
        <motion.div variants={itemVariants}>
          <KpiCard icon={FileText} value={contracts.length} label="Gesamt Verträge" color="blue" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard icon={CheckCircle2} value={activeContracts} label="Aktive Verträge" color="green" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard icon={DollarSign} value={`€${monthlyRevenue.toFixed(0)}`} label="Monatlicher Umsatz" color="primary" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard icon={AlertTriangle} value={expiringCount} label="Laufen bald aus (90T)" color="rose" />
        </motion.div>
      </motion.div>

      {/* Filters - Glass Bar style like VvlDashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 24 }}
        className="glass-card card-premium p-3 sm:p-4 rounded-2xl md:rounded-3xl flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between"
      >
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suche: Kunde, Vertragsnummer, Provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-11 bg-secondary/50 border-transparent focus:bg-background focus:border-primary/50 text-foreground rounded-xl  font-medium placeholder:text-muted-foreground/50"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
          <TabsList className="bg-secondary/50 h-auto min-h-11 p-1 rounded-xl w-full md:w-auto grid grid-cols-3 md:flex gap-1">
            <TabsTrigger value="aktiv" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground font-bold text-[10px] sm:text-xs uppercase tracking-widest px-2 sm:px-4 py-2">Aktiv</TabsTrigger>
            <TabsTrigger value="gekündigt" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground font-bold text-[10px] sm:text-xs uppercase tracking-widest px-2 sm:px-4 py-2">Gekündigt</TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground font-bold text-[10px] sm:text-xs uppercase tracking-widest px-2 sm:px-4 py-2">Alle</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Contracts List */}
      {
        isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="p-6 bg-card border-border/50">
                <div className="h-4 bg-secondary rounded w-1/3 mb-2" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : filteredContracts.length === 0 ? (
          <div
            className="p-12 text-center rounded-3xl border border-dashed border-border/50 bg-card/20"
          >
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-foreground mb-1">Keine Verträge gefunden</h3>
            <p className="text-muted-foreground text-sm">Legen Sie einen neuen Vertrag an.</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3 sm:space-y-4 mt-4 md:mt-6"
          >
            {filteredContracts.map(contract => {
              const daysUntilDeadline = contract.cancellation_deadline
                ? differenceInDays(new Date(contract.cancellation_deadline), new Date())
                : null;
              const isExpiring = daysUntilDeadline !== null && daysUntilDeadline >= 0 && daysUntilDeadline <= 30;

              return (
                <motion.div variants={itemVariants} key={contract.id}>
                  <Card
                    className="glass-card card-premium overflow-hidden group hover:-translate-y-1 transition-all duration-300 cursor-pointer rounded-2xl border-white/5 hover:border-primary/50 relative motion-reduce:transform-none"
                    onClick={() => navigate(`${createPageUrl('ContractDetail')}?id=${contract.id}`)}
                  >
                    <div className="h-1.5 bg-gradient-to-r from-primary via-orange-400 to-primary/50"></div>
                    <div className="flex flex-col lg:flex-row lg:items-center p-4 md:p-5 gap-4 md:gap-6">
                      {/* Icon & Main Info */}
                      <div className="flex items-start gap-4 md:gap-5 flex-1 min-w-0">
                        <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-secondary/50 flex items-center justify-center flex-shrink-0 border border-border group-hover:bg-primary/10 group-hover:border-primary/20  shadow-sm">
                          <FileText className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground group-hover:text-primary " />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 md:gap-3 flex-wrap mb-1.5 md:mb-2">
                            <h3 className="text-base md:text-lg font-black text-foreground tracking-tight group-hover:text-primary  truncate">{contract.customer_name}</h3>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge className={cn("text-[9px] md:text-[10px] uppercase tracking-widest font-black border px-1.5 md:px-2 shadow-sm", statusColors[contract.status])}>
                                {contract.status}
                              </Badge>
                              {isExpiring && (
                                <Badge className="text-[9px] md:text-[10px] uppercase tracking-widest font-black bg-rose-500/10 text-rose-500 border-rose-500/20 px-1.5 md:px-2 ">
                                  <AlertTriangle className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
                                  {daysUntilDeadline} TAGE
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 md:gap-x-5 gap-y-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <span className="text-foreground/80 font-black">{contract.provider_name}</span>
                            {contract.contract_number && (
                              <span className="font-mono hidden sm:inline opacity-70">#{contract.contract_number}</span>
                            )}
                            <span className={cn("px-2 py-0.5 rounded-md border", categoryColors[contract.category])}>
                              {contract.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dates & Financials */}
                      <div className="grid grid-cols-2 sm:flex sm:items-center justify-between lg:justify-end gap-x-4 gap-y-4 sm:gap-10 lg:gap-12 border-t lg:border-t-0 border-border/50 pt-4 lg:pt-0">
                        <div className="text-left md:text-center col-span-2 sm:col-span-1">
                          <p className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1 md:mb-1.5">Laufzeit</p>
                          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-[13px] font-bold text-foreground">
                            <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground" />
                            <span className="tabular-nums">
                              {contract.start_date && format(new Date(contract.start_date), 'dd.MM.yyyy', { locale: de })}
                              {contract.end_date && (
                                <>
                                  <span className="text-muted-foreground mx-1">→</span>
                                  {format(new Date(contract.end_date), 'dd.MM.yyyy', { locale: de })}
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {contract.monthly_fee && (
                          <div className="text-left md:text-center">
                            <p className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1 md:mb-1.5">Monatlich</p>
                            <p className="text-sm md:text-[15px] font-black text-foreground tabular-nums">{contract.monthly_fee.toFixed(2)} €</p>
                          </div>
                        )}

                        {canDeleteContract && contract.commission && (
                          <div className="text-left md:text-center">
                            <p className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1 md:mb-1.5 flex items-center gap-1 sm:justify-center">
                              <DollarSign className="h-2.5 w-2.5 md:h-3 md:w-3 text-emerald-500" />
                              Provision
                            </p>
                            <p className="text-sm md:text-[15px] font-black text-emerald-500 tabular-nums">{contract.commission.toFixed(2)} €</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )
      }

      {/* Mobile: FAB */}
      {
        isMobile && (
          <FloatingActionButton
            actions={[
              {
                icon: Plus,
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
