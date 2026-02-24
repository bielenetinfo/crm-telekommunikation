import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Smartphone, Wifi } from "lucide-react";

export default function ContractFormFields({ category, formData, onChange, errors = {} }) {
  const updateField = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Tarif & Vertragsnummer - IMMER anzeigen */}
      <Card className="p-5 bg-[#181B21] border-[#2D3139]">
        <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">Tarif & Vertragsinfo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-[#EAECEF]">
              Tarifname {(category === "mobilfunk" || category === "festnetz_internet") && <span className="text-rose-400">*</span>}
            </Label>
            <Input
              name="tariff_name"
              value={formData.tariff_name || ""}
              onChange={(e) => updateField('tariff_name', e.target.value)}
              className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
              placeholder="z.B. MagentaMobil L, MagentaZuhause M"
            />
          </div>
          <div>
            <Label className="text-[#EAECEF]">Vertragsnummer</Label>
            <Input
              name="contract_number"
              value={formData.contract_number || ""}
              onChange={(e) => updateField('contract_number', e.target.value)}
              className={cn("mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]", errors.contract_number && "border-red-500")}
              placeholder="Optional – kann später ergänzt werden"
            />
            {errors.contract_number && <p className="text-xs text-red-500 mt-1">{errors.contract_number}</p>}
          </div>
        </div>
      </Card>

      {/* MOBILFUNK spezifische Felder */}
      {category === "mobilfunk" && (
        <Card className="p-5 bg-[#181B21] border-[#2D3139]">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="h-5 w-5 text-[#FFD24D]" />
            <h3 className="text-sm font-semibold text-[#EAECEF]">Mobilfunk-Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[#EAECEF]">Kartentyp</Label>
              <Select 
                value={formData.mobilfunk_type || ""} 
                onValueChange={(v) => updateField('mobilfunk_type', v)}
              >
                <SelectTrigger className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
                  <SelectValue placeholder="Typ wählen..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                  <SelectItem value="hauptkarte" className="text-[#EAECEF]">Hauptkarte</SelectItem>
                  <SelectItem value="partnerkarte" className="text-[#EAECEF]">Partnerkarte</SelectItem>
                  <SelectItem value="familienkarte" className="text-[#EAECEF]">Familienkarte / Pluskarte</SelectItem>
                  <SelectItem value="kinderkarte" className="text-[#EAECEF]">Kinderkarte</SelectItem>
                  <SelectItem value="hardware_rate" className="text-[#EAECEF]">My Handy / Hardware-Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[#EAECEF]">Datenvolumen (GB)</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.data_volume_gb || ""}
                onChange={(e) => updateField('data_volume_gb', e.target.value)}
                className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                placeholder="z.B. 20"
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-[#1F2228] rounded-lg">
              <input
                type="checkbox"
                checked={formData.has_allnet_flat || false}
                onChange={(e) => updateField('has_allnet_flat', e.target.checked)}
                className="h-4 w-4 rounded border-[#2D3139]"
              />
              <Label className="text-[#EAECEF] cursor-pointer" onClick={() => updateField('has_allnet_flat', !formData.has_allnet_flat)}>
                Allnet Flat
              </Label>
            </div>

            <div className="flex items-center gap-2 p-3 bg-[#1F2228] rounded-lg">
              <input
                type="checkbox"
                checked={formData.has_sms_flat || false}
                onChange={(e) => updateField('has_sms_flat', e.target.checked)}
                className="h-4 w-4 rounded border-[#2D3139]"
              />
              <Label className="text-[#EAECEF] cursor-pointer" onClick={() => updateField('has_sms_flat', !formData.has_sms_flat)}>
                SMS Flat
              </Label>
            </div>

            <div className="flex items-center gap-2 p-3 bg-[#1F2228] rounded-lg">
              <input
                type="checkbox"
                checked={formData.has_roaming || false}
                onChange={(e) => updateField('has_roaming', e.target.checked)}
                className="h-4 w-4 rounded border-[#2D3139]"
              />
              <Label className="text-[#EAECEF] cursor-pointer" onClick={() => updateField('has_roaming', !formData.has_roaming)}>
                EU-Roaming
              </Label>
            </div>
          </div>
        </Card>
      )}

      {/* FESTNETZ/INTERNET spezifische Felder */}
      {category === "festnetz_internet" && (
        <Card className="p-5 bg-[#181B21] border-[#2D3139]">
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="h-5 w-5 text-[#FFD24D]" />
            <h3 className="text-sm font-semibold text-[#EAECEF]">Festnetz / Internet Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[#EAECEF]">Anschlussart</Label>
              <Select 
                value={formData.connection_type || ""} 
                onValueChange={(v) => updateField('connection_type', v)}
              >
                <SelectTrigger className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
                  <SelectValue placeholder="Technologie wählen..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                  <SelectItem value="dsl" className="text-[#EAECEF]">DSL</SelectItem>
                  <SelectItem value="kabel" className="text-[#EAECEF]">Kabel</SelectItem>
                  <SelectItem value="glasfaser" className="text-[#EAECEF]">Glasfaser</SelectItem>
                  <SelectItem value="lte" className="text-[#EAECEF]">LTE</SelectItem>
                  <SelectItem value="5g" className="text-[#EAECEF]">5G</SelectItem>
                  <SelectItem value="starlink" className="text-[#EAECEF]">Starlink</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[#EAECEF]">Download (Mbit/s)</Label>
              <Input
                type="number"
                value={formData.speed_download_mbit || ""}
                onChange={(e) => updateField('speed_download_mbit', e.target.value)}
                className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                placeholder="z.B. 250"
              />
            </div>

            <div>
              <Label className="text-[#EAECEF]">Upload (Mbit/s)</Label>
              <Input
                type="number"
                value={formData.speed_upload_mbit || ""}
                onChange={(e) => updateField('speed_upload_mbit', e.target.value)}
                className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                placeholder="z.B. 50"
              />
            </div>

            <div>
              <Label className="text-[#EAECEF]">Router Modell</Label>
              <Input
                value={formData.router_model || ""}
                onChange={(e) => updateField('router_model', e.target.value)}
                className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                placeholder="z.B. Fritz!Box 7590"
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-[#1F2228] rounded-lg">
              <input
                type="checkbox"
                checked={formData.router_included || false}
                onChange={(e) => updateField('router_included', e.target.checked)}
                className="h-4 w-4 rounded border-[#2D3139]"
              />
              <Label className="text-[#EAECEF] cursor-pointer" onClick={() => updateField('router_included', !formData.router_included)}>
                Router inklusive
              </Label>
            </div>

            <div>
              <Label className="text-[#EAECEF]">TV-Option</Label>
              <Input
                value={formData.tv_option || ""}
                onChange={(e) => updateField('tv_option', e.target.value)}
                className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                placeholder="z.B. MagentaTV, Waipu, etc."
              />
            </div>
          </div>
        </Card>
      )}

      {/* Allgemeine Tarifdetails (nur wenn Mobilfunk oder Festnetz/Internet) */}
      {(category === "mobilfunk" || category === "festnetz_internet") && (
        <Card className="p-5 bg-[#181B21] border-[#2D3139]">
          <Label className="text-[#EAECEF]">Tarifdetails / Besonderheiten</Label>
          <Textarea
            value={formData.tariff_details || ""}
            onChange={(e) => updateField('tariff_details', e.target.value)}
            rows={2}
            className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
            placeholder={
              category === "mobilfunk" 
                ? "z.B. StreamOn Music, Hotspot inklusive, 5G Option..." 
                : "z.B. Telefon-Flat Festnetz, Gratis-Router für 12 Monate..."
            }
          />
        </Card>
      )}
    </div>
  );
}
