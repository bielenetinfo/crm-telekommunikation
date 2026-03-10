import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export const contractKeys = {
  all: ["contracts"],
  byCustomer: (customerId) => ["contracts", customerId]
};

export function useContractsList(options = {}) {
  return useQuery({
    queryKey: contractKeys.all,
    queryFn: () => base44.entities.Contract.list(),
    ...options
  });
}

export function useContractMutations(customerId) {
  const queryClient = useQueryClient();

  const deleteContract = useMutation({
    mutationFn: (contractId) => base44.entities.Contract.delete(contractId),
    onSuccess: () => {
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: contractKeys.byCustomer(customerId) });
      }
      queryClient.invalidateQueries({ queryKey: contractKeys.all });
    }
  });

  return { deleteContract };
}
