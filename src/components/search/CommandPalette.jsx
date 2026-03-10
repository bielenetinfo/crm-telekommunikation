import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ROUTES, createPageUrl } from "@/utils";
import {
  FileText,
  Users,
  LayoutDashboard,
  Moon,
  Sun,
  LogOut,
  PlusCircle,
  Settings
} from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { useAuth } from "@/lib/AuthContext";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import QuickCreateCustomerModal from "./QuickCreateCustomerModal";

export default function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [debouncedTerm, setDebouncedTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

  // Fetch Customers based on search term
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers', debouncedTerm],
    queryFn: async () => {
      if (!debouncedTerm || debouncedTerm.length < 2) return [];
      try {
        return await base44.entities.Customer.list({ search: debouncedTerm });
      } catch (e) { return []; }
    },
    enabled: !!debouncedTerm && debouncedTerm.length >= 2,
    staleTime: 0
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

  const getCustomerName = (customer) => {
    return customer.customer_type === "geschäftlich"
      ? customer.company_name
      : `${customer.first_name} ${customer.last_name}`;
  };

  const handleSelect = (callback) => {
    callback();
    onOpenChange(false);
  };

  const isLoading = isLoadingCustomers || isLoadingContracts;

  return (
    <>
      <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
        <CommandInput
          placeholder="Suchen nach Kunden, Verträgen oder Aktionen..."
          value={searchTerm}
          onValueChange={setSearchTerm}
        />
        <CommandList>
          {isLoading && <CommandEmpty>Lade Ergebnisse...</CommandEmpty>}
          {!isLoading && debouncedTerm.length >= 2 && customers.length === 0 && contracts.length === 0 && (
            <CommandEmpty>Keine Ergebnisse für "{debouncedTerm}" gefunden.</CommandEmpty>
          )}

          {debouncedTerm.length < 2 && (
            <>
              <CommandGroup heading="Aktionen">
                <CommandItem onSelect={() => handleSelect(() => setShowQuickCreate(true))}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>Neuer Kunde anlegen</span>
                </CommandItem>
                <CommandItem onSelect={() => handleSelect(() => navigate(createPageUrl('Customers')))}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Kundenübersicht öffnen</span>
                </CommandItem>
                <CommandItem onSelect={() => handleSelect(() => navigate(createPageUrl('Contracts')))}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Vertragsübersicht öffnen</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Navigation">
                <CommandItem onSelect={() => handleSelect(() => navigate(createPageUrl('Dashboard')))}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </CommandItem>
                <CommandItem onSelect={() => handleSelect(() => navigate(createPageUrl('Settings')))}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Einstellungen</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="System">
                <CommandItem onSelect={() => handleSelect(() => toggleTheme())}>
                  {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  <span>{theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}</span>
                </CommandItem>
                <CommandItem onSelect={() => handleSelect(() => logout())}>
                  <LogOut className="mr-2 h-4 w-4 text-rose-500" />
                  <span className="text-rose-500">Abmelden</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {debouncedTerm.length >= 2 && (
            <>
              {customers.length > 0 && (
                <CommandGroup heading="Kunden">
                  {customers.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`customer-${c.id}`}
                      onSelect={() => handleSelect(() => navigate(`${ROUTES.Customers}/${c.id}`))}
                      className="flex items-center gap-3 py-2"
                    >
                      <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        {getCustomerName(c)?.[0] || '?'}
                      </div>
                      <div className="flex flex-col">
                        <span>{getCustomerName(c)}</span>
                        <span className="text-xs text-muted-foreground">{c.customer_number || 'Keine Kundennummer'}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {contracts.length > 0 && (
                <CommandGroup heading="Verträge">
                  {contracts.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`contract-${c.id}`}
                      onSelect={() => handleSelect(() => navigate(`${ROUTES.Contracts}/${c.id}`))}
                      className="flex items-center gap-3 py-2"
                    >
                      <div className="h-8 w-8 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span>{c.tariff_name || c.contract_number || 'Unbekannter Vertrag'}</span>
                        <span className="text-xs text-muted-foreground">{c.provider_id || 'Kunde ansehen'}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}

        </CommandList>
      </CommandDialog>

      <QuickCreateCustomerModal
        open={showQuickCreate}
        onOpenChange={setShowQuickCreate}
        onSuccess={(customer) => {
          navigate(`${ROUTES.Customers}/${customer.id}`);
          onOpenChange(false);
        }}
      />
    </>
  );
}