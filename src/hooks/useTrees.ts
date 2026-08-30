import { useQuery } from "@tanstack/react-query";
import * as api from "@/api";
import type { Tree } from "@/types/domain";
import { useCreateResource, useDeleteResource, useUpdateResource } from "./useOfflineMutation";
import { qk } from "./queryKeys";

export function useTrees(enabled: boolean) {
  return useQuery({ queryKey: qk.trees, queryFn: () => api.listTrees(), enabled });
}
export function useCreateTree() {
  return useCreateResource<Tree>("trees", qk.trees, api.createTree);
}
export function useUpdateTree() {
  return useUpdateResource<Tree>("trees", qk.trees, api.updateTree);
}
export function useDeleteTree() {
  return useDeleteResource("trees", qk.trees, api.deleteTree);
}
