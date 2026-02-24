import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  angenommen: { label: "Angenommen", className: "bg-blue-100 text-blue-700 border-blue-200" },
  in_bearbeitung: { label: "In Bearbeitung", className: "bg-amber-100 text-amber-700 border-amber-200" },
  warte_auf_teile: { label: "Warte auf Teile", className: "bg-orange-100 text-orange-700 border-orange-200" },
  fertig: { label: "Fertig", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  abgeholt: { label: "Abgeholt", className: "bg-slate-100 text-slate-700 border-slate-200" },
  storniert: { label: "Storniert", className: "bg-rose-100 text-rose-700 border-rose-200" }
};

export default function RepairStatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.angenommen;
  
  return (
    <Badge variant="outline" className={cn("font-medium border", config.className)}>
      {config.label}
    </Badge>
  );
}