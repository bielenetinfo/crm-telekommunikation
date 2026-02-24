import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

export default function RepairForm({ repair, customers, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    customer_phone: "",
    device_type: "smartphone",
    device_brand: "",
    device_model: "",
    imei: "",
    problem_description: "",
    diagnosis: "",
    estimated_cost: "",
    status: "angenommen",
    priority: "normal",
    estimated_completion: "",
    notes: ""
  });

  useEffect(() => {
    if (repair) {
      setFormData({
        customer_id: repair.customer_id || "",
        customer_name: repair.customer_name || "",
        customer_phone: repair.customer_phone || "",
        device_type: repair.device_type || "smartphone",
        device_brand: repair.device_brand || "",
        device_model: repair.device_model || "",
        imei: repair.imei || "",
        problem_description: repair.problem_description || "",
        diagnosis: repair.diagnosis || "",
        estimated_cost: repair.estimated_cost || "",
        status: repair.status || "angenommen",
        priority: repair.priority || "normal",
        estimated_completion: repair.estimated_completion || "",
        notes: repair.notes || ""
      });
    }
  }, [repair]);

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customer_id: customer.id,
        customer_name: `${customer.first_name} ${customer.last_name}`,
        customer_phone: customer.phone
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b">
        <h2 className="text-xl font-semibold text-slate-900">
          {repair ? "Reparatur bearbeiten" : "Neue Reparatur"}
        </h2>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
        <h3 className="font-medium text-slate-900">Kundendaten</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Kunde auswählen</Label>
            <Select value={formData.customer_id} onValueChange={handleCustomerSelect}>
              <SelectTrigger className="h-11 bg-white">
                <SelectValue placeholder="Kunde wählen..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} - {c.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Telefon</Label>
            <Input value={formData.customer_phone} readOnly className="h-11 bg-white" />
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
        <h3 className="font-medium text-slate-900">Gerätedaten</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Gerätetyp *</Label>
            <Select value={formData.device_type} onValueChange={(v) => setFormData({ ...formData, device_type: v })}>
              <SelectTrigger className="h-11 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smartphone">Smartphone</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
                <SelectItem value="laptop">Laptop</SelectItem>
                <SelectItem value="smartwatch">Smartwatch</SelectItem>
                <SelectItem value="sonstiges">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Marke</Label>
            <Input
              value={formData.device_brand}
              onChange={(e) => setFormData({ ...formData, device_brand: e.target.value })}
              placeholder="z.B. Apple, Samsung"
              className="h-11 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label>Modell</Label>
            <Input
              value={formData.device_model}
              onChange={(e) => setFormData({ ...formData, device_model: e.target.value })}
              placeholder="z.B. iPhone 15 Pro"
              className="h-11 bg-white"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>IMEI-Nummer</Label>
          <Input
            value={formData.imei}
            onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
            className="h-11 bg-white"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Problembeschreibung *</Label>
          <Textarea
            value={formData.problem_description}
            onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
            required
            rows={3}
            placeholder="Beschreiben Sie das Problem..."
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Priorität</Label>
            <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="dringend">Dringend</SelectItem>
                <SelectItem value="express">Express</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Geschätzter Preis (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.estimated_cost}
              onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>Fertigstellung bis</Label>
            <Input
              type="date"
              value={formData.estimated_completion}
              onChange={(e) => setFormData({ ...formData, estimated_completion: e.target.value })}
              className="h-11"
            />
          </div>
        </div>

        {repair && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="angenommen">Angenommen</SelectItem>
                  <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                  <SelectItem value="warte_auf_teile">Warte auf Teile</SelectItem>
                  <SelectItem value="fertig">Fertig</SelectItem>
                  <SelectItem value="abgeholt">Abgeholt</SelectItem>
                  <SelectItem value="storniert">Storniert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Diagnose</Label>
              <Input
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                className="h-11"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Notizen</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
          {repair ? "Speichern" : "Reparatur anlegen"}
        </Button>
      </div>
    </form>
  );
}