import { format } from "date-fns";
import { de } from "date-fns/locale";
import { 
  Wrench, TrendingUp, HeadphonesIcon, Calendar, StickyNote, Zap, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const typeConfig = {
  service: { icon: Wrench, color: "text-orange-400", bg: "bg-orange-500/20" },
  sales: { icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/20" },
  support: { icon: HeadphonesIcon, color: "text-blue-400", bg: "bg-blue-500/20" },
  follow_up: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/20" },
  appointment: { icon: Calendar, color: "text-indigo-400", bg: "bg-indigo-500/20" },
  note: { icon: StickyNote, color: "text-[#9CA3AF]", bg: "bg-[#2D3139]" },
  system: { icon: Zap, color: "text-[#FFD24D]", bg: "bg-[#FFD24D]/20" }
};

export default function HistoryPreview({ events, onAddClick, limit = 5 }) {
  const recentEvents = events.slice(0, limit);

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-[#6B7280]">Noch keine Aktivitäten</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentEvents.map((event, idx) => {
        const typeConf = typeConfig[event.type] || typeConfig.note;
        const Icon = typeConf.icon;
        const occurredDate = new Date(event.occurred_at);

        return (
          <div key={event.id} className="flex gap-3 items-start">
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0", typeConf.bg)}>
              <Icon className={cn("h-4 w-4", typeConf.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium",
                event.status === 'done' ? "text-[#6B7280] line-through" : "text-[#EAECEF]"
              )}>
                {event.title}
              </p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {format(occurredDate, 'dd.MM.yyyy, HH:mm', { locale: de })}
              </p>
            </div>
          </div>
        );
      })}

      {events.length > limit && (
        <p className="text-xs text-[#6B7280] text-center pt-2">
          +{events.length - limit} weitere Einträge
        </p>
      )}

      {onAddClick && (
        <Button
          size="sm"
          onClick={onAddClick}
          className="w-full mt-3 bg-[#1F2228] text-[#9CA3AF] hover:bg-[#2D3139] hover:text-[#FFD24D] border border-[#2D3139]"
        >
          + Eintrag hinzufügen
        </Button>
      )}
    </div>
  );
}