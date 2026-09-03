import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/api";
import type { HarvestBatch } from "@/types/domain";
import { qk } from "./queryKeys";

export function useBatches(enabled: boolean) {
  return useQuery({ queryKey: qk.batches, queryFn: () => api.listBatches(), enabled });
}
export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createBatch>[0]) => api.createBatch(input),
    onSuccess: (saved) => {
      qc.setQueryData<HarvestBatch[]>(qk.batches, (prev) => [saved, ...(prev ?? [])]);
    },
  });
}
export function useDeleteBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteBatch,
    onSuccess: (_v, id) => {
      qc.setQueryData<HarvestBatch[]>(qk.batches, (prev) => (prev ?? []).filter((b) => b.id !== id));
    },
  });
}
