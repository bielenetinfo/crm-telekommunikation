import { addDays, differenceInDays, format } from "date-fns";

export const CUSTOMER_STAGE_MACHINE = {
  lead: {
    label: "Lead",
    next: "qualifiziert",
    actionLabel: "Qualifizieren",
    validation: () => null
  },
  qualifiziert: {
    label: "Qualifiziert",
    next: "angebot",
    actionLabel: "Angebot erstellen",
    validation: () => null
  },
  angebot: {
    label: "Angebot",
    next: "vertrag_aktiv",
    actionLabel: "Vertrag aktiv setzen",
    validation: ({ activeContracts = 0 }) => activeContracts > 0 ? null : "Mindestens ein aktiver Vertrag erforderlich"
  },
  vertrag_aktiv: {
    label: "Vertrag aktiv",
    next: null,
    actionLabel: null,
    validation: () => null
  }
};

export const VVL_STAGE_MACHINE = {
  offen: { label: "Offen", next: "in_bearbeitung", actionLabel: "VVL starten" },
  in_bearbeitung: { label: "In Bearbeitung", next: "kunde_kontaktiert", actionLabel: "Kunde kontaktiert" },
  kunde_kontaktiert: { label: "Kunde kontaktiert", next: "angebot_erstellt", actionLabel: "Angebot erstellt" },
  angebot_erstellt: { label: "Angebot erstellt", next: "verlängert", actionLabel: "Als verlängert abschließen" },
  verlängert: { label: "Verlängert", next: null, actionLabel: null },
  gekündigt: { label: "Gekündigt", next: null, actionLabel: null },
  abgelehnt: { label: "Abgelehnt", next: null, actionLabel: null }
};

export const getReminderPriority = ({ dueDate, today = new Date(), kind = "deadline" }) => {
  if (!dueDate) return { level: "normal", label: "Info", score: 10 };
  const daysLeft = differenceInDays(new Date(dueDate), today);

  if (daysLeft < 0) return { level: "dringend", label: `${Math.abs(daysLeft)} Tage überfällig`, score: 100 };
  if (daysLeft <= 7) return { level: "dringend", label: `${daysLeft} Tage Restlaufzeit`, score: 90 };
  if (daysLeft <= 30) return { level: "hoch", label: `${daysLeft} Tage bis ${kind}`, score: 70 };
  if (daysLeft <= 90) return { level: "normal", label: `${daysLeft} Tage bis ${kind}`, score: 40 };
  return { level: "niedrig", label: `${daysLeft} Tage bis ${kind}`, score: 20 };
};

export const historyChangeNote = ({ entity, from, to, actorName }) =>
  `${entity}: ${from || "-"} → ${to || "-"}\nGeändert von: ${actorName}\nZeitpunkt: ${new Date().toISOString()}`;

export async function createTaskIfMissing({ existingTasks = [], base44, task }) {
  const existing = existingTasks.find((t) => t.workflow_key === task.workflow_key && t.status !== "erledigt");
  if (existing) return existing;
  return base44.entities.Task.create(task);
}

export const buildWorkflowTask = ({ title, customer, contract, workflowKey, dueInDays = 2, priority = "normal" }) => ({
  title,
  status: "offen",
  priority,
  due_date: format(addDays(new Date(), dueInDays), "yyyy-MM-dd"),
  customer_id: customer?.id || contract?.customer_id || null,
  customer_name: customer
    ? (customer.customer_type === "geschäftlich" ? customer.company_name : `${customer.first_name} ${customer.last_name}`)
    : contract?.customer_name || "",
  contract_id: contract?.id || null,
  workflow_key: workflowKey,
  source: "workflow_automation",
  created_at: new Date().toISOString()
});
