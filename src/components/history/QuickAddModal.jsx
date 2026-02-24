import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, TrendingUp, HeadphonesIcon, Calendar, Clock, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";

const quickTypes = [
  { value: "service", label: "Service", icon: Wrench, desc: "SIM, Router, Gerät, Tarif" },
  { value: "sales", label: "Verkauf", icon: TrendingUp, desc: "Beratung, Angebot, Abschluss" },
  { value: "support", label: "Support", icon: HeadphonesIcon, desc: "Störung, Reklamation" },
  { value: "follow_up", label: "Follow-up", icon: Clock, desc: "Nachfassen, Rückruf" },
  { value: "appointment", label: "Termin", icon: Calendar, desc: "Hausbesuch, Besprechung" },
  { value: "note", label: "Notiz", icon: StickyNote, desc: "Freie Notiz" }
];

export default function QuickAddModal({ open, onOpenChange, onSubmit, contracts = [] }) {
  const [mode, setMode] = useState("quick"); // "quick" or "detailed"
  const [formData, setFormData] = useState({
    type: "service",
    title: "",
    notes: "",
    channel: "store",
    contract_id: "",
    due_at: "",
    priority: "medium"
  });

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    onSubmit(formData);
    setFormData({
      type: "service",
      title: "",
      notes: "",
      channel: "store",
      contract_id: "",
      due_at: "",
      priority: "medium"
    });
    setMode("quick");
    onOpenChange(false);
  };

  const selectedType = quickTypes.find(t => t.value === formData.type);
  const Icon = selectedType?.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#181B21] border-[#2D3139] text-[#EAECEF] max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#EAECEF]">Schnelleintrag erstellen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-[#EAECEF] mb-3 block">Was ist passiert? (Schnellwahl)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {quickTypes.map(type => {
                const TypeIcon = type.icon;
                const isSelected = formData.type === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        type: type.value,
                        // Auto-fill title if empty or default
                        title: (!formData.title || formData.title === "") ? type.label : formData.title
                      });
                    }}
                    className={cn(
                      "p-3 rounded-xl border transition-all text-left flex flex-col items-center justify-center gap-2 text-center h-24",
                      isSelected
                        ? "border-[#FFD24D] bg-[#FFD24D]/10 text-[#FFD24D]"
                        : "border-[#2D3139] bg-[#1F2228] hover:border-[#FFD24D]/50 text-[#9CA3AF] hover:text-[#EAECEF]"
                    )}
                  >
                    <TypeIcon className={cn("h-6 w-6", isSelected ? "text-[#FFD24D]" : "text-current")} />
                    <p className="text-xs font-bold uppercase tracking-wider leading-tight">
                      {type.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label className="text-[#EAECEF] mb-2 block">Was genau? *</Label>
            <Textarea
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF] resize-none"
              placeholder="z.B. SIM-Karte getauscht, Tarif besprochen, Kunde wünscht Rückruf..."
              rows={4}
              autoFocus
            />
          </div>

          {/* Due Date (for follow-ups/appointments) */}
          {(formData.type === 'follow_up' || formData.type === 'appointment') && (
            <div>
              <Label className="text-[#EAECEF] mb-2 block">
                {formData.type === 'appointment' ? 'Termin' : 'Fällig am'}
              </Label>
              <Input
                type="datetime-local"
                value={formData.due_at}
                onChange={(e) => setFormData({ ...formData, due_at: e.target.value })}
                className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
              />
            </div>
          )}

          {/* Contract Link */}
          {contracts.length > 0 && (
            <div>
              <Label className="text-[#EAECEF] mb-2 block">Vertrag (optional)</Label>
              <Select value={formData.contract_id || ""} onValueChange={(v) => setFormData({ ...formData, contract_id: v === "" ? null : v })}>
                <SelectTrigger className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
                  <SelectValue placeholder="Kein Vertrag" />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                  <SelectItem value={null} className="text-[#EAECEF]">Kein Vertrag</SelectItem>
                  {contracts.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-[#EAECEF]">
                      {c.provider_name} • {c.category}
                      {c.contract_number && ` • Nr. ${c.contract_number}`}
                      {!c.contract_number && c.tariff_name && ` • ${c.tariff_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Toggle Detailed Mode */}
          {mode === "quick" ? (
            <button
              onClick={() => setMode("detailed")}
              className="text-xs text-[#FFD24D] hover:underline"
            >
              + Mehr Details hinzufügen
            </button>
          ) : (
            <div className="space-y-4 pt-4 border-t border-[#2D3139]">
              {/* Notes */}
              <div>
                <Label className="text-[#EAECEF] mb-2 block">Zusätzliche Details</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF] resize-none"
                  rows={5}
                  placeholder="Weitere Details, Vereinbarungen, nächste Schritte..."
                />
              </div>

              {/* Channel */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#EAECEF] mb-2 block">Kanal</Label>
                  <Select value={formData.channel} onValueChange={(v) => setFormData({ ...formData, channel: v })}>
                    <SelectTrigger className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                      <SelectItem value="store" className="text-[#EAECEF]">Laden</SelectItem>
                      <SelectItem value="phone" className="text-[#EAECEF]">Telefon</SelectItem>
                      <SelectItem value="whatsapp" className="text-[#EAECEF]">WhatsApp</SelectItem>
                      <SelectItem value="email" className="text-[#EAECEF]">E-Mail</SelectItem>
                      <SelectItem value="home_visit" className="text-[#EAECEF]">Hausbesuch</SelectItem>
                      <SelectItem value="other" className="text-[#EAECEF]">Sonstiges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div>
                  <Label className="text-[#EAECEF] mb-2 block">Priorität</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                      <SelectItem value="low" className="text-[#EAECEF]">Niedrig</SelectItem>
                      <SelectItem value="medium" className="text-[#EAECEF]">Mittel</SelectItem>
                      <SelectItem value="high" className="text-[#EAECEF]">Hoch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <button
                onClick={() => setMode("quick")}
                className="text-xs text-[#6B7280] hover:text-[#9CA3AF]"
              >
                Weniger Details
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-[#2D3139]">
          <Button
            onClick={handleSubmit}
            disabled={!formData.title.trim()}
            className="w-full bg-gradient-to-r from-[#FFD24D] to-[#FFA500] text-[#0F1115] hover:from-[#E6BC3A] hover:to-[#E69500] font-semibold"
          >
            Erstellen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}