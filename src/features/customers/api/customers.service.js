import { base44 } from '@/api/base44Client';

export const listCustomers = (sort = '-created_date') => base44.entities.Customer.list(sort);
export const getCustomerById = async (customerId) => {
  const customers = await listCustomers();
  return customers.find((customer) => customer.id === customerId);
};
export const createCustomer = (payload) => base44.entities.Customer.create(payload);
export const updateCustomer = (customerId, payload) => base44.entities.Customer.update(customerId, payload);
export const deleteCustomer = (customerId) => base44.entities.Customer.delete(customerId);

export const listContracts = (sort = '-created_date') => base44.entities.Contract.list(sort);
export const listContractsByCustomer = async (customerId) => {
  const contracts = await listContracts();
  return contracts.filter((contract) => contract.customer_id === customerId && !contract.is_deleted);
};
export const deleteContract = (contractId) => base44.entities.Contract.delete(contractId);

export const listBranches = () => base44.entities.Branch.list();

export const listActivitiesByCustomer = async (customerId) => {
  const activities = await base44.entities.Activity.list('-created_date', 50);
  return activities.filter((activity) => activity.customer_id === customerId);
};

export const listCustomerHistoryByCustomer = async (customerId) => {
  const historyItems = await base44.entities.CustomerHistory.list('-created_date', 200);
  return historyItems.filter((entry) => entry.customer_id === customerId);
};

export const createCustomerHistory = (payload) => base44.entities.CustomerHistory.create(payload);
export const updateCustomerHistory = (historyId, payload) => base44.entities.CustomerHistory.update(historyId, payload);

export const uploadCoreFile = (file) => base44.integrations.Core.UploadFile({ file });
