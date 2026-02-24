import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, Check, FileText, ArrowRight, ArrowLeft, 
  CheckCircle2, XCircle, Clock, Sparkles, TrendingUp, Euro, Users,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { format, addDays, addMonths, subDays } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const STEPS = [
  { id: 1, label: "Vertrag", icon: FileText },
  { id: 2, label: "Verlängerung", icon: RefreshCw },
  { id: 3, label: "Details", icon: Euro },
  { id: 4, label: "Ergebnis", icon: CheckCircle2 },
  { id: 5, label: "Abschluss", icon: Sparkles }
];

export default function VvlWizard({ open, onOpenChange, contract, customer, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: () => base44.entities.Provider.list(),
    enabled: open
  });

  const [formData, setFormData] = useState({
    vvlType: "tarifwechsel",
    outcome: "",
    
    // Provider & Tarif
    newProviderId: contract?.provider_id || "",
    newProviderName: contract?.provider_name || "",
    newTariffName: "",
    tariffDetails: "",
    newContractNumber: "",
    
    // Preise & Provisionen
    newMonthlyFee: "",
    newCommission: "",
    oneTimeBonus: "",
    
    // Laufzeit
    contractDurationMonths: 24,
    validFrom: format(new Date(), 'yyyy-MM-dd'),
    
    // Follow-up
    followupDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    followupType: "call",
    rejectionReason: "",
    notes: ""
  });

  // Auto-calculate dates
  const [calculatedDates, setCalculatedDates] = useState({
    newEndDate: null,
    newCancellationDeadline: null
  });

  useEffect(() => {
    if (contract && open) {
      setFormData(prev => ({
        ...prev,
        newProviderId: contract.provider_id || "",
        newProviderName: contract.provider_name || "",
        newMonthlyFee: contract.monthly_fee?.toString() || "",
        newCommission: contract.commission?.toString() || "",
        newTariffName: contract.tariff_name || ""
      }));
    }
  }, [contract, open]);

  useEffect(() => {
    if (formData.validFrom && formData.contractDurationMonths) {
      const endDate = addMonths(new Date(formData.validFrom), formData.contractDurationMonths);
      const cancellationDeadline = subDays(endDate, contract?.notice_period_days || 30);
      
      setCalculatedDates({
        newEndDate: format(endDate, 'yyyy-MM-dd'),
        newCancellationDeadline: format(cancellationDeadline, 'yyyy-MM-dd')
      });
    }
  }, [formData.validFrom, formData.contractDurationMonths, contract?.notice_period_days]);

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const provider = providers.find(p => p.id === formData.newProviderId);
      
      // Calculate deltas
      const oldMonthlyFee = contract.monthly_fee || 0;
      const newMonthlyFee = parseFloat(formData.newMonthlyFee) || 0;
      const oldCommission = contract.commission || 0;
      const newCommission = parseFloat(formData.newCommission) || 0;
      const priceDelta = newMonthlyFee - oldMonthlyFee;
      const commissionDelta = newCommission - oldCommission;

      // 1. Create VVL Record
      const vvlRecord = await base44.entities.VvlRecord.create({
        contract_id: contract.id,
        customer_id: contract.customer_id,
        customer_name: contract.customer_name,
        vvl_type: formData.vvlType,
        outcome: formData.outcome,
        old_provider_id: contract.provider_id,
        old_provider_name: contract.provider_name,
        new_provider_id: formData.newProviderId,
        new_provider_name: provider?.name || formData.newProviderName,
        old_monthly_fee: oldMonthlyFee,
        new_monthly_fee: newMonthlyFee,
        old_commission: oldCommission,
        new_commission: newCommission,
        one_time_bonus: parseFloat(formData.oneTimeBonus) || 0,
        old_tariff_name: contract.tariff_name || "",
        new_tariff_name: formData.newTariffName,
        tariff_details: formData.tariffDetails,
        contract_duration_months: formData.contractDurationMonths,
        new_end_date: calculatedDates.newEndDate,
        new_cancellation_deadline: calculatedDates.newCancellationDeadline,
        valid_from: formData.validFrom,
        new_contract_number: formData.newContractNumber,
        rejection_reason: formData.rejectionReason,
        follow_up_date: formData.outcome === 'follow_up' ? formData.followupDate : null,
        follow_up_type: formData.outcome === 'follow_up' ? formData.followupType : null,
        notes: formData.notes,
        commission_delta: commissionDelta,
        price_delta: priceDelta
      });

      // 2. Update Contract
      const newStatus = formData.outcome === 'verlängert' ? 'verlängert' : 
                       formData.outcome === 'gekündigt' ? 'gekündigt' : 'aktiv';
      const newVvlStatus = formData.outcome === 'verlängert' ? 'verlängert' : 
                          formData.outcome === 'follow_up' ? 'in_bearbeitung' : 
                          formData.outcome === 'gekündigt' ? 'gekündigt' : 'abgelehnt';

      const contractUpdate = {
        vvl_status: newVvlStatus,
        status: newStatus,
        last_vvl_date: format(new Date(), 'yyyy-MM-dd'),
        last_vvl_id: vvlRecord.id
      };

      // Update values if successfully extended
      if (formData.outcome === 'verlängert') {
        // Bei Anbieterwechsel: alten Vertrag als "ersetzt" markieren und neuen erstellen
        if (formData.vvlType === 'anbieterwechsel' && formData.newProviderId !== contract.provider_id) {
          // Mark old contract as replaced
          contractUpdate.status = 'ersetzt';
          contractUpdate.vvl_status = 'verlängert';
          
          await base44.entities.Contract.update(contract.id, contractUpdate);

          // Create new contract
          const newContract = await base44.entities.Contract.create({
            customer_id: contract.customer_id,
            customer_name: contract.customer_name,
            provider_id: formData.newProviderId,
            provider_name: provider?.name || formData.newProviderName,
            category: contract.category,
            tariff_name: formData.newTariffName,
            tariff_details: formData.tariffDetails,
            start_date: formData.validFrom,
            end_date: calculatedDates.newEndDate,
            cancellation_deadline: calculatedDates.newCancellationDeadline,
            contract_duration_months: formData.contractDurationMonths,
            notice_period_days: contract.notice_period_days,
            monthly_fee: newMonthlyFee,
            commission: newCommission,
            contract_number: formData.newContractNumber || "",
            status: 'aktiv',
            vvl_status: 'offen',
            is_renewal: true,
            branch_id: contract.branch_id,
            branch_name: contract.branch_name
          });

          // Link contracts
          await base44.entities.Contract.update(contract.id, {
            replaced_by_contract_id: newContract.id
          });

          return; // Skip normal update
        }

        // Normal update (same provider)
        contractUpdate.provider_id = formData.newProviderId;
        contractUpdate.provider_name = provider?.name || formData.newProviderName;
        contractUpdate.monthly_fee = newMonthlyFee;
        contractUpdate.commission = newCommission;
        contractUpdate.tariff_name = formData.newTariffName;
        contractUpdate.tariff_details = formData.tariffDetails;
        contractUpdate.end_date = calculatedDates.newEndDate;
        contractUpdate.cancellation_deadline = calculatedDates.newCancellationDeadline;
        if (formData.newContractNumber) {
          contractUpdate.contract_number = formData.newContractNumber;
        }
      }

      await base44.entities.Contract.update(contract.id, contractUpdate);

      // 3. Customer History Entry
      const vvlTypeLabel = {
        tarifwechsel: "Tarifwechsel",
        konditionsanpassung: "Konditionsanpassung",
        neuabschluss: "Neuabschluss",
        anbieterwechsel: "Anbieterwechsel"
      }[formData.vvlType];

      const outcomeLabel = {
        verlängert: "erfolgreich verlängert",
        follow_up: "Follow-up notwendig",
        gekündigt: "gekündigt",
        abgelehnt: "abgelehnt"
      }[formData.outcome];

      let historyTitle = `VVL ${outcomeLabel}`;
      if (formData.vvlType === 'anbieterwechsel' && formData.outcome === 'verlängert') {
        historyTitle = `Anbieterwechsel: ${contract.provider_name} → ${provider?.name || formData.newProviderName}`;
      }

      let historyNotes = `${vvlTypeLabel}`;
      if (formData.outcome === 'verlängert') {
        historyNotes += `\n\n📊 Vorher → Nachher:`;
        historyNotes += `\n• Preis: ${oldMonthlyFee.toFixed(2)}€ → ${newMonthlyFee.toFixed(2)}€ (${priceDelta >= 0 ? '+' : ''}${priceDelta.toFixed(2)}€)`;
        historyNotes += `\n• Provision: ${oldCommission.toFixed(2)}€ → ${newCommission.toFixed(2)}€ (${commissionDelta >= 0 ? '+' : ''}${commissionDelta.toFixed(2)}€)`;
        if (formData.oneTimeBonus && parseFloat(formData.oneTimeBonus) > 0) {
          historyNotes += `\n• Einmalbonus: ${parseFloat(formData.oneTimeBonus).toFixed(2)}€`;
        }
        if (formData.newTariffName) {
          historyNotes += `\n• Tarif: ${formData.newTariffName}`;
        }
        if (formData.tariffDetails) {
          historyNotes += `\n• Details: ${formData.tariffDetails}`;
        }
        historyNotes += `\n• Laufzeit: ${formData.contractDurationMonths} Monate`;
        historyNotes += `\n• Gültig ab: ${format(new Date(formData.validFrom), 'dd.MM.yyyy', { locale: de })}`;
      }
      if (formData.notes) {
        historyNotes += `\n\n${formData.notes}`;
      }

      await base44.entities.CustomerHistory.create({
        customer_id: contract.customer_id,
        customer_name: contract.customer_name,
        type: "sales",
        title: historyTitle,
        notes: historyNotes,
        channel: "store",
        status: formData.outcome === 'follow_up' ? "open" : "done",
        occurred_at: new Date().toISOString(),
        due_at: formData.outcome === 'follow_up' ? new Date(formData.followupDate).toISOString() : null,
        contract_id: contract.id,
        priority: "high",
        tags: JSON.stringify(["vvl", formData.vvlType]),
        is_system_event: false
      });

      // 4. Follow-up (if needed)
      if (formData.outcome === 'follow_up') {
        await base44.entities.Followup.create({
          contract_id: contract.id,
          customer_id: contract.customer_id,
          customer_name: contract.customer_name,
          provider_name: contract.provider_name,
          due_date: formData.followupDate,
          type: formData.followupType,
          note: `VVL Follow-up: ${vvlTypeLabel}`,
          status: 'open',
          vvl_action: 'in_bearbeitung'
        });
      }

      // 5. Activity Log
      await base44.entities.Activity.create({
        type: 'vvl_started',
        customer_id: contract.customer_id,
        customer_name: contract.customer_name,
        contract_id: contract.id,
        short_text: historyTitle
      });

      toast.success('VVL erfolgreich abgeschlossen');
      onComplete?.();
      onOpenChange(false);
      
      // Reset
      setCurrentStep(1);
      setFormData({
        vvlType: "tarifwechsel",
        outcome: "",
        newProviderId: "",
        newProviderName: "",
        newTariffName: "",
        tariffDetails: "",
        newContractNumber: "",
        newMonthlyFee: "",
        newCommission: "",
        oneTimeBonus: "",
        contractDurationMonths: 24,
        validFrom: format(new Date(), 'yyyy-MM-dd'),
        followupDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
        followupType: "call",
        rejectionReason: "",
        notes: ""
      });
    } catch (error) {
      console.error('VVL failed:', error);
      toast.error('VVL konnte nicht abgeschlossen werden');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 2) return formData.vvlType;
    if (currentStep === 3) {
      if (formData.vvlType === 'anbieterwechsel' && !formData.newProviderId) return false;
      return formData.newMonthlyFee && formData.newCommission;
    }
    if (currentStep === 4) return formData.outcome;
    return true;
  };

  const oldMonthlyFee = contract?.monthly_fee || 0;
  const newMonthlyFee = parseFloat(formData.newMonthlyFee) || 0;
  const oldCommission = contract?.commission || 0;
  const newCommission = parseFloat(formData.newCommission) || 0;
  const priceDelta = newMonthlyFee - oldMonthlyFee;
  const commissionDelta = newCommission - oldCommission;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#181B21] border-[#2D3139] max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <DialogTitle className="text-2xl text-[#EAECEF] mb-1">
                Vertragsverlängerung (VVL)
              </DialogTitle>
              <p className="text-sm text-[#6B7280]">
                {contract?.provider_name} • {contract?.customer_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-8 w-8 text-[#FFD24D]" />
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-1">
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center transition-all",
                      isCompleted ? "bg-emerald-500" : isActive ? "bg-[#FFD24D]" : "bg-[#2D3139]"
                    )}>
                      {isCompleted ? (
                        <Check className="h-3 w-3 text-white" />
                      ) : (
                        <StepIcon className={cn(
                          "h-3 w-3",
                          isActive ? "text-[#0F1115]" : "text-[#6B7280]"
                        )} />
                      )}
                    </div>
                    <span className={cn(
                      "text-xs font-medium whitespace-nowrap",
                      isActive ? "text-[#FFD24D]" : isCompleted ? "text-emerald-400" : "text-[#6B7280]"
                    )}>
                      {step.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={cn(
                      "h-0.5 flex-1 mx-1 transition-colors",
                      isCompleted ? "bg-emerald-500" : "bg-[#2D3139]"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        <div className="py-6 min-h-[320px]">
          {/* Step 1: Vertrag */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-[#1F2228] rounded-lg border border-[#2D3139]">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[#EAECEF] mb-1">{contract?.provider_name}</h3>
                    <p className="text-sm text-[#9CA3AF]">{contract?.category}</p>
                    {contract?.tariff_name && (
                      <p className="text-xs text-[#6B7280] mt-1">Tarif: {contract.tariff_name}</p>
                    )}
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                    Aktiv
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {contract?.start_date && (
                    <div>
                      <p className="text-[#6B7280] text-xs mb-1">Beginn</p>
                      <p className="text-[#EAECEF]">{format(new Date(contract.start_date), 'dd.MM.yyyy', { locale: de })}</p>
                    </div>
                  )}
                  {contract?.cancellation_deadline && (
                    <div>
                      <p className="text-[#6B7280] text-xs mb-1">Kündigungsfrist</p>
                      <p className="text-amber-400 font-semibold">
                        {format(new Date(contract.cancellation_deadline), 'dd.MM.yyyy', { locale: de })}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[#6B7280] text-xs mb-1">Monatlich</p>
                    <p className="text-[#EAECEF]">{(contract?.monthly_fee || 0).toFixed(2)} €</p>
                  </div>
                  <div>
                    <p className="text-[#6B7280] text-xs mb-1">Provision</p>
                    <p className="text-[#FFD24D] font-semibold">{(contract?.commission || 0).toFixed(2)} €</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-400">
                  ℹ️ Dieser Wizard führt Sie durch die VVL und speichert automatisch alle neuen Werte, Provisionen und Historie.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Art der Verlängerung */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-[#EAECEF] mb-3 block">Art der Verlängerung</Label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: "tarifwechsel", label: "Tarifwechsel", desc: "Neuer Tarif beim gleichen Provider", icon: TrendingUp },
                    { value: "konditionsanpassung", label: "Konditionsanpassung", desc: "Preis/Laufzeit angepasst", icon: RefreshCw },
                    { value: "neuabschluss", label: "Neuabschluss", desc: "Neuer Vertrag beim gleichen Provider", icon: Sparkles },
                    { value: "anbieterwechsel", label: "Anbieterwechsel", desc: "Wechsel zu neuem Provider", icon: Users }
                  ].map(option => {
                    const OptionIcon = option.icon;
                    const isSelected = formData.vvlType === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFormData({...formData, vvlType: option.value})}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all text-left",
                          isSelected 
                            ? "border-[#FFD24D] bg-[#FFD24D]/10" 
                            : "border-[#2D3139] bg-[#1F2228] hover:border-[#FFD24D]/50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <OptionIcon className={cn("h-5 w-5 mt-0.5", isSelected ? "text-[#FFD24D]" : "text-[#6B7280]")} />
                          <div>
                            <p className={cn("font-semibold mb-1", isSelected ? "text-[#FFD24D]" : "text-[#EAECEF]")}>
                              {option.label}
                            </p>
                            <p className="text-sm text-[#6B7280]">{option.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Details (Preis, Provision, etc.) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {formData.vvlType === 'anbieterwechsel' && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <h4 className="text-sm font-semibold text-amber-400 mb-3">Neuer Provider</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-[#EAECEF] text-xs mb-2 block">Provider *</Label>
                      <Select 
                        value={formData.newProviderId} 
                        onValueChange={(v) => {
                          const provider = providers.find(p => p.id === v);
                          setFormData({
                            ...formData, 
                            newProviderId: v,
                            newProviderName: provider?.name || ""
                          });
                        }}
                      >
                        <SelectTrigger className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
                          <SelectValue placeholder="Provider wählen..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                          {providers.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[#EAECEF] text-xs mb-2 block">Neue Vertragsnummer (optional)</Label>
                      <Input
                        value={formData.newContractNumber}
                        onChange={(e) => setFormData({...formData, newContractNumber: e.target.value})}
                        className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                        placeholder="z.B. 12345678"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-[#1F2228] rounded-lg border border-[#2D3139]">
                <h4 className="text-sm font-semibold text-[#EAECEF] mb-3">Tarif & Details</h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-[#EAECEF] text-xs mb-2 block">Tarifname</Label>
                    <Input
                      value={formData.newTariffName}
                      onChange={(e) => setFormData({...formData, newTariffName: e.target.value})}
                      className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                      placeholder="z.B. MagentaMobil L"
                    />
                  </div>
                  <div>
                    <Label className="text-[#EAECEF] text-xs mb-2 block">Details (optional)</Label>
                    <Textarea
                      value={formData.tariffDetails}
                      onChange={(e) => setFormData({...formData, tariffDetails: e.target.value})}
                      placeholder="z.B. 20GB Datenvolumen, 5G, Allnet Flat"
                      rows={2}
                      className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#1F2228] rounded-lg border border-[#2D3139]">
                <h4 className="text-sm font-semibold text-[#EAECEF] mb-3">Preise & Provisionen *</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[#EAECEF] text-xs mb-2 block">Neuer Monatspreis *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.newMonthlyFee}
                      onChange={(e) => setFormData({...formData, newMonthlyFee: e.target.value})}
                      className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                      placeholder="39.99"
                    />
                  </div>
                  <div>
                    <Label className="text-[#EAECEF] text-xs mb-2 block">Neue Provision *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.newCommission}
                      onChange={(e) => setFormData({...formData, newCommission: e.target.value})}
                      className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                      placeholder="50.00"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[#EAECEF] text-xs mb-2 block">Einmalbonus (optional)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.oneTimeBonus}
                      onChange={(e) => setFormData({...formData, oneTimeBonus: e.target.value})}
                      className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                      placeholder="z.B. 100.00 für Hardware-Aktion"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#1F2228] rounded-lg border border-[#2D3139]">
                <h4 className="text-sm font-semibold text-[#EAECEF] mb-3">Laufzeit</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[#EAECEF] text-xs mb-2 block">Laufzeit (Monate)</Label>
                    <Select 
                      value={formData.contractDurationMonths.toString()} 
                      onValueChange={(v) => setFormData({...formData, contractDurationMonths: parseInt(v)})}
                    >
                      <SelectTrigger className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                        <SelectItem value="1">1 Monat</SelectItem>
                        <SelectItem value="12">12 Monate</SelectItem>
                        <SelectItem value="24">24 Monate</SelectItem>
                        <SelectItem value="36">36 Monate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[#EAECEF] text-xs mb-2 block">Gültig ab</Label>
                    <Input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                      className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                    />
                  </div>
                </div>
                {calculatedDates.newEndDate && (
                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-xs">
                    <p className="text-blue-400">
                      <strong>Berechnet:</strong> Ende {format(new Date(calculatedDates.newEndDate), 'dd.MM.yyyy')} • 
                      Kündigungsfrist {format(new Date(calculatedDates.newCancellationDeadline), 'dd.MM.yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Ergebnis */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <Label className="text-[#EAECEF] mb-3 block">Wie ist die VVL ausgegangen?</Label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: "verlängert", label: "Erfolgreich verlängert", desc: "Vertrag wurde verlängert", icon: CheckCircle2, color: "emerald" },
                    { value: "follow_up", label: "Follow-up notwendig", desc: "Kunde überlegt noch", icon: Clock, color: "amber" },
                    { value: "gekündigt", label: "Gekündigt", desc: "Vertrag wird beendet", icon: XCircle, color: "rose" },
                    { value: "abgelehnt", label: "Abgelehnt", desc: "Kunde möchte nicht verlängern", icon: XCircle, color: "slate" }
                  ].map(option => {
                    const OptionIcon = option.icon;
                    const isSelected = formData.outcome === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFormData({...formData, outcome: option.value})}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all text-left",
                          isSelected 
                            ? `border-${option.color}-500 bg-${option.color}-500/10` 
                            : "border-[#2D3139] bg-[#1F2228] hover:border-[#2D3139]/80"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <OptionIcon className={cn(
                            "h-5 w-5 mt-0.5",
                            isSelected ? `text-${option.color}-400` : "text-[#6B7280]"
                          )} />
                          <div>
                            <p className={cn(
                              "font-semibold mb-1",
                              isSelected ? `text-${option.color}-400` : "text-[#EAECEF]"
                            )}>
                              {option.label}
                            </p>
                            <p className="text-sm text-[#6B7280]">{option.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {formData.outcome === 'follow_up' && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-3">
                  <p className="text-sm text-amber-400 font-medium">Follow-up konfigurieren</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[#EAECEF] text-xs mb-2 block">Fällig am</Label>
                      <Input
                        type="date"
                        value={formData.followupDate}
                        onChange={(e) => setFormData({...formData, followupDate: e.target.value})}
                        className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#EAECEF] text-xs mb-2 block">Typ</Label>
                      <Select 
                        value={formData.followupType} 
                        onValueChange={(v) => setFormData({...formData, followupType: v})}
                      >
                        <SelectTrigger className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                          <SelectItem value="call">Anruf</SelectItem>
                          <SelectItem value="message">Nachricht</SelectItem>
                          <SelectItem value="in_store">Im Laden</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {formData.outcome === 'abgelehnt' && (
                <div>
                  <Label className="text-[#EAECEF] text-xs mb-2 block">Ablehnungsgrund (optional)</Label>
                  <Textarea
                    value={formData.rejectionReason}
                    onChange={(e) => setFormData({...formData, rejectionReason: e.target.value})}
                    placeholder="z.B. zu teuer, wechselt zu anderem Anbieter..."
                    rows={2}
                    className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                  />
                </div>
              )}

              <div>
                <Label className="text-[#EAECEF] mb-2 block">Notizen (optional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Zusätzliche Anmerkungen..."
                  rows={3}
                  className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                />
              </div>
            </div>
          )}

          {/* Step 5: Zusammenfassung */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-400 mb-1">Bereit zum Abschluss</h3>
                    <p className="text-sm text-emerald-300/80">
                      Alle Werte werden gespeichert und in der Historie dokumentiert
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-[#1F2228] rounded-lg border border-[#2D3139]">
                  <p className="text-xs text-[#6B7280] mb-1">Ergebnis</p>
                  <p className="text-sm text-[#EAECEF] font-medium">
                    {{
                      verlängert: "✓ Erfolgreich verlängert",
                      follow_up: "⏱ Follow-up notwendig",
                      gekündigt: "✗ Gekündigt",
                      abgelehnt: "✗ Abgelehnt"
                    }[formData.outcome]}
                  </p>
                </div>

                {formData.outcome === 'verlängert' && (
                  <>
                    {formData.vvlType === 'anbieterwechsel' && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <p className="text-xs text-amber-400 mb-1">Anbieterwechsel</p>
                        <p className="text-sm text-amber-300 font-medium">
                          {contract?.provider_name} → {formData.newProviderName}
                        </p>
                      </div>
                    )}

                    <div className="p-4 bg-[#1F2228] rounded-lg border border-[#2D3139]">
                      <p className="text-xs text-[#6B7280] mb-3">Vorher → Nachher</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#9CA3AF]">Monatspreis</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[#6B7280]">{oldMonthlyFee.toFixed(2)}€</span>
                            <ArrowRight className="h-3 w-3 text-[#6B7280]" />
                            <span className="text-[#EAECEF] font-semibold">{newMonthlyFee.toFixed(2)}€</span>
                            {priceDelta !== 0 && (
                              <Badge className={cn(
                                "text-xs",
                                priceDelta > 0 ? "bg-rose-500/15 text-rose-400" : "bg-emerald-500/15 text-emerald-400"
                              )}>
                                {priceDelta > 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                                {Math.abs(priceDelta).toFixed(2)}€
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#9CA3AF]">Provision</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[#6B7280]">{oldCommission.toFixed(2)}€</span>
                            <ArrowRight className="h-3 w-3 text-[#6B7280]" />
                            <span className="text-[#FFD24D] font-semibold">{newCommission.toFixed(2)}€</span>
                            {commissionDelta !== 0 && (
                              <Badge className={cn(
                                "text-xs",
                                commissionDelta > 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                              )}>
                                {commissionDelta > 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                                {Math.abs(commissionDelta).toFixed(2)}€
                              </Badge>
                            )}
                          </div>
                        </div>
                        {formData.oneTimeBonus && parseFloat(formData.oneTimeBonus) > 0 && (
                          <div className="flex items-center justify-between text-sm pt-2 border-t border-[#2D3139]">
                            <span className="text-[#9CA3AF]">Einmalbonus</span>
                            <span className="text-emerald-400 font-semibold">+{parseFloat(formData.oneTimeBonus).toFixed(2)}€</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {formData.newTariffName && (
                      <div className="p-3 bg-[#1F2228] rounded-lg border border-[#2D3139]">
                        <p className="text-xs text-[#6B7280] mb-1">Tarif</p>
                        <p className="text-sm text-[#EAECEF] font-medium">{formData.newTariffName}</p>
                        {formData.tariffDetails && (
                          <p className="text-xs text-[#9CA3AF] mt-1">{formData.tariffDetails}</p>
                        )}
                      </div>
                    )}

                    <div className="p-3 bg-[#1F2228] rounded-lg border border-[#2D3139]">
                      <p className="text-xs text-[#6B7280] mb-1">Laufzeit</p>
                      <p className="text-sm text-[#EAECEF]">
                        {formData.contractDurationMonths} Monate • Gültig ab {format(new Date(formData.validFrom), 'dd.MM.yyyy', { locale: de })}
                      </p>
                    </div>
                  </>
                )}

                {formData.outcome === 'follow_up' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-xs text-amber-400 mb-1">Follow-up</p>
                    <p className="text-sm text-amber-300">
                      {formData.followupType === 'call' ? 'Anruf' : formData.followupType === 'message' ? 'Nachricht' : 'Im Laden'} • 
                      {' '}{format(new Date(formData.followupDate), 'dd.MM.yyyy', { locale: de })}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-400">
                  <strong>Automatisch:</strong> VVL Record • Vertragsdaten • Historieneintrag • 
                  {formData.outcome === 'follow_up' && ' Follow-up-Aufgabe • '}
                  Activity-Log
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-[#2D3139]">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="border-[#2D3139] text-[#9CA3AF]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>

          {currentStep < 5 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-[#FFD24D] to-[#FFA500] text-[#0F1115] hover:from-[#E6BC3A] hover:to-[#E69500] font-semibold"
            >
              Weiter
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  VVL abschließen
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}