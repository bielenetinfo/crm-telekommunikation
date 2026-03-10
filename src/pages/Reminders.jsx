import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Bell, Check, Calendar, Mail, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ENTITY_STATUS_MODELS } from "@/lib/statusModels";
import { validateStatusTransition } from "@/lib/validators";
import { logStatusChange } from "@/components/utils/historyLogger";

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
  offen: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  versendet: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  erledigt: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  ignoriert: "bg-slate-500/15 text-slate-400 border-slate-500/30"
};

const typeColors = {
  "30d": "bg-blue-500/15 text-blue-400",
  "14d": "bg-cyan-500/15 text-cyan-400",
  "7d": "bg-amber-500/15 text-amber-400",
  "1d": "bg-rose-500/15 text-rose-400",
  "expired": "bg-rose-600/15 text-rose-500"
};

export default function Reminders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("offen");
  const queryClient = useQueryClient();
  const reminderStatusOptions = ENTITY_STATUS_MODELS.reminders.statuses;

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => base44.entities.Reminder.list('-created_date')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, reminder }) => {
      await base44.entities.Reminder.update(id, data);
      if (reminder?.status !== data.status) {
        await logStatusChange({
          entity: 'Reminder',
          fromStatus: reminder?.status,
          toStatus: data.status,
          customerId: reminder?.customer_id,
          customerName: reminder?.customer_name,
          contractId: reminder?.contract_id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    }
  });

  const handleSend = async (reminder, via) => {
    validateStatusTransition({ entityKey: 'reminders', fromStatus: reminder.status, toStatus: 'versendet' });
    updateMutation.mutate({
      id: reminder.id,
      data: {
        status: 'versendet',
        sent_date: format(new Date(), 'yyyy-MM-dd'),
        sent_via: via
      },
      reminder
    });
  };

  const handleStatusChange = (reminder, status) => {
    validateStatusTransition({ entityKey: 'reminders', fromStatus: reminder.status, toStatus: status });
    updateMutation.mutate({
      id: reminder.id,
      data: { status },
      reminder
    });
  };

  const filteredReminders = reminders.filter(r => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      r.customer_name?.toLowerCase().includes(searchLower) ||
      r.contract_number?.toLowerCase().includes(searchLower) ||
      r.provider_name?.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === "all" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="app-page-shell">
      {/* Header - Dashboard Pattern */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="app-page-title">
            Erinnerungen
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            {reminders.length} Erinnerungen
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen nach Kunde, Vertragsnummer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-secondary border-border text-foreground"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-secondary">
            {reminderStatusOptions.map(status => (
              <TabsTrigger key={status} value={status} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </TabsTrigger>
            ))}
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Alle</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Reminders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6 bg-card border-border">
              <div className="h-4 bg-secondary rounded w-1/3 mb-2" />
              <div className="h-3 bg-secondary rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : filteredReminders.length === 0 ? (
        <Card className="p-12 text-center bg-card border-border">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">Keine Erinnerungen gefunden</h3>
          <p className="text-muted-foreground">Erinnerungen werden automatisch für ablaufende Verträge erstellt.</p>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {filteredReminders.map(reminder => {
            const daysUntil = reminder.days_until_deadline || 0;
            return (
              <motion.div variants={itemVariants} key={reminder.id}>
                <Card
                  className="p-5 glass-card card-premium overflow-hidden border-transparent hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    {/* Icon & Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0",
                        daysUntil <= 7 ? "bg-rose-500/20" :
                          daysUntil <= 14 ? "bg-amber-500/20" :
                            "bg-blue-500/20"
                      )}>
                        <Bell className={cn(
                          "h-6 w-6",
                          daysUntil <= 7 ? "text-rose-400" :
                            daysUntil <= 14 ? "text-amber-400" :
                              "text-blue-400"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-foreground">{reminder.customer_name}</h3>
                          <Badge className={cn("text-xs border", statusColors[reminder.status])}>
                            {reminder.status}
                          </Badge>
                          <Badge className={cn("text-xs", typeColors[reminder.reminder_type])}>
                            {reminder.reminder_type}
                          </Badge>
                          {daysUntil >= 0 && (
                            <Badge className={cn(
                              "text-xs",
                              daysUntil <= 7 ? "bg-rose-500/15 text-rose-400" :
                                daysUntil <= 14 ? "bg-amber-500/15 text-amber-400" :
                                  "bg-blue-500/15 text-blue-400"
                            )}>
                              {daysUntil} Tage
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="font-medium text-primary">{reminder.provider_name}</span>
                          {reminder.contract_number && (
                            <>
                              <span>•</span>
                              <span>Nr. {reminder.contract_number}</span>
                            </>
                          )}
                          {reminder.cancellation_deadline && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Frist: {format(new Date(reminder.cancellation_deadline), 'dd.MM.yyyy', { locale: de })}</span>
                              </div>
                            </>
                          )}
                        </div>
                        {reminder.sent_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Versendet: {format(new Date(reminder.sent_date), 'dd.MM.yyyy', { locale: de })} via {reminder.sent_via}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {reminder.status === 'offen' && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSend(reminder, 'email')}
                          className="border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          E-Mail
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSend(reminder, 'whatsapp')}
                          className="border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          WhatsApp
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(reminder, 'erledigt')}
                          className="border-border text-muted-foreground hover:border-emerald-500/30 hover:text-emerald-400"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {reminder.status === 'versendet' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(reminder, 'erledigt')}
                        className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Als erledigt markieren
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}