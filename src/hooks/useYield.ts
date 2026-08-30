import { useQuery } from "@tanstack/react-query";
import * as api from "@/api";
import type { CareLog, YieldCycle, YieldEvent } from "@/types/domain";
import { useCreateResource, useDeleteResource } from "./useOfflineMutation";
import { qk } from "./queryKeys";

export function useCareLogs(enabled: boolean) {
  return useQuery({ queryKey: qk.careLogs, queryFn: () => api.listCareLogs(), enabled });
}
export function useCreateCareLog() {
  return useCreateResource<CareLog>("careLogs", qk.careLogs, api.createCareLog);
}
export function useDeleteCareLog() {
  return useDeleteResource("careLogs", qk.careLogs, api.deleteCareLog);
}

export function useCycles(enabled: boolean) {
  return useQuery({ queryKey: qk.cycles, queryFn: () => api.listCycles(), enabled });
}
export function useCreateCycle() {
  return useCreateResource<YieldCycle>("cycles", qk.cycles, api.createCycle);
}
export function useDeleteCycle() {
  return useDeleteResource("cycles", qk.cycles, api.deleteCycle);
}

export function useEvents(enabled: boolean) {
  return useQuery({ queryKey: qk.events, queryFn: () => api.listEvents(), enabled });
}
export function useCreateEvent() {
  return useCreateResource<YieldEvent>("events", qk.events, api.createEvent);
}
export function useDeleteEvent() {
  return useDeleteResource("events", qk.events, api.deleteEvent);
}
