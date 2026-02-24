import { useState } from "react";
import { format, isPast, isFuture, isToday } from "date-fns";
import { de } from "date-fns/locale";
import {
  Wrench, TrendingUp, HeadphonesIcon, Calendar, StickyNote, Zap,
  Store, Phone, MessageCircle, Mail, Home, MoreHorizontal,
  CheckCircle2, Clock, AlertCircle, Flag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const typeConfig = {
  service: { icon: Wrench, color: "text-orange-400", bg: "bg-orange-500/20", label: "Service" },
  sales: { icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/20", label: "Verkauf" },
  support: { icon: HeadphonesIcon, color: "text-blue-400", bg: "bg-blue-500/20", label: "Support" },
  follow_up: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/20", label: "Follow-up" },
  appointment: { icon: Calendar, color: "text-indigo-400", bg: "bg-indigo-500/20", label: "Termin" },
  note: { icon: StickyNote, color: "text-[#9CA3AF]", bg: "bg-[#2D3139]", label: "Notiz" },
  system: { icon: Zap, color: "text-[#FFD24D]", bg: "bg-[#FFD24D]/20", label: "System" }
};

const channelConfig = {
  store: { icon: Store, label: "Laden" },
  phone: { icon: Phone, label: "Telefon" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp" },
  email: { icon: Mail, label: "E-Mail" },
  home_visit: { icon: Home, label: "Hausbesuch" },
  other: { icon: MoreHorizontal, label: "Sonstiges" }
};

const priorityConfig = {
  low: { color: "text-[#6B7280]", bg: "bg-[#2D3139]" },
  medium: { color: "text-blue-400", bg: "bg-blue-500/20" },
  high: { color: "text-rose-400", bg: "bg-rose-500/20" }
};

export default function TimelineV2({ events, onEventClick, onMarkDone, showFilters = true }) {
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    channel: "all",
    search: ""
  });

  const filteredEvents = events.filter(event => {
    if (filters.type !== "all" && event.type !== filters.type) return false;
    if (filters.status !== "all" && event.status !== filters.status) return false;
    if (filters.channel !== "all" && event.channel !== filters.channel) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return event.title.toLowerCase().includes(search) ||
        event.notes?.toLowerCase().includes(search);
    }
    return true;
  });

  const openCount = events.filter(e => e.status === 'open').length;
  const overdueCount = events.filter(e =>
    e.status === 'open' && e.due_at && isPast(new Date(e.due_at))
  ).length;

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <StickyNote className="h-12 w-12 mx-auto text-[#6B7280] mb-3" />
        <p className="text-[#6B7280] text-sm">Noch keine Einträge in der Historie</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats & Filters */}
      {showFilters && (
        <div className="space-y-3">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[#1F2228] rounded-lg border border-[#2D3139]">
              <p className="text-xs text-[#6B7280] mb-1">Gesamt</p>
              <p className="text-2xl font-bold text-[#EAECEF]">{events.length}</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <p className="text-xs text-amber-400 mb-1">Offen</p>
              <p className="text-2xl font-bold text-amber-400">{openCount}</p>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/30">
              <p className="text-xs text-rose-400 mb-1">Überfällig</p>
              <p className="text-2xl font-bold text-rose-400">{overdueCount}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-4 gap-3">
            <Input
              placeholder="Suchen..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
            />
            <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
              <SelectTrigger className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                <SelectItem value="all">Alle Typen</SelectItem>
                {Object.entries(typeConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
              <SelectTrigger className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="open">Offen</SelectItem>
                <SelectItem value="done">Erledigt</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.channel} onValueChange={(v) => setFilters({ ...filters, channel: v })}>
              <SelectTrigger className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                <SelectItem value="all">Alle Kanäle</SelectItem>
                {Object.entries(channelConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {filteredEvents.map((event, idx) => {
          const typeConf = typeConfig[event.type] || typeConfig.note;
          const channelConf = channelConfig[event.channel] || channelConfig.other;
          const priorityConf = priorityConfig[event.priority] || priorityConfig.medium;
          const TypeIcon = typeConf.icon;
          const ChannelIcon = channelConf.icon;
          const occurredDateRaw = new Date(event.occurred_at);
          const occurredDate = isNaN(occurredDateRaw.getTime()) ? new Date() : occurredDateRaw;
          const dueDateRaw = event.due_at ? new Date(event.due_at) : null;
          const dueDate = (dueDateRaw && !isNaN(dueDateRaw.getTime())) ? dueDateRaw : null;
          const isOverdue = dueDate && isPast(dueDate) && event.status === 'open';
          const isDueToday = dueDate && isToday(dueDate);
          const isDueSoon = dueDate && isFuture(dueDate) && event.status === 'open';
          const isLast = idx === filteredEvents.length - 1;

          return (
            <div key={event.id} className="relative">
              {!isLast && (
                <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-[#2D3139]" />
              )}

              <div className={cn(
                "flex gap-3 p-3 rounded-lg border transition-all",
                event.status === 'done'
                  ? "bg-[#1F2228]/50 border-[#2D3139] opacity-60"
                  : isOverdue
                    ? "bg-rose-500/5 border-rose-500/30"
                    : isDueToday
                      ? "bg-amber-500/5 border-amber-500/30"
                      : "bg-[#1F2228] border-[#2D3139]",
                onEventClick && "cursor-pointer hover:border-[#FFD24D]/50"
              )}
                onClick={() => onEventClick && onEventClick(event)}>

                {/* Icon */}
                <div className={cn(
                  "relative z-10 h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  typeConf.bg
                )}>
                  <TypeIcon className={cn("h-5 w-5", typeConf.color)} />
                  {event.status === 'done' && (
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h4 className={cn(
                      "font-semibold text-sm",
                      event.status === 'done' ? "text-[#6B7280] line-through" : "text-[#EAECEF]"
                    )}>
                      {event.title}
                    </h4>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {event.priority === 'high' && event.status === 'open' && (
                        <Flag className="h-3.5 w-3.5 text-rose-400" />
                      )}
                      <Badge className={cn("text-xs border", typeConf.bg, typeConf.color, "border-transparent")}>
                        {typeConf.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-2">
                    <ChannelIcon className="h-3 w-3" />
                    <span>{channelConf.label}</span>
                    <span>•</span>
                    <span>{format(occurredDate, 'dd.MM.yyyy, HH:mm', { locale: de })}</span>
                    {event.is_system_event && (
                      <>
                        <span>•</span>
                        <Zap className="h-3 w-3" />
                        <span>Auto</span>
                      </>
                    )}
                  </div>

                  {event.notes && (
                    <p className="text-sm text-[#9CA3AF] mb-2 whitespace-pre-wrap leading-relaxed">
                      {event.notes}
                    </p>
                  )}

                  {/* Due Date Alert */}
                  {dueDate && event.status === 'open' && (
                    <div className={cn(
                      "flex items-center gap-2 text-xs p-2 rounded-lg mb-2",
                      isOverdue
                        ? "bg-rose-500/20 text-rose-400"
                        : isDueToday
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-blue-500/20 text-blue-400"
                    )}>
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>
                        {isOverdue
                          ? "Überfällig seit "
                          : isDueToday
                            ? "Heute fällig: "
                            : "Fällig: "}
                        {format(dueDate, 'dd.MM.yyyy, HH:mm', { locale: de })}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  {event.status === 'open' && onMarkDone && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkDone(event.id);
                      }}
                      className="h-7 text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Erledigt
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEvents.length === 0 && events.length > 0 && (
        <div className="text-center py-8">
          <p className="text-[#6B7280] text-sm">Keine Einträge mit diesen Filtern</p>
        </div>
      )}
    </div>
  );
}