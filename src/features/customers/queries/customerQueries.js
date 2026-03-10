import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export const customerKeys = {
  all: ["customers"],
  detail: (customerId) => ["customer", customerId],
  contracts: (customerId) => ["contracts", customerId],
  activities: (customerId) => ["activities", customerId],
  history: (customerId) => ["customerHistory", customerId]
};

export function useCustomersList(options = {}) {
  return useQuery({
    queryKey: customerKeys.all,
    queryFn: () => base44.entities.Customer.list("-created_date"),
    ...options
  });
}

export function useCustomerById(customerId, options = {}) {
  return useQuery({
    queryKey: customerKeys.detail(customerId),
    queryFn: async () => {
      const customers = await base44.entities.Customer.list();
      return customers.find((customer) => customer.id === customerId);
    },
    enabled: !!customerId,
    ...options
  });
}

export function useCustomerContracts(customerId, options = {}) {
  return useQuery({
    queryKey: customerKeys.contracts(customerId),
    queryFn: async () => {
      const contracts = await base44.entities.Contract.list();
      return contracts.filter((contract) => contract.customer_id === customerId && !contract.is_deleted);
    },
    enabled: !!customerId,
    ...options
  });
}

export function useCustomerActivities(customerId, options = {}) {
  return useQuery({
    queryKey: customerKeys.activities(customerId),
    queryFn: async () => {
      const activities = await base44.entities.Activity.list("-created_date", 50);
      return activities.filter((activity) => activity.customer_id === customerId);
    },
    enabled: !!customerId,
    ...options
  });
}

export function useCustomerHistory(customerId, options = {}) {
  return useQuery({
    queryKey: customerKeys.history(customerId),
    queryFn: async () => {
      const history = await base44.entities.CustomerHistory.list("-created_date", 200);
      return history.filter((entry) => entry.customer_id === customerId);
    },
    enabled: !!customerId,
    ...options
  });
}

export function useCustomerMutations() {
  const queryClient = useQueryClient();

  const createCustomer = useMutation({
    mutationFn: (payload) => base44.entities.Customer.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    }
  });

  const updateCustomer = useMutation({
    mutationFn: ({ customerId, payload }) => base44.entities.Customer.update(customerId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.customerId) });
    }
  });

  const deleteCustomer = useMutation({
    mutationFn: (customerId) => base44.entities.Customer.delete(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    }
  });

  return {
    createCustomer,
    updateCustomer,
    deleteCustomer
  };
}
