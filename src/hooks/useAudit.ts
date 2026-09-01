import { useQuery } from "@tanstack/react-query";
import * as api from "@/api";
import { qk } from "./queryKeys";

export function useAuditLogs(enabled: boolean) {
  return useQuery({ queryKey: qk.audit, queryFn: () => api.listAuditLogs(), enabled });
}
