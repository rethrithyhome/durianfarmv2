import { useQuery } from "@tanstack/react-query";
import * as api from "@/api";
import type { Customer, Sale, SaleLocation } from "@/types/domain";
import { useCreateResource, useDeleteResource, useUpdateResource } from "./useOfflineMutation";
import { qk } from "./queryKeys";

export function useLocations(enabled: boolean) {
  return useQuery({ queryKey: qk.locations, queryFn: () => api.listLocations(), enabled });
}
export function useCreateLocation() {
  return useCreateResource<SaleLocation>("locations", qk.locations, api.createLocation);
}
export function useUpdateLocation() {
  return useUpdateResource<SaleLocation>("locations", qk.locations, api.updateLocation);
}
export function useDeleteLocation() {
  return useDeleteResource("locations", qk.locations, api.deleteLocation);
}

export function useCustomers(enabled: boolean) {
  return useQuery({ queryKey: qk.customers, queryFn: () => api.listCustomers(), enabled });
}
export function useCreateCustomer() {
  return useCreateResource<Customer>("customers", qk.customers, api.createCustomer);
}
export function useUpdateCustomer() {
  return useUpdateResource<Customer>("customers", qk.customers, api.updateCustomer);
}
export function useDeleteCustomer() {
  return useDeleteResource("customers", qk.customers, api.deleteCustomer);
}

export function useSales(enabled: boolean) {
  return useQuery({ queryKey: qk.sales, queryFn: () => api.listSales(), enabled });
}
export function useCreateSale() {
  return useCreateResource<Sale>("sales", qk.sales, api.createSale);
}
export function useUpdateSale() {
  return useUpdateResource<Sale>("sales", qk.sales, api.updateSale);
}
export function useDeleteSale() {
  return useDeleteResource("sales", qk.sales, api.deleteSale);
}
