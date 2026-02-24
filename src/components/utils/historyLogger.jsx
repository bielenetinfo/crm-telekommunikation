import { base44 } from "@/api/base44Client";

/**
 * Zentrales Logging-Utility für Kundenhistorie
 * Verwendung überall im System wo Kunden-Events entstehen
 */

export async function logCustomerEvent({
  customerId,
  customerName,
  type = "system",
  title,
  notes = "",
  channel = "store",
  contractId = null,
  priority = "medium",
  tags = [],
  dueAt = null
}) {
  try {
    await base44.entities.CustomerHistory.create({
      customer_id: customerId,
      customer_name: customerName,
      type,
      title,
      notes,
      channel,
      status: dueAt ? "open" : "done",
      occurred_at: new Date().toISOString(),
      due_at: dueAt,
      contract_id: contractId,
      priority,
      tags: JSON.stringify(tags),
      is_system_event: true
    });
  } catch (error) {
    console.error("Failed to log customer event:", error);
  }
}

export async function logContractCreated(customerId, customerName, contractId, providerName, category) {
  return logCustomerEvent({
    customerId,
    customerName,
    type: "system",
    title: `Vertrag erstellt: ${providerName}`,
    notes: `Kategorie: ${category}`,
    contractId,
    tags: ["contract", "created"]
  });
}

export async function logContractUpdated(customerId, customerName, contractId, changes) {
  return logCustomerEvent({
    customerId,
    customerName,
    type: "system",
    title: "Vertrag aktualisiert",
    notes: changes,
    contractId,
    tags: ["contract", "updated"]
  });
}

export async function logVvlStarted(customerId, customerName, contractId, providerName) {
  return logCustomerEvent({
    customerId,
    customerName,
    type: "system",
    title: `VVL gestartet: ${providerName}`,
    contractId,
    tags: ["vvl", "started"]
  });
}

export async function logVvlCompleted(customerId, customerName, contractId, outcome) {
  return logCustomerEvent({
    customerId,
    customerName,
    type: "system",
    title: `VVL abgeschlossen: ${outcome}`,
    contractId,
    tags: ["vvl", "completed", outcome]
  });
}

export async function logCancellation(customerId, customerName, contractId, providerName) {
  return logCustomerEvent({
    customerId,
    customerName,
    type: "system",
    title: `Kündigung: ${providerName}`,
    contractId,
    priority: "high",
    tags: ["cancellation"]
  });
}

export async function logDocumentUploaded(customerId, customerName, documentType) {
  return logCustomerEvent({
    customerId,
    customerName,
    type: "system",
    title: `Dokument hochgeladen: ${documentType}`,
    tags: ["document"]
  });
}