import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Search, Calendar, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, differenceInDays, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

const timeFilters = [
  { label: "7", days: 7 },
  { label: "14", days: 14 },
  { label: "30", days: 30 },
  { label: "60", days: 60 }
];

export default function VVL() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState(30);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.Contract.list('-cancellation_deadline', 200)
  });

  // Filter expiring contracts
  const today = new Date();
  const filterDate = addDays(today, selectedFilter);

  const expiringContracts = contracts
    .filter(c => c.status === 'aktiv' && c.cancellation_deadline)
    .filter(c => {
      const deadline = new Date(c.cancellation_deadline);
      return deadline >= today && deadline <= filterDate;
    })
    .filter(c => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        c.customer_name?.toLowerCase().includes(search) ||
        c.provider_name?.toLowerCase().includes(search) ||
        c.contract_number?.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => new Date(a.cancellation_deadline) - new Date(b.cancellation_deadline));

  return (
    <div className="space-y-3 px-4 md:px-8 pt-3 md:pt-4 pb-24 w-full text-foreground">
      {/* Header - Dashboard Pattern */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gradient">
            VVL Assistenz
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            {expiringContracts.length} Verträge in {selectedFilter} Tagen
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 bg-card border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            {timeFilters.map(filter => (
              <Button
                key={filter.days}
                onClick={() => setSelectedFilter(filter.days)}
                variant={selectedFilter === filter.days ? "default" : "outline"}
                className={cn(
                  "h-12 px-6 font-semibold text-lg rounded-xl",
                  selectedFilter === filter.days
                    ? "bg-gradient-to-r from-primary to-orange-400 text-primary-foreground hover:from-primary/90 hover:to-orange-500"
                    : "bg-secondary border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {filter.label}
              </Button>
            ))}
            <Button
              onClick={() => setSelectedFilter(999)}
              variant={selectedFilter === 999 ? "default" : "outline"}
              className={cn(
                "h-12 px-6 font-semibold rounded-xl",
                selectedFilter === 999
                  ? "bg-gradient-to-r from-primary to-orange-400 text-primary-foreground hover:from-primary/90 hover:to-orange-500"
                  : "bg-secondary border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              Alle VVL öffnen
            </Button>
          </div>

          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suche..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border text-foreground"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">
          {expiringContracts.length} Verträge laufen in den nächsten {selectedFilter} Tagen ab
        </p>
      </div>

      {/* Contracts Table */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Kunde
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Enddatum
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Kategorie
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Aktion
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D3139]">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                    Lade Verträge...
                  </td>
                </tr>
              ) : expiringContracts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                    Keine auslaufenden Verträge gefunden
                  </td>
                </tr>
              ) : (
                expiringContracts.map((contract) => {
                  const daysUntil = differenceInDays(new Date(contract.cancellation_deadline), today);
                  return (
                    <tr key={contract.id} className="hover:bg-secondary transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-foreground">{contract.customer_name}</p>
                          {contract.contract_number && (
                            <p className="text-xs text-muted-foreground">Nr. {contract.contract_number}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {format(new Date(contract.cancellation_deadline), 'dd.MM.yyyy', { locale: de })}
                            </p>
                            <Badge className={cn(
                              "text-xs mt-1",
                              daysUntil <= 7 ? "bg-red-500/15 text-red-400 border-red-500/30" :
                                daysUntil <= 14 ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                                  "bg-blue-500/15 text-blue-400 border-blue-500/30"
                            )}>
                              {daysUntil} Tage
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-foreground">{contract.provider_name || "-"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30">
                          {contract.category || "Sonstiges"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          size="sm"
                          onClick={() => navigate(`${createPageUrl('ContractDetail')}?vvl_of_contract_id=${contract.id}`)}
                          className="bg-gradient-to-r from-primary to-orange-400 text-primary-foreground hover:from-primary/90 hover:to-orange-500 font-semibold rounded-lg gap-2"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          VVL starten
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}