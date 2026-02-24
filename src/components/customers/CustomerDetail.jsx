import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  X, Phone, Mail, MapPin, Calendar, 
  FileText, Save, AlertTriangle,
  DollarSign, Clock
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

const statusColors = {
  aktiv: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  gekündigt: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  abgelaufen: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  verlängert: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  pausiert: "bg-amber-500/15 text-amber-400 border-amber-500/30"
};

export default function CustomerDetail({ customer, onClose, onEdit }) {
  const [notes, setNotes] = useState(customer.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const queryClient = useQueryClient();

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', customer.id],
    queryFn: async () => {
      const allContracts = await base44.entities.Contract.list();
      return allContracts.filter(c => c.customer_id === customer.id);
    }
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', customer.id],
    queryFn: async () => {
      const allTasks = await base44.entities.Task.list();
      return allTasks.filter(t => t.customer_id === customer.id);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Customer.update(customer.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsSavingNotes(false);
    }
  });

  const handleSaveNotes = () => {
    setIsSavingNotes(true);
    updateMutation.mutate({ notes });
  };

  const activeContracts = contracts.filter(c => c.status === 'aktiv');
  const totalMonthlyFees = activeContracts.reduce((sum, c) => sum + (c.monthly_fee || 0), 0);
  const totalCommission = contracts.reduce((sum, c) => sum + (c.total_commission || 0), 0);

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      {/* Header */}
      <div className="flex-shrink-0 flex items-start justify-between p-6 border-b border-[#2D3139]">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#FFD24D] to-[#FFA500] flex items-center justify-center text-[#0F1115] font-bold text-2xl">
            {customer.first_name?.[0]}{customer.last_name?.[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#EAECEF]">
              {customer.first_name} {customer.last_name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={cn(
                "text-xs",
                customer.customer_type === "geschäftlich" 
                  ? "bg-violet-500/15 text-violet-400 border-violet-500/30" 
                  : "bg-slate-500/15 text-slate-400 border-slate-500/30"
              )}>
                {customer.customer_type === "geschäftlich" ? "Geschäftskunde" : "Privatkunde"}
              </Badge>
              {customer.branch_name && (
                <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-xs">
                  {customer.branch_name}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-4 p-6 border-b border-[#2D3139]">
        <Card className="p-4 bg-[#1F2228] border-[#2D3139]">
          <p className="text-xs text-[#6B7280] mb-1">Aktive Verträge</p>
          <p className="text-2xl font-bold text-[#EAECEF]">{activeContracts.length}</p>
        </Card>
        <Card className="p-4 bg-[#1F2228] border-[#2D3139]">
          <p className="text-xs text-[#6B7280] mb-1">Monatliche Gebühren</p>
          <p className="text-2xl font-bold text-[#EAECEF]">{totalMonthlyFees.toFixed(2)} €</p>
        </Card>
        <Card className="p-4 bg-[#1F2228] border-[#2D3139]">
          <p className="text-xs text-[#6B7280] mb-1">Gesamtprovision</p>
          <p className="text-2xl font-bold text-[#FFD24D]">{totalCommission.toFixed(2)} €</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
        <TabsList className="flex-shrink-0 mx-6 mt-4 bg-[#1F2228]">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#FFD24D] data-[state=active]:text-[#0F1115]">
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="contracts" className="data-[state=active]:bg-[#FFD24D] data-[state=active]:text-[#0F1115]">
            Verträge ({contracts.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-[#FFD24D] data-[state=active]:text-[#0F1115]">
            Aufgaben ({tasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {/* Contact Info */}
          <Card className="p-5 bg-[#1F2228] border-[#2D3139]">
            <h3 className="font-semibold text-[#EAECEF] mb-4">Kontaktinformationen</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-[#6B7280]" />
                <span className="text-[#9CA3AF]">Telefon:</span>
                <span className="text-[#EAECEF] font-medium">{customer.phone}</span>
              </div>
              {customer.whatsapp && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-[#6B7280]" />
                  <span className="text-[#9CA3AF]">WhatsApp:</span>
                  <span className="text-[#EAECEF] font-medium">{customer.whatsapp}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-[#6B7280]" />
                  <span className="text-[#9CA3AF]">E-Mail:</span>
                  <span className="text-[#EAECEF] font-medium">{customer.email}</span>
                </div>
              )}
              {customer.birth_date && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-[#6B7280]" />
                  <span className="text-[#9CA3AF]">Geburtsdatum:</span>
                  <span className="text-[#EAECEF] font-medium">
                    {format(new Date(customer.birth_date), 'dd.MM.yyyy', { locale: de })}
                  </span>
                </div>
              )}
              {(customer.address || customer.city) && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-[#6B7280] mt-0.5" />
                  <div>
                    <span className="text-[#9CA3AF]">Adresse:</span>
                    <p className="text-[#EAECEF] font-medium">
                      {customer.address}<br />
                      {customer.postal_code} {customer.city}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Notes */}
          <Card className="p-5 bg-[#1F2228] border-[#2D3139]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#EAECEF]">Interne Notizen</h3>
              <Button
                size="sm"
                onClick={handleSaveNotes}
                disabled={isSavingNotes || notes === customer.notes}
                className="bg-gradient-to-r from-[#FFD24D] to-[#FFA500] text-[#0F1115] hover:from-[#E6BC3A] hover:to-[#E69500]"
              >
                <Save className="h-3 w-3 mr-1" />
                Speichern
              </Button>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notizen zum Kunden..."
              rows={6}
              className="bg-[#0F1115] border-[#2D3139] text-[#EAECEF]"
            />
          </Card>

          {/* Documents Placeholder */}
          <Card className="p-5 bg-[#1F2228] border-[#2D3139]">
            <h3 className="font-semibold text-[#EAECEF] mb-4">Dokumente</h3>
            <div className="text-center py-8 text-[#6B7280]">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Dokumenten-Upload folgt in Kürze</p>
              <p className="text-xs mt-1">Ausweis • Bankkarte • Verträge</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="flex-1 overflow-y-auto p-6 min-h-0">
          {contracts.length === 0 ? (
            <Card className="p-12 text-center bg-[#1F2228] border-[#2D3139]">
              <FileText className="h-12 w-12 mx-auto text-[#6B7280] mb-4" />
              <h3 className="text-lg font-semibold text-[#EAECEF] mb-1">Keine Verträge</h3>
              <p className="text-[#6B7280]">Dieser Kunde hat noch keine Verträge.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {contracts.map(contract => {
                const daysUntilDeadline = contract.cancellation_deadline 
                  ? differenceInDays(new Date(contract.cancellation_deadline), new Date())
                  : null;
                const isExpiring = daysUntilDeadline !== null && daysUntilDeadline >= 0 && daysUntilDeadline <= 30;

                return (
                  <Card key={contract.id} className="p-5 bg-[#1F2228] border-[#2D3139] hover:border-[#FFD24D]/30 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h4 className="font-semibold text-[#EAECEF]">{contract.provider_name}</h4>
                          <Badge className={cn("text-xs border", statusColors[contract.status])}>
                            {contract.status}
                          </Badge>
                          {isExpiring && (
                            <Badge className="text-xs bg-rose-500/15 text-rose-400 border-rose-500/30">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {daysUntilDeadline} Tage
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#9CA3AF]">
                          <span className="text-[#FFD24D]">{contract.category}</span>
                          {contract.contract_number && (
                            <>
                              <span>•</span>
                              <span>Nr. {contract.contract_number}</span>
                            </>
                          )}
                          {contract.start_date && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(contract.start_date), 'dd.MM.yyyy')}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {contract.monthly_fee && (
                          <p className="text-sm text-[#9CA3AF]">
                            {contract.monthly_fee.toFixed(2)} €<span className="text-xs">/Monat</span>
                          </p>
                        )}
                        {contract.total_commission && (
                          <p className="text-sm font-semibold text-[#FFD24D] flex items-center gap-1 justify-end">
                            <DollarSign className="h-3 w-3" />
                            {contract.total_commission.toFixed(2)} €
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="flex-1 overflow-y-auto p-6 min-h-0">
          {tasks.length === 0 ? (
            <Card className="p-12 text-center bg-[#1F2228] border-[#2D3139]">
              <Clock className="h-12 w-12 mx-auto text-[#6B7280] mb-4" />
              <h3 className="text-lg font-semibold text-[#EAECEF] mb-1">Keine Aufgaben</h3>
              <p className="text-[#6B7280]">Keine Aufgaben für diesen Kunden.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <Card key={task.id} className="p-4 bg-[#1F2228] border-[#2D3139]">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-[#EAECEF]">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-[#9CA3AF] mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {task.due_date && (
                          <span className="text-xs text-[#6B7280]">
                            Fällig: {format(new Date(task.due_date), 'dd.MM.yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge className={cn(
                      "text-xs",
                      task.status === "erledigt" ? "bg-emerald-500/15 text-emerald-400" :
                      task.status === "in_bearbeitung" ? "bg-blue-500/15 text-blue-400" :
                      "bg-amber-500/15 text-amber-400"
                    )}>
                      {task.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}