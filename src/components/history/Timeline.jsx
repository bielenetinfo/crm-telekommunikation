import { format } from "date-fns";
import { de } from "date-fns/locale";
import { 
  Store, Home, Phone, MessageCircle, Smartphone, Wifi, Monitor, TrendingUp,
  FileText, RefreshCw, CheckCircle2, FileX, ClipboardCheck, Calendar, StickyNote, MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const eventConfig = {
  visit_store: { icon: Store, color: "text-blue-400", bg: "bg-blue-500/20", label: "Ladenbesuch" },
  visit_home: { icon: Home, color: "text-purple-400", bg: "bg-purple-500/20", label: "Hausbesuch" },
  call: { icon: Phone, color: "text-emerald-400", bg: "bg-emerald-500/20", label: "Telefonat" },
  message: { icon: MessageCircle, color: "text-cyan-400", bg: "bg-cyan-500/20", label: "Nachricht" },
  service_sim: { icon: Smartphone, color: "text-orange-400", bg: "bg-orange-500/20", label: "SIM-Service" },
  service_router: { icon: Wifi, color: "text-orange-400", bg: "bg-orange-500/20", label: "Router-Service" },
  service_device: { icon: Monitor, color: "text-orange-400", bg: "bg-orange-500/20", label: "Geräte-Service" },
  service_tariff: { icon: TrendingUp, color: "text-orange-400", bg: "bg-orange-500/20", label: "Tarif-Service" },
  contract_created: { icon: FileText, color: "text-[#FFD24D]", bg: "bg-[#FFD24D]/20", label: "Vertrag erstellt" },
  contract_updated: { icon: FileText, color: "text-blue-400", bg: "bg-blue-500/20", label: "Vertrag aktualisiert" },
  vvl_started: { icon: RefreshCw, color: "text-emerald-400", bg: "bg-emerald-500/20", label: "VVL gestartet" },
  vvl_completed: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/20", label: "VVL abgeschlossen" },
  cancellation: { icon: FileX, color: "text-rose-400", bg: "bg-rose-500/20", label: "Kündigung" },
  task_completed: { icon: ClipboardCheck, color: "text-emerald-400", bg: "bg-emerald-500/20", label: "Aufgabe erledigt" },
  appointment: { icon: Calendar, color: "text-indigo-400", bg: "bg-indigo-500/20", label: "Termin" },
  note: { icon: StickyNote, color: "text-[#9CA3AF]", bg: "bg-[#2D3139]", label: "Notiz" },
  other: { icon: MoreHorizontal, color: "text-[#9CA3AF]", bg: "bg-[#2D3139]", label: "Sonstiges" }
};

export default function Timeline({ events, onEventClick }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6B7280] text-sm">Noch keine Einträge in der Historie</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, idx) => {
        const config = eventConfig[event.type] || eventConfig.other;
        const Icon = config.icon;
        const eventDate = event.event_date || event.created_date;
        const isFirst = idx === 0;
        const isLast = idx === events.length - 1;

        return (
          <div key={event.id} className="relative">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-[#2D3139]" />
            )}

            {/* Event card */}
            <div 
              onClick={() => onEventClick && onEventClick(event)}
              className={cn(
                "flex gap-4 group",
                onEventClick && "cursor-pointer"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "relative z-10 h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
                config.bg,
                "transition-all "
              )}>
                <Icon className={cn("h-5 w-5", config.color)} />
              </div>

              {/* Content */}
              <div className={cn(
                "flex-1 min-w-0 pb-6 transition-all",
                onEventClick && "group-hover:translate-x-1"
              )}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-[#EAECEF] text-sm">{event.title}</h4>
                      {event.is_system_event && (
                        <Badge variant="outline" className="text-xs text-[#6B7280] border-[#2D3139]">
                          automatisch
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#6B7280]">
                      {format(new Date(eventDate), 'dd.MM.yyyy, HH:mm', { locale: de })}
                      {event.duration_minutes && ` • ${event.duration_minutes} Min.`}
                      {event.location && ` • ${event.location}`}
                      {event.user_name && ` • ${event.user_name}`}
                    </p>
                  </div>
                  <Badge className={cn("text-xs border", config.bg, config.color, "border-transparent")}>
                    {config.label}
                  </Badge>
                </div>
                
                {event.description && (
                  <p className="text-sm text-[#9CA3AF] leading-relaxed mt-2 whitespace-pre-wrap">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}