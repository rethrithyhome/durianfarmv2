import { useQuery } from "@tanstack/react-query";
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
