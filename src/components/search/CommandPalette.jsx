import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, FileText, ArrowRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import QuickCreateCustomerModal from "./QuickCreateCustomerModal";

// Simplified CommandPalette
export default function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const inputRef = useRef(null);

  const [debouncedTerm, setDebouncedTerm] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Customers based on search term
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers', debouncedTerm],
    queryFn: async () => {
      if (!debouncedTerm || debouncedTerm.length < 2) return [];
      try {
        // Pass search term to SDK
        return await base44.entities.Customer.list({ search: debouncedTerm });
      } catch (e) { return []; }
    },
    enabled: !!debouncedTerm && debouncedTerm.length >= 2,
    staleTime: 0 // Always fetch fresh results for search
  });

  // Fetch Contracts based on search term
  const { data: contracts = [], isLoading: isLoadingContracts } = useQuery({
    queryKey: ['contracts', debouncedTerm],
    queryFn: async () => {
      if (!debouncedTerm || debouncedTerm.length < 2) return [];
      try { return await base44.entities.Contract.list({ search: debouncedTerm }); } catch (e) { return []; }
    },
    enabled: !!debouncedTerm && debouncedTerm.length >= 2,
    staleTime: 0
  });


  const allResults = [];

  if (debouncedTerm && debouncedTerm.length >= 2) {
    allResults.push(
      ...customers.map(c => ({ type: 'customer', data: c })),
      ...contracts.map(c => ({ type: 'contract', data: c }))
    );
  }

  useEffect(() => {
    setSelectedIndex(0);
  }, [allResults.length]);

  // Reset search on close / Focus input on open
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setSelectedIndex(0);
    } else {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(allResults[selectedIndex]);
    }
  };


  const handleSelect = (result) => {
    if (result.type === 'customer') {
      navigate(`/customers/${result.data.id}`);
    } else if (result.type === 'contract') {
      navigate(`/contracts/${result.data.id}`);
    }
    onOpenChange(false);
  };

  const getCustomerName = (customer) => {
    return customer.customer_type === "geschäftlich"
      ? customer.company_name
      : `${customer.first_name} ${customer.last_name}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#181B21] border-[#2D3139] max-w-2xl p-0 gap-0" onEscapeKeyDown={() => onOpenChange(false)}>
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2D3139]">
          <Search className="h-5 w-5 text-[#FFD24D]" />
          <Input
            ref={inputRef}
            placeholder="Suchen nach Kunden, Verträgen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 bg-transparent text-[#EAECEF] text-lg focus-visible:ring-0 p-0 placeholder:text-[#6B7280]"
          />
        </div>

        {/* Results */}
        <div className="max-h-[500px] overflow-y-auto p-3">
          {!debouncedTerm || debouncedTerm.length < 2 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-[#6B7280]">Suche starten...</p>
            </div>
          ) : allResults.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-[#6B7280]">Keine Ergebnisse</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Customers */}
              {customers.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider px-1 mb-2">
                    Kunden
                  </p>
                  {customers.map((customer, idx) => {
                    const globalIndex = idx;
                    const isSelected = selectedIndex === globalIndex;
                    return (
                      <button
                        key={customer.id}
                        onClick={() => handleSelect({ type: 'customer', data: customer })}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={cn(
                          "w-full p-2.5 rounded-lg text-left transition-colors",
                          isSelected ? "bg-[#1F2228]" : "hover:bg-[#1F2228]/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {getCustomerName(customer)?.[0] || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#EAECEF]">{getCustomerName(customer)}</p>
                          </div>
                          {isSelected && <ArrowRight className="h-4 w-4 text-[#FFD24D]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Contracts */}
              {contracts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider px-1 mb-2">
                    Verträge
                  </p>
                  {contracts.map((contract, idx) => {
                    const globalIndex = customers.length + idx;
                    const isSelected = selectedIndex === globalIndex;

                    return (
                      <button
                        key={contract.id}
                        onClick={() => handleSelect({ type: 'contract', data: contract })}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={cn(
                          "w-full p-2.5 rounded-lg text-left transition-colors",
                          isSelected ? "bg-[#1F2228]" : "hover:bg-[#1F2228]/50"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[#EAECEF]">{contract.tariff_name || contract.contract_number}</p>
                            </div>
                          </div>
                          {isSelected && <ArrowRight className="h-4 w-4 text-[#FFD24D]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-[#2D3139] bg-[#1F2228]/30">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#181B21] border border-[#2D3139] rounded text-[10px]">ESC</kbd>
              Schließen
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[#181B21] border border-[#2D3139] rounded text-[10px]">↵</kbd>
                Auswählen
              </span>
              <button
                onClick={() => setShowQuickCreate(true)}
                className="flex items-center gap-1 hover:text-[#FFD24D] transition-colors"
              >
                <Plus className="h-3 w-3" />
                Neu
              </button>
            </div>
          </div>
        </div>
      </DialogContent>

      <QuickCreateCustomerModal
        open={showQuickCreate}
        onOpenChange={setShowQuickCreate}
        onSuccess={(customer) => {
          navigate(`/customers/${customer.id}`);
          onOpenChange(false);
        }}
      />
    </Dialog>
  );
}