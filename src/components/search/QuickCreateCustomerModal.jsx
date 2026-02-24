import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Building2, Save, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeAddress } from "@/utils/addressNormalization";
import AddressAutocomplete from "../customers/AddressAutocomplete";

export default function QuickCreateCustomerModal({ open, onOpenChange, onSuccess, prefillData = {} }) {
  const queryClient = useQueryClient();
  const [customerType, setCustomerType] = useState("privat");
  const [formData, setFormData] = useState({
    first_name: prefillData.name?.split(' ')[0] || "",
    last_name: prefillData.name?.split(' ').slice(1).join(' ') || "",
    company_name: prefillData.name || "",
    phone: prefillData.phone || "",
    branch_id: ""
  });
  const [addressData, setAddressData] = useState({
    street: prefillData.address?.street || "",
    house_number: prefillData.address?.house_number || "",
    postal_code: prefillData.address?.postal_code || "",
    city: prefillData.address?.city || ""
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => base44.entities.Branch.list()
  });

  const { data: allCustomers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list()
  });

  // Default branch
  useState(() => {
    if (branches.length > 0 && !formData.branch_id) {
      setFormData(prev => ({ ...prev, branch_id: branches[0].id }));
    }
  }, [branches]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const branch = branches.find(b => b.id === data.branch_id);
      const normalizedAddressString = `${addressData.street} ${addressData.house_number}`.trim();
      const addressNormalized = normalizeAddress(
        addressData.street,
        addressData.house_number,
        addressData.postal_code,
        addressData.city
      );

      return base44.entities.Customer.create({
        ...data,
        customer_type: customerType,
        branch_name: branch?.name || "",
        status: "draft",
        identity_documents: JSON.stringify([]),
        address: normalizedAddressString,
        postal_code: addressData.postal_code,
        city: addressData.city,
        address_normalized: addressNormalized
      });
    },
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onSuccess?.(newCustomer);
      onOpenChange(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#181B21] border-[#2D3139] text-[#EAECEF] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Zap className="h-6 w-6 text-[#FFD24D]" />
            Quick Create: Neuer Kunde
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Type Toggle */}
          <div className="flex gap-2 p-1 bg-[#1F2228] rounded-lg">
            <button
              type="button"
              onClick={() => setCustomerType("privat")}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                customerType === "privat" 
                  ? "bg-[#FFD24D] text-[#0F1115]" 
                  : "text-[#9CA3AF] hover:text-[#EAECEF]"
              )}
            >
              <User className="h-4 w-4" />
              Privat
            </button>
            <button
              type="button"
              onClick={() => setCustomerType("geschäftlich")}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                customerType === "geschäftlich" 
                  ? "bg-[#FFD24D] text-[#0F1115]" 
                  : "text-[#9CA3AF] hover:text-[#EAECEF]"
              )}
            >
              <Building2 className="h-4 w-4" />
              Geschäftlich
            </button>
          </div>

          {/* Name/Company */}
          {customerType === "privat" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[#EAECEF]">Vorname *</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                  placeholder="Max"
                  required
                />
              </div>
              <div>
                <Label className="text-[#EAECEF]">Nachname *</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                  placeholder="Mustermann"
                  required
                />
              </div>
            </div>
          ) : (
            <div>
              <Label className="text-[#EAECEF]">Firmenname *</Label>
              <Input
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
                placeholder="Telekom Shop GmbH"
                required
              />
            </div>
          )}

          {/* Phone */}
          <div>
            <Label className="text-[#EAECEF]">Telefon *</Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
              placeholder="0176 12345678"
              required
            />
          </div>

          {/* Address Autocomplete */}
          <AddressAutocomplete
            customers={allCustomers}
            value={addressData}
            onChange={setAddressData}
            onHouseholdFound={() => {}}
          />

          {/* Branch */}
          <div>
            <Label className="text-[#EAECEF]">Filiale *</Label>
            <Select 
              value={formData.branch_id} 
              onValueChange={(v) => setFormData({...formData, branch_id: v})}
            >
              <SelectTrigger className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
                <SelectValue placeholder="Filiale wählen..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id} className="text-[#EAECEF]">{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#2D3139]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#2D3139]"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={
                !formData.phone || !addressData.street || !addressData.postal_code || 
                !addressData.city || !formData.branch_id ||
                (customerType === "privat" && (!formData.first_name || !formData.last_name)) ||
                (customerType === "geschäftlich" && !formData.company_name) ||
                createMutation.isPending
              }
              className="bg-gradient-to-r from-[#FFD24D] to-[#FFA500] text-[#0F1115]"
            >
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending ? 'Wird erstellt...' : 'Kunde erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
