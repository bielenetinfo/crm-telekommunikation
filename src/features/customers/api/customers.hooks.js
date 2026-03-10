import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createCustomer,
  createCustomerHistory,
  deleteContract,
  deleteCustomer,
  getCustomerById,
  listActivitiesByCustomer,
  listBranches,
  listContracts,
  listContractsByCustomer,
  listCustomerHistoryByCustomer,
  listCustomers,
  updateCustomer,
  updateCustomerHistory,
} from './customers.service';

export const customerKeys = {
  all: ['customers'],
  detail: (customerId) => ['customers', customerId],
  contracts: (customerId) => ['customers', customerId, 'contracts'],
  activities: (customerId) => ['customers', customerId, 'activities'],
  history: (customerId) => ['customers', customerId, 'history'],
  branches: ['branches'],
  contractsAll: ['contracts'],
};

export const useCustomersQuery = () =>
  useQuery({ queryKey: customerKeys.all, queryFn: () => listCustomers('-created_date') });

export const useAllCustomersQuery = (enabled = true) =>
  useQuery({ queryKey: customerKeys.all, queryFn: () => listCustomers(), enabled });

export const useCustomerQuery = (customerId, enabled = true) =>
  useQuery({ queryKey: customerKeys.detail(customerId), queryFn: () => getCustomerById(customerId), enabled: !!customerId && enabled });

export const useCustomerContractsQuery = (customerId, enabled = true) =>
  useQuery({ queryKey: customerKeys.contracts(customerId), queryFn: () => listContractsByCustomer(customerId), enabled: !!customerId && enabled });

export const useBranchesQuery = () =>
  useQuery({ queryKey: customerKeys.branches, queryFn: listBranches });

export const useContractsQuery = () =>
  useQuery({ queryKey: customerKeys.contractsAll, queryFn: () => listContracts() });

export const useCustomerActivitiesQuery = (customerId, enabled = true) =>
  useQuery({ queryKey: customerKeys.activities(customerId), queryFn: () => listActivitiesByCustomer(customerId), enabled: !!customerId && enabled });

export const useCustomerHistoryQuery = (customerId, enabled = true) =>
  useQuery({ queryKey: customerKeys.history(customerId), queryFn: () => listCustomerHistoryByCustomer(customerId), enabled: !!customerId && enabled });

export const useCreateCustomerMutation = () => useMutation({ mutationFn: createCustomer });
export const useUpdateCustomerMutation = () => useMutation({ mutationFn: ({ customerId, payload }) => updateCustomer(customerId, payload) });
export const useDeleteCustomerMutation = () => useMutation({ mutationFn: deleteCustomer });
export const useDeleteContractMutation = () => useMutation({ mutationFn: deleteContract });
export const useCreateCustomerHistoryMutation = () => useMutation({ mutationFn: createCustomerHistory });
export const useUpdateCustomerHistoryMutation = () => useMutation({ mutationFn: ({ historyId, payload }) => updateCustomerHistory(historyId, payload) });
