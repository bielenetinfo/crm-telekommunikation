import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Store, Home, Phone, MessageCircle, Wrench, Calendar, MessageSquare, Smartphone as SimCardIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const eventTypes = [
  { value: "visit_store", label: "🏪 Besuch im Laden", category: "contact" },
  { value: "visit_home", label: "🏠 Hausbesuch", category: "contact" },
  { value: "call", label: "📞 Telefonat", category: "contact" },
  { value: "message", label: "💬 Nachricht / WhatsApp", category: "contact" },
  { value: "service_sim", label: "📱 SIM-Karte Tausch/Problem", category: "service" },
  { value: "service_router", label: "📡 Router Service", category: "service" },
  { value: "service_device", label: "💻 Geräte-Support", category: "service" },
  { value: "service_tariff", label: "📊 Tarifberatung", category: "service" },
  { value: "appointment", label: "📅 Termin vereinbart", category: "appointment" },
  { value: "note", label: "📝 Allgemeine Notiz", category: "other" },
  { value: "other", label: "➕ Sonstiges", category: "other" }
];

export default function AddHistoryModal({ open, onOpenChange, onSubmit, contracts = [] }) {
  const [formData, setFormData] = useState({
    type: "visit_store",
    title: "",
    description: "",
    contract_id: "",
    event_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    duration_minutes: "",
    location: ""
  });

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    onSubmit(formData);
    setFormData({
      type: "visit_store",
      title: "",
      description: "",
      contract_id: "",
      event_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      duration_minutes: "",
      location: ""
    });
    onOpenChange(false);
  };

  const showDuration = formData.type === 'appointment' || formData.type === 'visit_home' || formData.type === 'call';
  const showLocation = formData.type === 'visit_home' || formData.type === 'appointment';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#181B21] border-[#2D3139] text-[#EAECEF] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Historieneintrag erstellen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <Label className="text-[#EAECEF] mb-3 block">Was ist passiert? (Schnellwahl)</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {eventTypes.filter(t => t.category !== 'other').map((type) => {
              // Icon mapping based on type.value
              let Icon = MessageSquare;
              if (type.value === 'visit_store') Icon = Store;
              if (type.value === 'visit_home') Icon = Home;
              if (type.value === 'call') Icon = Phone;
              if (type.value === 'message') Icon = MessageCircle;
              if (type.value === 'service_sim') Icon = SimCardIcon; // Fallback or import
              if (type.value.includes('service')) Icon = Wrench;
              if (type.value === 'appointment') Icon = Calendar;

              const isSelected = formData.type === type.value;

              return (
                <button
                  key={type.value}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      type: type.value,
                      // Auto-fill title if empty or default
                      title: formData.title === "" ? type.label.replace(/^[^\s]+\s/, '') : formData.title
                    });
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 gap-2",
                    isSelected
                      ? "bg-[#FFD24D]/20 border-[#FFD24D] text-[#FFD24D]"
                      : "bg-[#1F2228] border-[#2D3139] text-[#9CA3AF] hover:bg-[#2D3139] hover:text-[#EAECEF]"
                  )}
                >
                  <Icon className={cn("h-6 w-6", isSelected ? "text-[#FFD24D]" : "text-current")} />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-center leading-tight">
                    {type.label.replace(/^[^\s]+\s/, '')}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Title */}
          <div>
            <Label className="text-[#EAECEF] mb-2 block">Kurzbeschreibung *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
              placeholder="z.B. SIM-Karte getauscht wegen defekt"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-[#EAECEF] mb-2 block">Detaillierte Notiz</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
              rows={4}
              placeholder="Weitere Details, Vereinbarungen, nächste Schritte..."
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#EAECEF] mb-2 block">Datum & Uhrzeit</Label>
              <Input
                type="datetime-local"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
              />
            </div>

            {showDuration && (
              <div>
                <Label className="text-[#EAECEF] mb-2 block">Dauer (Minuten)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                  placeholder="z.B. 30"
                />
              </div>
            )}
          </div>

          {/* Location */}
          {showLocation && (
            <div>
              <Label className="text-[#EAECEF] mb-2 block">Ort</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                placeholder="z.B. Kundenadresse oder Treffpunkt"
              />
            </div>
          )}

          {/* Contract Link */}
          {contracts.length > 0 && (
            <div>
              <Label className="text-[#EAECEF] mb-2 block">Verknüpfter Vertrag (optional)</Label>
              <Select value={formData.contract_id} onValueChange={(v) => setFormData({ ...formData, contract_id: v })}>
                <SelectTrigger className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
                  <SelectValue placeholder="Kein Vertrag verknüpft" />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                  <SelectItem value={null} className="text-[#EAECEF]">Kein Vertrag</SelectItem>
                  {contracts.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-[#EAECEF]">
                      {c.provider_name} • {c.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#2D3139]">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#2D3139] text-[#9CA3AF]"
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.title.trim()}
            className="bg-gradient-to-r from-[#FFD24D] to-[#FFA500] text-[#0F1115] hover:from-[#E6BC3A] hover:to-[#E69500]"
          >
            Eintrag erstellen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
