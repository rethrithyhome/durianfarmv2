import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/api";
import type { Task, TaskStatus } from "@/types/domain";
import { useCreateResource, useDeleteResource, useUpdateResource } from "./useOfflineMutation";
import { qk } from "./queryKeys";

export function useTasks(enabled: boolean) {
  return useQuery({ queryKey: qk.tasks, queryFn: () => api.listTasks(), enabled });
}
export function useCreateTask() {
  return useCreateResource<Task>("tasks", qk.tasks, api.createTask);
}
export function useUpdateTask() {
  return useUpdateResource<Task>("tasks", qk.tasks, api.updateTask);
}
export function useDeleteTask() {
  return useDeleteResource("tasks", qk.tasks, api.deleteTask);
}
export function useSetTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => api.setTaskStatus(id, status),
    onSuccess: (saved) => {
      qc.setQueryData<Task[]>(qk.tasks, (prev) => (prev ?? []).map((t) => (t.id === saved.id ? saved : t)));
    },
  });
}
