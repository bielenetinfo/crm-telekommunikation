import { format } from "date-fns";

/**
 * Kalender-Utilities für zukünftige CalDAV/iCal Integration
 */

export function toICalEvent(historyEntry) {
  if (!historyEntry.due_at) return null;

  return {
    uid: historyEntry.id,
    summary: historyEntry.title,
    description: historyEntry.notes || "",
    start: new Date(historyEntry.due_at),
    end: new Date(historyEntry.due_at),
    status: historyEntry.status === 'done' ? 'COMPLETED' : 'CONFIRMED',
    categories: [historyEntry.type],
    priority: historyEntry.priority === 'high' ? 1 : historyEntry.priority === 'medium' ? 5 : 9
  };
}

export function exportToICal(events) {
  const icalEvents = events.map(toICalEvent).filter(e => e !== null);
  return {
    events: icalEvents,
    count: icalEvents.length,
    icalString: null // TODO: Generate VCALENDAR
  };
}

export function getAppointments(historyEntries) {
  return historyEntries.filter(entry => 
    entry.type === 'appointment' && entry.due_at
  );
}

export function getOpenFollowups(historyEntries) {
  return historyEntries.filter(entry => 
    entry.status === 'open' && entry.due_at
  );
}

export function groupEventsByDay(events) {
  const grouped = {};
  events.forEach(event => {
    if (!event.due_at) return;
    const dayKey = format(new Date(event.due_at), 'yyyy-MM-dd');
    if (!grouped[dayKey]) grouped[dayKey] = [];
    grouped[dayKey].push(event);
  });
  return grouped;
}