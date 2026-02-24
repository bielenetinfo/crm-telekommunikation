import { differenceInDays, subDays } from "date-fns";

/**
 * Zentrale Funktion zur Bestimmung der Vertragspriorität
 * Wird von Dashboard und Contract Detail verwendet
 */
export function getContractPriority(contract, followups = [], today = new Date()) {
  // Prüfe ob offenes Follow-up existiert
  const hasOpenFollowup = followups.some(f => 
    f.contract_id === contract.id && f.status === 'open'
  );

  // FOLLOW-UP hat Vorrang wenn VVL läuft
  if (hasOpenFollowup && ['in_bearbeitung', 'kunde_kontaktiert', 'angebot_erstellt'].includes(contract.vvl_status)) {
    const nextFollowup = followups
      .filter(f => f.contract_id === contract.id && f.status === 'open')
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
    
    const daysUntilFollowup = differenceInDays(new Date(nextFollowup.due_date), today);
    const isOverdue = daysUntilFollowup < 0;
    
    return {
      level: 'FOLLOW_UP',
      color: 'blue',
      label: 'Follow-up',
      reason: isOverdue 
        ? `Follow-up ${Math.abs(daysUntilFollowup)} ${Math.abs(daysUntilFollowup) === 1 ? 'Tag' : 'Tage'} überfällig`
        : `Follow-up ${daysUntilFollowup === 0 ? 'heute' : `in ${daysUntilFollowup} ${daysUntilFollowup === 1 ? 'Tag' : 'Tagen'}`}`,
      order: 4,
      action: 'Nachfassen',
      nextFollowup
    };
  }

  // Deadline berechnen
  const getDeadline = () => {
    if (contract.cancellation_deadline) {
      return new Date(contract.cancellation_deadline);
    }
    if (contract.end_date) {
      const noticeDays = contract.notice_period_days || 30;
      return subDays(new Date(contract.end_date), noticeDays);
    }
    return null;
  };

  const deadline = getDeadline();
  const daysUntil = deadline ? differenceInDays(deadline, today) : null;

  // Daten fehlen
  if (daysUntil === null) {
    return {
      level: 'MISSING_DATA',
      color: 'gray',
      label: 'Daten fehlen',
      reason: 'Kündigungsfrist nicht hinterlegt',
      order: 5,
      action: 'Daten ergänzen'
    };
  }

  // KRITISCH: ≤7 Tage
  if (daysUntil <= 7) {
    return {
      level: 'CRITICAL',
      color: 'red',
      label: `${daysUntil} ${daysUntil === 1 ? 'Tag' : 'Tage'}`,
      reason: `Frist in ${daysUntil} ${daysUntil === 1 ? 'Tag' : 'Tagen'}`,
      order: 1,
      action: 'VVL JETZT starten'
    };
  }

  // DRINGEND: 8-30 Tage
  if (daysUntil <= 30) {
    return {
      level: 'URGENT',
      color: 'orange',
      label: `${daysUntil} Tage`,
      reason: `Frist in ${daysUntil} Tagen`,
      order: 2,
      action: 'VVL starten'
    };
  }

  // PLANEN: 31-90 Tage
  if (daysUntil <= 90) {
    return {
      level: 'PLAN',
      color: 'yellow',
      label: `${daysUntil} Tage`,
      reason: `Frist in ${daysUntil} Tagen`,
      order: 3,
      action: 'VVL planen'
    };
  }

  // NORMAL: > 90 Tage
  return {
    level: 'NORMAL',
    color: 'green',
    label: 'Keine Eile',
    reason: daysUntil ? `Frist in ${daysUntil} Tagen` : 'Läuft normal',
    order: 6
  };
}

export function getPriorityColor(level) {
  switch(level) {
    case "CRITICAL": return { bg: "from-rose-500 to-rose-600", border: "border-rose-500/50", text: "text-rose-400" };
    case "URGENT": return { bg: "from-amber-500 to-amber-600", border: "border-amber-500/50", text: "text-amber-400" };
    case "PLAN": return { bg: "from-yellow-500 to-yellow-600", border: "border-yellow-500/50", text: "text-yellow-400" };
    case "FOLLOW_UP": return { bg: "from-blue-500 to-blue-600", border: "border-blue-500/50", text: "text-blue-400" };
    case "MISSING_DATA": return { bg: "from-slate-500 to-slate-600", border: "border-slate-500/50", text: "text-slate-400" };
    default: return { bg: "from-emerald-500 to-emerald-600", border: "border-emerald-500/50", text: "text-emerald-400" };
  }
}