import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/api";
import type { FarmSettings } from "@/types/domain";
import { qk } from "./queryKeys";

export function useFarmSettings(enabled: boolean) {
  return useQuery({ queryKey: qk.farm, queryFn: () => api.getFarm(), enabled });
}

export function useUpdateFarmSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<FarmSettings>) => api.updateFarm(patch),
    onSuccess: (_void, patch) => {
      qc.setQueryData<FarmSettings>(qk.farm, (prev) => (prev ? { ...prev, ...patch } : prev));
    },
  });
}
