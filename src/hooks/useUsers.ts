import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/api";
import { qk } from "./queryKeys";

export function useUsers(enabled: boolean) {
  return useQuery({ queryKey: qk.users, queryFn: () => api.listProfiles(), enabled });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.adminCreateUser,
    onSuccess: (result) => {
      qc.setQueryData(qk.users, (prev: Awaited<ReturnType<typeof api.listProfiles>> | undefined) => [
        { id: result.id, farmId: null, name: result.name, email: result.email, role: result.role, plots: result.plots, status: "active" as const, photo: null, notes: null },
        ...(prev ?? []),
      ]);
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string } & Parameters<typeof api.updateProfile>[1]) => api.updateProfile(input.id, input),
    onSuccess: (_void, input) => {
      qc.setQueryData(qk.users, (prev: Awaited<ReturnType<typeof api.listProfiles>> | undefined) =>
        (prev ?? []).map((u) => (u.id === input.id ? { ...u, ...input } : u))
      );
    },
  });
}

export function useRemoveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.removeUserFromFarm,
    onSuccess: (_void, id) => {
      qc.setQueryData(qk.users, (prev: Awaited<ReturnType<typeof api.listProfiles>> | undefined) =>
        (prev ?? []).map((u) => (u.id === id ? { ...u, status: "inactive" as const } : u))
      );
    },
  });
}
