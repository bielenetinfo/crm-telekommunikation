import { differenceInDays } from "date-fns";

export const PIPELINE_STAGES = ["lead", "qualifiziert", "angebot", "abschluss"];

export const PIPELINE_STAGE_LABELS = {
  lead: "Lead",
  qualifiziert: "Qualifiziert",
  angebot: "Angebot",
  abschluss: "Abschluss"
};

export const PIPELINE_REQUIRED_FIELDS = {
  lead: ["contact_channel"],
  qualifiziert: ["contact_channel", "next_appointment_date"],
  angebot: ["contact_channel", "next_appointment_date", "expected_revenue"],
  abschluss: ["contact_channel", "expected_revenue"]
};

export const PIPELINE_FIELD_LABELS = {
  contact_channel: "Kontaktkanal",
  next_appointment_date: "Nächster Termin",
  expected_revenue: "Erwarteter Umsatz"
};

export const KPI_TARGETS = {
  conversionRate: { label: "Conversion Rate", target: 35, warning: 25, unit: "%", direction: "higher" },
  timeToClose: { label: "Time-to-Close", target: 21, warning: 30, unit: " Tage", direction: "lower" },
  openFollowups: { label: "Offene Follow-ups", target: 12, warning: 20, unit: "", direction: "lower" },
  advisorRevenue: { label: "Umsatz/Berater", target: 12000, warning: 8000, unit: " €", direction: "higher" }
};

export const FOLLOWUP_RULES = {
  inactivityDays: 7,
  vvlWindowDays: 45
};

export const getStageMissingFields = (pipelineStage = "lead", data = {}) => {
  const requiredFields = PIPELINE_REQUIRED_FIELDS[pipelineStage] || [];
  return requiredFields.filter((field) => {
    const value = data[field];
    return value === null || value === undefined || value === "";
  });
};

export const getKpiSignal = (value, config) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return { state: "gelb", label: "Keine Daten" };
  }

  if (config.direction === "higher") {
    if (value >= config.target) return { state: "gruen", label: "im Ziel" };
    if (value >= config.warning) return { state: "gelb", label: "beobachten" };
    return { state: "rot", label: "kritisch" };
  }

  if (value <= config.target) return { state: "gruen", label: "im Ziel" };
  if (value <= config.warning) return { state: "gelb", label: "beobachten" };
  return { state: "rot", label: "kritisch" };
};

export const getSignalClasses = (state) => ({
  gruen: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  gelb: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  rot: "bg-rose-500/10 text-rose-400 border-rose-500/30"
}[state] || "bg-slate-500/10 text-slate-400 border-slate-500/30");

export const buildAutoFollowupEntries = ({ contracts = [], activities = [] }) => {
  const latestActivityByCustomer = activities.reduce((acc, activity) => {
    if (!activity.customer_id || !activity.timestamp) return acc;
    const ts = new Date(activity.timestamp);
    if (Number.isNaN(ts.getTime())) return acc;
    if (!acc[activity.customer_id] || ts > acc[activity.customer_id]) {
      acc[activity.customer_id] = ts;
    }
    return acc;
  }, {});

  const now = new Date();
  const entries = [];

  contracts.forEach((contract) => {
    if (contract.status === "gekündigt" || contract.status === "abgelaufen") return;

    const lastActivity = latestActivityByCustomer[contract.customer_id];
    if (!lastActivity || differenceInDays(now, lastActivity) >= FOLLOWUP_RULES.inactivityDays) {
      entries.push({
        id: `inactivity-${contract.id}`,
        rule: "inactivity",
        title: "Keine Aktivität seit 7+ Tagen",
        customer_name: contract.customer_name,
        customer_id: contract.customer_id,
        contract_id: contract.id,
        due_date: now.toISOString().slice(0, 10),
        severity: "hoch"
      });
    }

    if (contract.cancellation_deadline) {
      const daysToVvl = differenceInDays(new Date(contract.cancellation_deadline), now);
      if (daysToVvl >= 0 && daysToVvl <= FOLLOWUP_RULES.vvlWindowDays) {
        entries.push({
          id: `vvl-${contract.id}`,
          rule: "vvl_window",
          title: `VVL-Fenster nähert sich (${daysToVvl} Tage)`,
          customer_name: contract.customer_name,
          customer_id: contract.customer_id,
          contract_id: contract.id,
          due_date: contract.cancellation_deadline,
          severity: daysToVvl <= 14 ? "dringend" : "hoch"
        });
      }
    }

    let docs = [];
    if (contract.contract_documents) {
      try {
        docs = Array.isArray(contract.contract_documents) ? contract.contract_documents : JSON.parse(contract.contract_documents);
      } catch {
        docs = [];
      }
    }

    if (!docs.length) {
      entries.push({
        id: `docs-${contract.id}`,
        rule: "missing_documents",
        title: "Fehlende Vertragsdokumente",
        customer_name: contract.customer_name,
        customer_id: contract.customer_id,
        contract_id: contract.id,
        due_date: now.toISOString().slice(0, 10),
        severity: "normal"
      });
    }
  });

  return entries;
};
