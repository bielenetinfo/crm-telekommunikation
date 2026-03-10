import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { addMonths, format } from "date-fns";
import { useContractForm } from "@/features/contracts/hooks/useContractForm";

export default function ContractForm({ contract, customers, providers, branches, onSubmit, onCancel }) {
  const { formData, setFormData, selectCustomer, setStartDate } = useContractForm(contract, { customers });

  const handleProviderSelect = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    setFormData({
      ...formData,
      provider_id: providerId
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === formData.customer_id);
    const provider = providers.find(p => p.id === formData.provider_id);
    const branch = branches.find(b => b.id === formData.branch_id);

    // Calculate cancellation deadline
    const endDate = new Date(formData.end_date);
    const cancellationDeadline = addMonths(endDate, -formData.cancellation_period_months);

    onSubmit({
      ...formData,
      customer_name: customer ? `${customer.first_name} ${customer.last_name}` : "",
      provider_name: provider?.name || "",
      branch_name: branch?.name || "",
      cancellation_deadline: format(cancellationDeadline, 'yyyy-MM-dd'),
      monthly_fee: formData.monthly_fee ? parseFloat(formData.monthly_fee) : null,
      total_commission: formData.total_commission ? parseFloat(formData.total_commission) : null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#2D3139]">
        <h2 className="text-xl font-semibold text-[#EAECEF]">
          {contract ? "Vertrag bearbeiten" : "Neuer Vertrag"}
        </h2>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[#EAECEF]">Kunde *</Label>
          <Select value={formData.customer_id} onValueChange={selectCustomer}>
            <SelectTrigger className="h-11 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
              <SelectValue placeholder="Kunde wählen..." />
            </SelectTrigger>
            <SelectContent className="bg-[#1F2228] border-[#2D3139]">
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-[#EAECEF]">
                  {c.first_name} {c.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[#EAECEF]">Provider *</Label>
          <Select value={formData.provider_id} onValueChange={handleProviderSelect}>
            <SelectTrigger className="h-11 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
              <SelectValue placeholder="Provider wählen..." />
            </SelectTrigger>
            <SelectContent className="bg-[#1F2228] border-[#2D3139]">
              {providers.map(p => (
                <SelectItem key={p.id} value={p.id} className="text-[#EAECEF]">
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[#EAECEF]">Filiale</Label>
          <Select value={formData.branch_id} onValueChange={(v) => setFormData({ ...formData, branch_id: v })}>
            <SelectTrigger className="h-11 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
              <SelectValue placeholder="Filiale wählen..." />
            </SelectTrigger>
            <SelectContent className="bg-[#1F2228] border-[#2D3139]">
              {branches.map(b => (
                <SelectItem key={b.id} value={b.id} className="text-[#EAECEF]">
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[#EAECEF]">Vertragsnummer</Label>
          <Input
            value={formData.contract_number}
            onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
            className="h-11 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[#EAECEF]">Kategorie</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger className="h-11 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1F2228] border-[#2D3139]">
              <SelectItem value="mobilfunk" className="text-[#EAECEF]">Mobilfunk</SelectItem>
              <SelectItem value="festnetz" className="text-[#EAECEF]">Festnetz</SelectItem>
              <SelectItem value="internet" className="text-[#EAECEF]">Internet</SelectItem>
              <SelectItem value="tv" className="text-[#EAECEF]">TV</SelectItem>
              <SelectItem value="kombi" className="text-[#EAECEF]">Kombi</SelectItem>
              <SelectItem value="sonstiges" className="text-[#EAECEF]">Sonstiges</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[#EAECEF]">Vertragstyp</Label>
          <Input
            value={formData.contract_type}
            onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
            placeholder="z.B. Postpaid, Prepaid..."
            className="h-11 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-[#EAECEF]">Vertragsbeginn *</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="h-11 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[#EAECEF]">Vertragsende</Label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="h-11 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[#EAECEF]">Kündigungsfrist (Monate)</Label>
          <Input
            type="number"
            min="1"
            value={formData.cancellation_period_months}
            onChange={(e) => setFormData({ ...formData, cancellation_period_months: parseInt(e.target.value) })}
            className="h-11 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[#EAECEF]">Monatliche Gebühr (€)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.monthly_fee}
            onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
            className="h-11 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[#EAECEF]">Gesamtprovision (€)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.total_commission}
            onChange={(e) => setFormData({ ...formData, total_commission: e.target.value })}
            className="h-11 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[#EAECEF]">Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger className="h-11 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1F2228] border-[#2D3139]">
              <SelectItem value="aktiv" className="text-[#EAECEF]">Aktiv</SelectItem>
              <SelectItem value="gekündigt" className="text-[#EAECEF]">Gekündigt</SelectItem>
              <SelectItem value="abgelaufen" className="text-[#EAECEF]">Abgelaufen</SelectItem>
              <SelectItem value="verlängert" className="text-[#EAECEF]">Verlängert</SelectItem>
              <SelectItem value="pausiert" className="text-[#EAECEF]">Pausiert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[#EAECEF]">Automatische Verlängerung</Label>
          <div className="flex items-center gap-3 h-11">
            <Switch
              checked={formData.auto_renew}
              onCheckedChange={(v) => setFormData({ ...formData, auto_renew: v })}
            />
            <span className="text-sm text-[#9CA3AF]">{formData.auto_renew ? "Ja" : "Nein"}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[#EAECEF]">Notizen</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-[#2D3139] text-[#9CA3AF]">
          Abbrechen
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-[#FFD24D] to-[#FFA500] text-[#0F1115] hover:from-[#E6BC3A] hover:to-[#E69500] font-semibold">
          {contract ? "Speichern" : "Vertrag anlegen"}
        </Button>
      </div>
    </form>
  );
}