import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/api";
import type { Expense } from "@/types/domain";
import { useCreateResource, useDeleteResource, useUpdateResource } from "./useOfflineMutation";
import { qk } from "./queryKeys";

export function useExpenses(enabled: boolean) {
  return useQuery({ queryKey: qk.expenses, queryFn: () => api.listExpenses(), enabled });
}
export function useCreateExpense() {
  return useCreateResource<Expense>("expenses", qk.expenses, api.createExpense);
}
export function useUpdateExpense() {
  return useUpdateResource<Expense>("expenses", qk.expenses, api.updateExpense);
}
export function useDeleteExpense() {
  return useDeleteResource("expenses", qk.expenses, api.deleteExpense);
}
export function useSettleExpenses() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, paidDate }: { ids: string[]; paidDate: string }) => api.settleExpenses(ids, paidDate),
    onSuccess: (settled) => {
      const byId = new Map(settled.map((e) => [e.id, e]));
      qc.setQueryData<Expense[]>(qk.expenses, (prev) => (prev ?? []).map((e) => byId.get(e.id) ?? e));
    },
  });
}
