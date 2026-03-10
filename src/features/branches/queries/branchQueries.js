import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useBranchesList(options = {}) {
  return useQuery({
    queryKey: ["branches"],
    queryFn: () => base44.entities.Branch.list(),
    ...options
  });
}
