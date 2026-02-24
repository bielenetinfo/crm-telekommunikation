import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search, Phone, MapPin, User, X, Plus, ArrowRight, Users, TrendingUp, FileText, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { KpiCard } from "@/components/ui/kpi-card";
import { startOfMonth, endOfMonth } from "date-fns";

export default function Customers() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const urlParams = new URLSearchParams(window.location.search);
  const addressFilter = urlParams.get('address');
  const [search, setSearch] = useState(addressFilter || "");

  useEffect(() => {
    if (addressFilter) {
      setSearch(addressFilter);
    }
  }, [addressFilter]);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-created_date')
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.Contract.list()
  });

  const filteredCustomers = customers.filter(c => {
    const searchLower = search.toLowerCase();
    const firstName = c.first_name?.toLowerCase() || '';
    const lastName = c.last_name?.toLowerCase() || '';
    const company = c.company_name?.toLowerCase() || '';
    const email = c.email?.toLowerCase() || '';
    const phone = c.phone || '';
    const whatsapp = c.whatsapp || '';
    const address = c.address?.toLowerCase() || '';
    const city = c.city?.toLowerCase() || '';
    const postalCode = c.postal_code || '';
    const branchName = c.branch_name?.toLowerCase() || '';
    const notes = c.notes?.toLowerCase() || '';

    return firstName.includes(searchLower) ||
      lastName.includes(searchLower) ||
      company.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(search) ||
      whatsapp.includes(search) ||
      address.includes(searchLower) ||
      city.includes(searchLower) ||
      postalCode.includes(search) ||
      branchName.includes(searchLower) ||
      notes.includes(searchLower);
  });

  // Calculate KPIs
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const newThisMonth = customers.filter(c => {
    if (!c.created_date) return false;
    const created = new Date(c.created_date);
    return created >= monthStart && created <= monthEnd;
  }).length;

  const totalContracts = contracts.length;
  const avgContractsPerCustomer = customers.length > 0
    ? (totalContracts / customers.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-3 px-4 md:px-8 pt-3 md:pt-4 pb-24 w-full text-foreground">

      {/* Header - Dashboard Pattern */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gradient">
            Kunden
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            {filteredCustomers.length} von {customers.length} Kunden
          </p>
        </div>

        {/* Desktop: Button rechts - Mobile: FAB */}
        {!isMobile && (
          <Button
            onClick={() => navigate(`${createPageUrl('CustomerDetail')}?new=true`)}
            className="btn-premium bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 h-12 shadow-lg shadow-primary/20 text-sm rounded-xl"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Neuer Kunde
          </Button>
        )}
      </div>

      {/* KPI Cards Row - Dashboard Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={Users}
          value={customers.length}
          label="Gesamt Kunden"
          color="blue"
        />
        <KpiCard
          icon={TrendingUp}
          value={newThisMonth}
          label="Neu diesen Monat"
          color="green"
          trend={newThisMonth > 0 ? `+${newThisMonth}` : undefined}
        />
        <KpiCard
          icon={FileText}
          value={totalContracts}
          label="Gesamt Verträge"
          color="primary"
        />
        <KpiCard
          icon={DollarSign}
          value={avgContractsPerCustomer}
          label="Ø Verträge/Kunde"
          color="purple"
        />
      </div>

      {/* Search */}
      <div className="glass-card card-premium p-4 rounded-3xl slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2  h-4 w-4 text-muted-foreground group-hover:text-primary " />
          <Input
            placeholder="Suche: Name, Firma, Adresse, PLZ, Telefon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-11 bg-secondary/50 border-transparent focus:bg-background focus:border-primary/50 text-foreground rounded-xl  font-medium placeholder:text-muted-foreground/50"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                navigate(createPageUrl('Customers'));
              }}
              className="absolute right-4 top-1/2  text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {addressFilter && (
          <div className="mt-3 inline-flex items-center p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-500">
            <MapPin className="h-3.5 w-3.5 mr-2" />
            Filter: <span className="ml-1 text-blue-600 dark:text-blue-400">{addressFilter}</span>
          </div>
        )}
      </div>

      {/* Customer List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i} className="p-5 bg-card border-border/50">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-secondary rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary rounded w-1/4" />
                  <div className="h-3 bg-secondary rounded w-1/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border/50 bg-card/20">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-foreground mb-1">Keine Kunden gefunden</h3>
          <p className="text-muted-foreground text-sm">Fügen Sie Ihren ersten Kunden hinzu.</p>
        </div>
      ) : (
        <div className="space-y-3 slide-up" style={{ animationDelay: '0.2s' }}>
          {filteredCustomers.map(customer => {
            const customerContracts = contracts.filter(c => c.customer_id === customer.id);
            const activeCount = customerContracts.filter(c => c.status === 'aktiv').length;
            const hasVvl = customerContracts.some(c => c.status === 'aktiv' && c.cancellation_deadline);

            return (
              <Card
                key={customer.id}
                className="glass-card card-premium overflow-hidden group hover:bg-secondary/30   rounded-2xl border-transparent hover:border-primary/20"
              >
                <div className="h-1.5 bg-gradient-to-r from-primary via-orange-400 to-primary/50"></div>
                <div className="flex items-center justify-between p-4 gap-3">
                  <div
                    onClick={() => {
                      if (customer.status === "draft") {
                        navigate(`${createPageUrl('CustomerDetail')}?id=${customer.id}&step=dsgvo`);
                      } else {
                        navigate(`${createPageUrl('CustomerDetail')}?id=${customer.id}`);
                      }
                    }}
                    className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                  >
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0 relative    shadow-lg text-white",
                      activeCount > 0
                        ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/20"
                        : "bg-gradient-to-br from-primary to-orange-400 shadow-primary/20"
                    )}>
                      {customer.customer_type === "geschäftlich"
                        ? (customer.company_name?.[0] || "F")
                        : `${customer.first_name?.[0] || ""}${customer.last_name?.[0] || ""}`
                      }
                      {activeCount > 0 && (
                        <div className="absolute -top-2 -right-2 h-6 w-6 bg-emerald-500 text-white rounded-full border-4 border-card flex items-center justify-center text-[10px] font-black">
                          {activeCount}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black text-foreground tracking-tight leading-none mb-1 group-hover:text-primary ">
                        {customer.customer_type === "geschäftlich"
                          ? customer.company_name
                          : `${customer.first_name} ${customer.last_name}`
                        }
                      </h3>
                      <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground tracking-tight">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3 opacity-50" /> {customer.phone}</span>
                        {customer.city && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-border" />
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3 opacity-50" /> {customer.city}</span>
                          </>
                        )}
                        {customer.status === "draft" && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-border" />
                            <Badge className="bg-amber-500/10 text-amber-500 border-none text-[9px] uppercase tracking-widest font-black">Entwurf</Badge>
                          </>
                        )}
                        {hasVvl && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-border" />
                            <Badge className="bg-rose-500/10 text-rose-500 border-none text-[9px] uppercase tracking-widest font-black">VVL-Fenster</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`${createPageUrl('ContractDetail')}?new=true&customer_id=${customer.id}`);
                      }}
                      className="hidden sm:flex bg-secondary/50 hover:bg-primary/10 hover:text-primary text-muted-foreground font-black text-[10px] uppercase tracking-widest h-9 px-4 rounded-xl border border-transparent hover:border-primary/20 "
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Vertrag
                    </Button>
                    <button
                      onClick={() => {
                        if (customer.status === "draft") {
                          navigate(`${createPageUrl('CustomerDetail')}?id=${customer.id}&step=dsgvo`);
                        } else {
                          navigate(`${createPageUrl('CustomerDetail')}?id=${customer.id}`);
                        }
                      }}
                      className="h-10 w-10 md:h-11 md:w-11 flex items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground hover:text-primary hover:bg-primary/10  border border-transparent hover:border-primary/20"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Mobile: FAB */}
      {isMobile && (
        <FloatingActionButton
          actions={[
            {
              icon: UserPlus,
              label: 'Neuer Kunde',
              onClick: () => navigate(`${createPageUrl('CustomerDetail')}?new=true`)
            }
          ]}
        />
      )}
    </div>
  );
}