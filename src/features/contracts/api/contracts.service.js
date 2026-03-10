import { base44 } from '@/api/base44Client';

export const listContracts = (sort = '-created_date') => base44.entities.Contract.list(sort);
export const getContractById = async (contractId) => {
  const contracts = await listContracts();
  return contracts.find((contract) => contract.id === contractId);
};
export const createContract = (payload) => base44.entities.Contract.create(payload);
export const updateContract = (contractId, payload) => base44.entities.Contract.update(contractId, payload);

export const listProviders = () => base44.entities.Provider.list();
export const listCustomers = () => base44.entities.Customer.list();
export const listBranches = () => base44.entities.Branch.list();

export const listFollowupsByContract = async (contractId) => {
  const followups = await base44.entities.Followup.list();
  return followups.filter((item) => item.contract_id === contractId);
};
export const createFollowup = (payload) => base44.entities.Followup.create(payload);
export const updateFollowup = (followupId, payload) => base44.entities.Followup.update(followupId, payload);

export const listActivitiesByContract = async (contractId) => {
  const activities = await base44.entities.Activity.list('-created_date', 50);
  return activities.filter((item) => item.contract_id === contractId);
};
export const createActivity = (payload) => base44.entities.Activity.create(payload);

export const listCustomerHistoryByCustomer = async (customerId) => {
  const historyItems = await base44.entities.CustomerHistory.list('-occurred_at', 200);
  return historyItems.filter((item) => item.customer_id === customerId);
};
export const createCustomerHistory = (payload) => base44.entities.CustomerHistory.create(payload);

export const getVvlRecordById = async (vvlId) => {
  const records = await base44.entities.VvlRecord.list('-created_date', 1);
  return records.find((record) => record.id === vvlId) || null;
};

export const uploadCoreFile = (file) => base44.integrations.Core.UploadFile({ file });
