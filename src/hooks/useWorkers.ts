import { useQuery } from "@tanstack/react-query";
import * as api from "@/api";
import type { Worker } from "@/types/domain";
import { useCreateResource, useDeleteResource, useUpdateResource } from "./useOfflineMutation";
import { qk } from "./queryKeys";

export function useWorkers(enabled: boolean) {
  return useQuery({ queryKey: qk.workers, queryFn: () => api.listWorkers(), enabled });
}
export function useCreateWorker() {
  return useCreateResource<Worker>("workers", qk.workers, api.createWorker);
}
export function useUpdateWorker() {
  return useUpdateResource<Worker>("workers", qk.workers, api.updateWorker);
}
export function useDeleteWorker() {
  return useDeleteResource("workers", qk.workers, api.deleteWorker);
}
