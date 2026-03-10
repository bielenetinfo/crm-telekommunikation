import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useCustomerForm } from "@/features/customers/hooks/useCustomerForm";

export default function CustomerForm({ customer, branches = [], onSubmit, onCancel }) {
  const { formData, setFormData } = useCustomerForm(customer);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b">
        <h2 className="text-xl font-semibold text-slate-900">
          {customer ? "Kunde bearbeiten" : "Neuer Kunde"}
        </h2>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">Vorname *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Nachname *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
            className="h-11"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-[#EAECEF]">Telefon *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            className="h-11 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp" className="text-[#EAECEF]">WhatsApp</Label>
          <Input
            id="whatsapp"
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            className="h-11 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[#EAECEF]">E-Mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="h-11 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[#EAECEF]">Geburtsdatum</Label>
          <Input
            type="date"
            value={formData.birth_date}
            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
            className="h-11 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
          />
        </div>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Adresse</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="h-11"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postal_code">PLZ</Label>
          <Input
            id="postal_code"
            value={formData.postal_code}
            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            className="h-11"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="city">Stadt</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Kundentyp</Label>
        <Select value={formData.customer_type} onValueChange={(v) => setFormData({ ...formData, customer_type: v })}>
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="privat">Privatkunde</SelectItem>
            <SelectItem value="geschäftlich">Geschäftskunde</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notizen</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
          {customer ? "Speichern" : "Kunde anlegen"}
        </Button>
      </div>
    </form>
  );
}