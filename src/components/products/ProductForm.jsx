import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";

const categories = [
  { value: "smartphone", label: "Smartphone" },
  { value: "tablet", label: "Tablet" },
  { value: "zubehoer", label: "Zubehör" },
  { value: "tarif", label: "Tarif" },
  { value: "prepaid", label: "Prepaid" },
  { value: "reparatur_service", label: "Reparatur-Service" }
];

export default function ProductForm({ product, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "smartphone",
    brand: "",
    model: "",
    price: "",
    purchase_price: "",
    stock: "",
    sku: "",
    description: "",
    is_active: true
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        category: product.category || "smartphone",
        brand: product.brand || "",
        model: product.model || "",
        price: product.price || "",
        purchase_price: product.purchase_price || "",
        stock: product.stock || "",
        sku: product.sku || "",
        description: product.description || "",
        is_active: product.is_active !== false
      });
    }
  }, [product]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: parseFloat(formData.price) || 0,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
      stock: parseInt(formData.stock) || 0
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b">
        <h2 className="text-xl font-semibold text-slate-900">
          {product ? "Produkt bearbeiten" : "Neues Produkt"}
        </h2>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label>Kategorie *</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Marke</Label>
          <Input
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label>Modell</Label>
          <Input
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="h-11"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Verkaufspreis (€) *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label>Einkaufspreis (€)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.purchase_price}
            onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label>Lagerbestand</Label>
          <Input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Artikelnummer (SKU)</Label>
        <Input
          value={formData.sku}
          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label>Beschreibung</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
        />
        <Label>Produkt aktiv</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
          {product ? "Speichern" : "Produkt anlegen"}
        </Button>
      </div>
    </form>
  );
}