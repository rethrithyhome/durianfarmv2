import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/api";
import type { PayrollPayment, WorkLog } from "@/types/domain";
import { useDeleteResource } from "./useOfflineMutation";
import { qk } from "./queryKeys";

export function useWorkLogs(enabled: boolean) {
  return useQuery({ queryKey: qk.workLogs, queryFn: () => api.listWorkLogs(), enabled });
}

/** Saving hours is an upsert keyed on (worker, date), so recording the
 * same day again corrects the entry rather than duplicating it. */
export function useSaveWorkLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (l: Partial<WorkLog>) => api.saveWorkLog(l),
    onSuccess: (saved) => {
      qc.setQueryData<WorkLog[]>(qk.workLogs, (prev) => {
        const rest = (prev ?? []).filter((x) => !(x.workerId === saved.workerId && x.date === saved.date));
        return [saved, ...rest];
      });
    },
  });
}
export function useDeleteWorkLog() {
  return useDeleteResource("workLogs", qk.workLogs, api.deleteWorkLog);
}

export function usePayrollPayments(enabled: boolean) {
  return useQuery({ queryKey: qk.payroll, queryFn: () => api.listPayrollPayments(), enabled });
}
export function useCreatePayrollPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<PayrollPayment>) => api.createPayrollPayment(p),
    onSuccess: (saved) => {
      qc.setQueryData<PayrollPayment[]>(qk.payroll, (prev) => [saved, ...(prev ?? [])]);
      // A payment also creates an expense, so refresh those totals too.
      qc.invalidateQueries({ queryKey: qk.expenses });
    },
  });
}
export function useDeletePayrollPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deletePayrollPayment,
    onSuccess: (_v, id) => {
      qc.setQueryData<PayrollPayment[]>(qk.payroll, (prev) => (prev ?? []).filter((x) => x.id !== id));
    },
  });
}
