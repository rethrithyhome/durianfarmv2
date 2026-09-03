import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/api";
import type { FarmSettings } from "@/types/domain";
import { qk } from "./queryKeys";
import { errorMessage } from "@/lib/errors";
import { useToast } from "@/components/ui/Toast";

export function useFarmSettings(enabled: boolean) {
  return useQuery({ queryKey: qk.farm, queryFn: () => api.getFarm(), enabled });
}

export function useUpdateFarmSettings() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (patch: Partial<FarmSettings>) => api.updateFarm(patch),
    // Apply the change to the cache immediately so things like switching
    // theme feel instant instead of waiting on a network round-trip.
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: qk.farm });
      const previous = qc.getQueryData<FarmSettings>(qk.farm);
      qc.setQueryData<FarmSettings>(qk.farm, (prev) => (prev ? { ...prev, ...patch } : prev));
      return { previous };
    },
    // If the save actually failed, put the old value back rather than
    // leaving the screen showing a change that was never persisted.
    onError: (err, _patch, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.farm, ctx.previous);
      console.error("Farm settings save failed:", err);
      toast.error("រក្សាទុកមិនបានជោគជ័យ៖ " + (errorMessage(err)));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.farm });
    },
  });
}
