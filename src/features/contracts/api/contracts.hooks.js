import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createActivity,
  createContract,
  createCustomerHistory,
  createFollowup,
  getContractById,
  getVvlRecordById,
  listActivitiesByContract,
  listBranches,
  listContracts,
  listCustomerHistoryByCustomer,
  listCustomers,
  listFollowupsByContract,
  listProviders,
  updateContract,
  updateFollowup,
} from './contracts.service';

export const contractKeys = {
  all: ['contracts'],
  detail: (contractId) => ['contracts', contractId],
  customers: ['customers'],
  providers: ['providers'],
  branches: ['branches'],
  followups: (contractId) => ['contracts', contractId, 'followups'],
  activities: (contractId) => ['contracts', contractId, 'activities'],
  customerHistory: (customerId) => ['customers', customerId, 'history'],
  vvlRecord: (vvlId) => ['vvlRecord', vvlId],
};

export const useContractsQuery = () => useQuery({ queryKey: contractKeys.all, queryFn: () => listContracts('-created_date') });
export const useContractQuery = (contractId, enabled = true) =>
  useQuery({ queryKey: contractKeys.detail(contractId), queryFn: () => getContractById(contractId), enabled: !!contractId && enabled });

export const useContractCustomersQuery = () => useQuery({ queryKey: contractKeys.customers, queryFn: listCustomers });
export const useProvidersQuery = () => useQuery({ queryKey: contractKeys.providers, queryFn: listProviders });
export const useContractBranchesQuery = () => useQuery({ queryKey: contractKeys.branches, queryFn: listBranches });

export const useContractFollowupsQuery = (contractId, enabled = true) =>
  useQuery({ queryKey: contractKeys.followups(contractId), queryFn: () => listFollowupsByContract(contractId), enabled: !!contractId && enabled });

export const useContractActivitiesQuery = (contractId, enabled = true) =>
  useQuery({ queryKey: contractKeys.activities(contractId), queryFn: () => listActivitiesByContract(contractId), enabled: !!contractId && enabled });

export const useContractCustomerHistoryQuery = (customerId, enabled = true) =>
  useQuery({ queryKey: contractKeys.customerHistory(customerId), queryFn: () => listCustomerHistoryByCustomer(customerId), enabled: !!customerId && enabled });

export const useVvlRecordQuery = (vvlId, enabled = true) =>
  useQuery({ queryKey: contractKeys.vvlRecord(vvlId), queryFn: () => getVvlRecordById(vvlId), enabled: !!vvlId && enabled });

export const useCreateContractMutation = () => useMutation({ mutationFn: createContract });
export const useUpdateContractMutation = () => useMutation({ mutationFn: ({ contractId, payload }) => updateContract(contractId, payload) });
export const useCreateActivityMutation = () => useMutation({ mutationFn: createActivity });
export const useCreateFollowupMutation = () => useMutation({ mutationFn: createFollowup });
export const useUpdateFollowupMutation = () => useMutation({ mutationFn: ({ followupId, payload }) => updateFollowup(followupId, payload) });
export const useCreateContractCustomerHistoryMutation = () => useMutation({ mutationFn: createCustomerHistory });
