import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, ArrowRight, User } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { VVL_STAGE_MACHINE, buildWorkflowTask, createTaskIfMissing, getReminderPriority, historyChangeNote } from "@/lib/processStateMachine";
import { useAuth } from "@/lib/AuthContext";
import { logCustomerEvent } from "@/components/utils/historyLogger";

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

export default function VvlDashboard() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const today = new Date();

    const [filterProvider, setFilterProvider] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const { data: contracts = [] } = useQuery({ queryKey: ['contracts'], queryFn: () => base44.entities.Contract.list() });
    const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list() });

    // Filter Logic
    const filteredContracts = contracts.filter(c => {
        if (c.status !== 'aktiv') return false;
        if (!c.cancellation_deadline) return false;

        // Provider Filter
        if (filterProvider !== 'all' && c.provider_name !== filterProvider) return false;

        // Status/Window Filter
        const deadline = new Date(c.cancellation_deadline);
        const daysUntil = differenceInDays(deadline, today);

        if (filterStatus === 'critical' && daysUntil > 90) return false;
        if (filterStatus === 'urgent' && daysUntil > 30) return false;

        return true;
    }).sort((a, b) => new Date(a.cancellation_deadline) - new Date(b.cancellation_deadline));

    const providers = [...new Set(contracts.map(c => c.provider_name).filter(Boolean))];


    const advanceMutation = useMutation({
        mutationFn: async ({ contract, nextStatus }) => {
            const current = contract.vvl_status || "offen";
            await base44.entities.Contract.update(contract.id, {
                vvl_status: nextStatus,
                vvl_status_updated_at: new Date().toISOString(),
                vvl_status_updated_by: user?.name || user?.email || "System"
            });

            await logCustomerEvent({
                customerId: contract.customer_id,
                customerName: contract.customer_name,
                type: "system",
                title: `VVL Dashboard: ${VVL_STAGE_MACHINE[current]?.label || current} → ${VVL_STAGE_MACHINE[nextStatus]?.label || nextStatus}`,
                notes: historyChangeNote({ entity: "VVL-Dashboard", from: current, to: nextStatus, actorName: user?.name || user?.email || "System" }),
                contractId: contract.id,
                tags: ["vvl_dashboard", nextStatus],
                priority: "medium"
            });

            if (nextStatus === "angebot_erstellt") {
                await createTaskIfMissing({
                    base44,
                    existingTasks: tasks,
                    task: buildWorkflowTask({
                        title: "VVL-Angebot nachfassen (Dashboard)",
                        contract,
                        workflowKey: `contract-${contract.id}-vvl-dashboard-angebot`,
                        dueInDays: 2,
                        priority: "dringend"
                    })
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contracts"] });
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            toast.success("VVL-Status aktualisiert");
        }
    });
    return (
        <div className="space-y-6 px-4 md:px-6 pt-3 md:pt-4 pb-24 w-full max-w-[1600px] text-foreground">

            {/* Header - Dashboard Pattern */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="app-page-title">
                        VVL Pipeline
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium mt-0.5">
                        {filteredContracts.length} von {contracts.length} Verträgen
                    </p>
                </div>
            </div>

            {/* Filters - Glass Bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 24 }}
                className="glass-card card-premium p-4 rounded-3xl flex flex-wrap gap-4 items-center"
            >
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mr-2">
                    <Filter className="h-4 w-4" /> Filter:
                </div>

                {/* Provider Filter */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mask-gradient-right max-w-full">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilterProvider('all')}
                        className={cn(
                            "rounded-xl text-xs font-bold transition-all border",
                            filterProvider === 'all'
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                : "bg-secondary/50 text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary"
                        )}
                    >
                        Alle Anbieter
                    </Button>
                    {providers.map(p => (
                        <Button
                            key={p}
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterProvider(p)}
                            className={cn(
                                "rounded-xl text-xs font-bold transition-all border whitespace-nowrap",
                                filterProvider === p
                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                    : "bg-secondary/50 text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary"
                            )}
                        >
                            {p}
                        </Button>
                    ))}
                </div>
            </motion.div>

            {/* Results Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
            >
                {filteredContracts.length === 0 ? (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center text-muted-foreground bg-card/20 rounded-3xl border border-dashed border-border/50">
                        <Filter className="h-10 w-10 mb-4 opacity-20" />
                        <p className="text-sm font-bold">Keine Verträge gefunden</p>
                        <p className="text-xs opacity-70">Passen Sie die Filter an.</p>
                        {(filterProvider !== 'all' || filterStatus !== 'all') && (
                            <Button variant="link" onClick={() => { setFilterProvider('all'); setFilterStatus('all'); }} className="mt-2 text-primary">
                                Filter zurücksetzen
                            </Button>
                        )}
                    </div>
                ) : (
                    filteredContracts.map(c => {
                        const days = differenceInDays(new Date(c.cancellation_deadline), today);
                        const isUrgent = days <= 30;
                        const isCritical = days <= 90;
                        const cancellationReminder = getReminderPriority({ dueDate: c.cancellation_deadline, kind: "Kündigungsfenster" });
                        const endReminder = c.end_date ? getReminderPriority({ dueDate: c.end_date, kind: "Vertragsende" }) : null;
                        const nextAction = VVL_STAGE_MACHINE[c.vvl_status || "offen"]?.next;

                        return (
                            <motion.div variants={itemVariants} key={c.id}>
                                <Card
                                    onClick={() => navigate(`${createPageUrl('ContractDetail')}?id=${c.id}`)}
                                    className={cn(
                                        "group relative overflow-hidden transition-all duration-300 cursor-pointer border rounded-3xl",
                                        // High Contrast for Urgent Items
                                        isUrgent
                                            ? "bg-rose-500/10 border-rose-500/30 hover:border-rose-500 hover:shadow-[0_0_30px_rgba(244,63,94,0.2)]"
                                            : "glass-card card-premium hover:border-primary/50"
                                    )}
                                >
                                    {/* Status Indicator Bar */}
                                    <div className={cn("absolute top-0 left-0 right-0 h-1", isUrgent ? "bg-rose-500" : isCritical ? "bg-amber-500" : "bg-emerald-500")} />

                                    <div className="p-5 flex flex-col h-full justify-between gap-3">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-border text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                                                    {c.provider_name}
                                                </Badge>
                                                {isUrgent && <Badge className="bg-rose-500 text-white border-none font-bold ">DRINGEND</Badge>}
                                            </div>

                                            <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
                                                {c.customer_name}
                                            </h3>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{c.category}</p>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="p-3 rounded-2xl bg-secondary/30 border border-border/50 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Frist</span>
                                                    <span className={cn("text-xs font-bold", isUrgent ? "text-rose-500" : "text-foreground")}>
                                                        {days} Tage
                                                    </span>
                                                </div>
                                                <div className="text-lg font-mono font-black text-foreground">
                                                    {format(new Date(c.cancellation_deadline), 'dd.MM.yyyy')}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                                                <Badge className={cn("border", cancellationReminder.level === "dringend" ? "bg-rose-500/15 text-rose-400 border-rose-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30")}>
                                                    {cancellationReminder.label}
                                                </Badge>
                                                {endReminder && (
                                                    <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 border">
                                                        Ende: {endReminder.label}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground pt-2 border-t border-border/10">
                                                <span className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                                                    <User className="h-3.5 w-3.5" /> Profil
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {nextAction && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-[10px]"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                advanceMutation.mutate({ contract: c, nextStatus: nextAction });
                                                            }}
                                                        >
                                                            {VVL_STAGE_MACHINE[c.vvl_status || "offen"]?.actionLabel}
                                                        </Button>
                                                    )}
                                                    <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })
                )}
            </motion.div>

        </div>
    );
}
