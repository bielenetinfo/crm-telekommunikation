import { base44 } from "@/api/base44Client";
import { withApiErrorHandling } from "@/domain/common/errors";
import { parseContract, parseContractInput, parseContractList } from "@/domain/contract/model";

export const contractService = {
  list(order = "-created_date") {
    return withApiErrorHandling(async () => parseContractList(await base44.entities.Contract.list(order)), "Verträge konnten nicht geladen werden");
  },

  async getById(id) {
    const contracts = await this.list();
    return contracts.find((c) => c.id === id) || null;
  },

  async create(data) {
    const payload = parseContractInput(data);
    return withApiErrorHandling(async () => parseContract(await base44.entities.Contract.create(payload)), "Vertrag konnte nicht erstellt werden");
  },

  async update(id, data) {
    const payload = parseContractInput(data);
    return withApiErrorHandling(async () => parseContract(await base44.entities.Contract.update(id, payload)), "Vertrag konnte nicht aktualisiert werden");
  },

  listVisible(order = "-created_date") {
    return this.list(order).then((items) => items.filter((c) => !c.is_deleted));
  },


  listProviders() {
    return withApiErrorHandling(() => base44.entities.Provider.list(), "Provider konnten nicht geladen werden");
  },

  listBranches() {
    return withApiErrorHandling(() => base44.entities.Branch.list(), "Filialen konnten nicht geladen werden");
  },

  getFollowups(contractId) {
    return withApiErrorHandling(async () => {
      const all = await base44.entities.Followup.list();
      return all.filter((f) => f.contract_id === contractId);
    }, "Follow-ups konnten nicht geladen werden");
  },

  getActivities(contractId) {
    return withApiErrorHandling(async () => {
      const all = await base44.entities.Activity.list("-created_date", 50);
      return all.filter((a) => a.contract_id === contractId);
    }, "Aktivitäten konnten nicht geladen werden");
  },

  getCustomerHistory(customerId) {
    return withApiErrorHandling(async () => {
      const all = await base44.entities.CustomerHistory.list("-occurred_at", 200);
      return all.filter((h) => h.customer_id === customerId);
    }, "Historie konnte nicht geladen werden");
  },

  async getVvlRecordById(vvlId) {
    return withApiErrorHandling(async () => {
      const records = await base44.entities.VvlRecord.list("-created_date", 1);
      return records.find((r) => r.id === vvlId) || null;
    }, "VVL-Daten konnten nicht geladen werden");
  },

  createActivity(data) {
    return withApiErrorHandling(() => base44.entities.Activity.create(data), "Aktivität konnte nicht erstellt werden");
  },

  createFollowup(data) {
    return withApiErrorHandling(() => base44.entities.Followup.create(data), "Follow-up konnte nicht erstellt werden");
  },

  updateFollowup(id, data) {
    return withApiErrorHandling(() => base44.entities.Followup.update(id, data), "Follow-up konnte nicht aktualisiert werden");
  },

  createCustomerHistory(data) {
    return withApiErrorHandling(() => base44.entities.CustomerHistory.create(data), "Historieneintrag konnte nicht erstellt werden");
  },

  uploadFile(file) {
    return withApiErrorHandling(() => base44.integrations.Core.UploadFile({ file }), "Datei-Upload fehlgeschlagen");
  }
};
