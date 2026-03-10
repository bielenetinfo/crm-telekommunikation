import { useState, useEffect, useDeferredValue } from "react";
import { useCustomersQuery, useContractsQuery } from "@/features/customers/api/customers.hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search, Phone, MapPin, User, X, Plus, ArrowRight, Users, TrendingUp, FileText, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { useIsMobile, useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { KpiCard } from "@/components/ui/kpi-card";
import { startOfMonth, endOfMonth } from "date-fns";
import { motion } from "framer-motion";
import CustomerDetail from "@/pages/CustomerDetail";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Customers() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const canUseSplitDetail = useMediaQuery('(min-width: 1700px)');
  const urlParams = new URLSearchParams(window.location.search);
  const addressFilter = urlParams.get('address');
  const selectedCustomerId = urlParams.get('id');
  const isNewDetail = urlParams.get('new') === 'true';
  const [search, setSearch] = useState(addressFilter || "");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (addressFilter) {
      setSearch(addressFilter);
    }
  }, [addressFilter]);

  const { data: customers = [], isLoading } = useCustomersQuery();

  const { data: contracts = [] } = useContractsQuery();

  const filteredCustomers = customers.filter(c => {
    const searchLower = deferredSearch.toLowerCase();
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
      phone.includes(deferredSearch) ||
      whatsapp.includes(deferredSearch) ||
      address.includes(searchLower) ||
      city.includes(searchLower) ||
      postalCode.includes(deferredSearch) ||
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

  const isDetailOpen = !!selectedCustomerId || isNewDetail;
  const showSplitDetail = !!selectedCustomerId && canUseSplitDetail;
  const showDetailOnly = isDetailOpen && !showSplitDetail;
  const showListPane = !showDetailOnly;

  const openCustomerDetail = (customer) => {
    if (customer.status === "draft") {
      navigate(`${createPageUrl('CustomerDetail')}?id=${customer.id}&step=dsgvo`);
      return;
    }
    navigate(`${createPageUrl('CustomerDetail')}?id=${customer.id}`);
  };

  return (
    <div className={cn(
      "h-full w-full overflow-hidden relative",
      showSplitDetail ? "grid grid-cols-[minmax(500px,620px)_1fr] 2xl:grid-cols-[minmax(560px,700px)_1fr]" : "block"
    )}>
      {showListPane && (
      <div
        className={cn(
          "h-full overflow-y-auto transition-all duration-300 min-w-0",
          showSplitDetail
            ? "border-r border-border/40 shrink-0 bg-background/40"
            : "w-full"
        )}
      >
        <div className={cn(
          "space-y-4 md:space-y-5 px-3 sm:px-4 md:px-6 xl:px-8 pt-4 md:pt-6 pb-28 w-full text-foreground",
          !showSplitDetail && "max-w-[1360px] 2xl:max-w-[1440px] mx-auto",
          showSplitDetail && "px-3 sm:px-4 md:px-4 lg:px-5 2xl:px-6"
        )}>

          {/* Header - Dashboard Pattern */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="app-page-title">
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
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className={cn(
              "grid gap-3 sm:gap-4 mt-4 md:mt-6",
              showSplitDetail ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            )}
          >
            <motion.div variants={itemVariants}>
              <KpiCard icon={Users} value={customers.length} label="Gesamt Kunden" color="blue" />
            </motion.div>
            <motion.div variants={itemVariants}>
              <KpiCard icon={TrendingUp} value={newThisMonth} label="Neu diesen Monat" color="green" trend={newThisMonth > 0 ? `+${newThisMonth}` : undefined} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <KpiCard icon={FileText} value={totalContracts} label="Gesamt Verträge" color="primary" />
            </motion.div>
            <motion.div variants={itemVariants}>
              <KpiCard icon={DollarSign} value={avgContractsPerCustomer} label="Ø Verträge/Kunde" color="purple" />
            </motion.div>
          </motion.div>

          {/* Search */}
          <div
            className={cn(
              showSplitDetail && "sticky top-0 z-20 -mx-3 sm:-mx-4 md:-mx-4 lg:-mx-5 2xl:-mx-6 px-3 sm:px-4 md:px-4 lg:px-5 2xl:px-6 py-3 bg-background/85 backdrop-blur-xl border-y border-white/5"
            )}
          >
            <div className="glass-card card-premium p-3 sm:p-4 rounded-2xl md:rounded-3xl slide-up" style={{ animationDelay: '0.1s' }}>
              <div className={cn("relative", showSplitDetail ? "max-w-none" : "max-w-xl")}>
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-primary" />
                <Input
                  placeholder="Suche: Name, Firma, Adresse, PLZ, Telefon..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 h-11 bg-secondary/50 border-transparent focus:bg-background focus:border-primary/50 text-foreground rounded-xl font-medium placeholder:text-muted-foreground/50"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      navigate(createPageUrl('Customers'));
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-3 sm:space-y-4 mt-4 md:mt-6"
            >
	              {filteredCustomers.map(customer => {
	                const customerContracts = contracts.filter(c => c.customer_id === customer.id);
	                const activeCount = customerContracts.filter(c => c.status === 'aktiv').length;
	                const hasVvl = customerContracts.some(c => c.status === 'aktiv' && c.cancellation_deadline);
                    const isSelected = showSplitDetail && selectedCustomerId === customer.id;
	
	                return (
	                  <motion.div variants={itemVariants} key={customer.id}>
	                    <Card
	                      className={cn(
	                        "glass-card card-premium overflow-hidden group hover:-translate-y-1 transition-all duration-300 rounded-2xl border-white/5 hover:border-primary/50 relative motion-reduce:transform-none",
                        isSelected && "border-primary/60 shadow-lg shadow-primary/10 ring-1 ring-primary/30"
                      )}
                    >
                      <div className={cn(
                        "h-1.5 bg-gradient-to-r from-primary via-orange-400 to-primary/50",
                        isSelected && "from-primary via-[#FFD24D] to-primary"
                      )}></div>
                      <div className="flex items-center justify-between p-3 sm:p-4 gap-3">
                        <div
                          onClick={() => openCustomerDetail(customer)}
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
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight leading-none group-hover:text-primary truncate">
                              {customer.customer_type === "geschäftlich"
                                ? customer.company_name
                                : `${customer.first_name} ${customer.last_name}`
                              }
                              </h3>
                              {isSelected && (
                                <Badge className="hidden xl:inline-flex bg-primary/15 text-primary border-primary/25 text-[9px] uppercase tracking-widest font-black">
                                  Geöffnet
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-muted-foreground tracking-tight">
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
                            className={cn("hidden sm:flex bg-secondary/50 hover:bg-primary/10 hover:text-primary text-muted-foreground font-black text-[10px] uppercase tracking-widest h-9 px-4 rounded-xl border border-transparent hover:border-primary/20", isDetailOpen && "px-2")}
                          >
                            <Plus className={cn("h-3.5 w-3.5", !isDetailOpen && "mr-1.5")} />
                            {!isDetailOpen && "Vertrag"}
                          </Button>
                          <button
                            type="button"
                            onClick={() => openCustomerDetail(customer)}
                            aria-label="Kundendetails öffnen"
                            className={cn(
                              "h-10 md:h-11 flex items-center justify-center gap-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 px-3 md:px-4",
                              showSplitDetail ? "min-w-[44px] xl:min-w-[104px]" : "w-10 md:w-auto"
                            )}
	                          >
                            <span className="hidden md:inline text-[10px] uppercase tracking-widest font-black">
                              Öffnen
                            </span>
	                            <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
	                          </button>
	                        </div>
	                      </div>
	                    </Card>
	                  </motion.div>
	                );
	              })}
            </motion.div>
          )}

          {/* Mobile: FAB */}
          {isMobile && !isDetailOpen && (
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
      </div>
      )}

      {/* Split Detail Pane (nur auf sehr breiten Displays) */}
      {showSplitDetail && (
        <div className="flex-1 min-w-0 overflow-y-auto h-full bg-background/30 relative z-10 animate-in slide-in-from-right-8 duration-300">
          <div className="h-full border-l border-white/5 bg-background/70 backdrop-blur-sm">
            <div className="sticky top-0 z-20 px-4 md:px-5 xl:px-6 py-3 border-b border-white/5 bg-background/85 backdrop-blur-xl hidden lg:flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] font-black text-muted-foreground">Kundendetails</p>
                <p className="text-xs text-muted-foreground truncate">
                  Split-Ansicht aktiv (Vollansicht auf Klick weiterhin möglich)
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/5"
                onClick={() => navigate(`${createPageUrl('CustomerDetail')}?id=${selectedCustomerId}`)}
              >
                Vollansicht
              </Button>
            </div>
          <CustomerDetail isSplitView={true} />
          </div>
        </div>
      )}

      {/* Vollansicht auf normalen Displays (intuitiver als schmale Split-Ansicht) */}
      {showDetailOnly && (
        <div className="h-full overflow-y-auto bg-background relative z-10 animate-in slide-in-from-right-8 duration-300">
          <CustomerDetail isSplitView={false} />
        </div>
      )}
    </div>
  );
}
