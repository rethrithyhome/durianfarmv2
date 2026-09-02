import { Shield, Briefcase, Map, User, Store, Home, Users, TreePine, Wallet, Receipt, ClipboardList, Calculator, Settings as SettingsIcon, type LucideIcon } from "lucide-react";
import type { CareLog, Role, RoleVisibility, Tree, TabKey, YieldCycle, YieldEvent } from "@/types/domain";

export interface RoleInfo { key: Role; label: string; icon: LucideIcon; desc: string }
export const ROLES: RoleInfo[] = [
  { key: "owner", label: "ម្ចាស់ចំការ", icon: Shield, desc: "សិទ្ធិពេញលេញលើគ្រប់ផ្នែក" },
  { key: "general_manager", label: "អ្នកគ្រប់គ្រងទូទៅ", icon: Briefcase, desc: "គ្រប់គ្រងប្រតិបត្តិការចម្ការ និងផ្នែកលក់" },
  { key: "finance_manager", label: "អ្នកគ្រប់គ្រងចំណូលចំណាយ", icon: Calculator, desc: "គ្រប់គ្រងហិរញ្ញវត្ថុ៖ ចំណាយ ចំណូល និងប្រាក់ឈ្នួល" },
  { key: "team_lead", label: "មេក្រុម", icon: Map, desc: "គ្រប់គ្រងតំបន់/ចម្រៀកដែលបានចាត់តាំង" },
  { key: "skilled_worker", label: "កម្មករជំនាញ", icon: User, desc: "កត់ត្រាការថែទាំ និងទិន្នផលក្នុងតំបន់ខ្លួន" },
  { key: "sales", label: "ផ្នែកលក់", icon: Store, desc: "គ្រប់គ្រងទីតាំងលក់ និងចំណូល" },
];
export const roleInfo = (k: Role): RoleInfo => ROLES.find((r) => r.key === k) ?? ROLES[0];
export const SCOPED_ROLES: Role[] = ["team_lead", "skilled_worker"];

export type Perm =
  | "view" | "farm" | "sales"
  | "addWorker" | "editWorker" | "deleteWorker"
  | "addTree" | "editTree" | "deleteTree"
  | "addCare" | "addYieldCycle" | "addYieldEvent"
  | "addExpense" | "editExpense" | "deleteExpense"
  | "addLocation" | "editLocation" | "deleteLocation"
  | "addCustomer" | "editCustomer" | "deleteCustomer"
  | "addSale" | "editSale" | "deleteSale"
  | "settings" | "resetData" | "viewUsers" | "manageUsers" | "manageVisibility" | "viewReports"
  | "payroll" | "logWork" | "setWage" | "payWages"
  | "tasks" | "assignTask" | "deleteTask";

const PERMS: Record<Role, Perm[]> = {
  owner: [
    "view", "farm", "sales", "addWorker", "editWorker", "deleteWorker", "addTree", "editTree", "deleteTree",
    "addCare", "addYieldCycle", "addYieldEvent", "addExpense", "editExpense", "deleteExpense",
    "addLocation", "editLocation", "deleteLocation", "addCustomer", "editCustomer", "deleteCustomer",
    "addSale", "editSale", "deleteSale", "settings", "resetData", "viewUsers", "manageUsers", "manageVisibility", "viewReports",
    "payroll", "logWork", "setWage", "payWages", "tasks", "assignTask", "deleteTask",
  ],
  general_manager: [
    "view", "farm", "sales", "addWorker", "editWorker", "addTree", "editTree",
    "addCare", "addYieldCycle", "addYieldEvent", "addExpense", "editExpense",
    "addLocation", "editLocation", "addCustomer", "editCustomer", "addSale", "editSale", "viewUsers", "viewReports",
    "payroll", "logWork", "setWage", "payWages", "tasks", "assignTask", "deleteTask",
  ],
  // Money-focused counterpart to the general manager: full control of
  // expenses, sales and payroll, but no authority over farm operations
  // (trees, workers, tasks) — those stay with the general manager.
  finance_manager: [
    "view", "sales",
    "addExpense", "editExpense", "deleteExpense",
    "addLocation", "editLocation", "addCustomer", "editCustomer", "addSale", "editSale", "deleteSale",
    "payroll", "setWage", "payWages",
    "viewReports", "tasks",
  ],
  // Team leads are with the crew daily, so they record hours — but they
  // don't see or set wage amounts.
  team_lead: ["view", "farm", "addTree", "editTree", "addCare", "addYieldCycle", "addYieldEvent", "payroll", "logWork", "tasks", "assignTask"],
  skilled_worker: ["view", "farm", "addCare", "addYieldEvent", "tasks"],
  sales: ["view", "sales", "addLocation", "editLocation", "addCustomer", "editCustomer", "addSale", "editSale", "tasks"],
};
export const can = (role: Role, action: Perm): boolean => PERMS[role]?.includes(action) ?? false;

export function scopeTrees(trees: Tree[], role: Role, scopedPlots: string[]): Tree[] {
  if (SCOPED_ROLES.includes(role)) return trees.filter((t) => !!t.plot && scopedPlots.includes(t.plot));
  return trees;
}
export function scopeByTreeIds<T extends { treeId?: string | null }>(records: T[], treeIds: Set<string>, role: Role): T[] {
  if (!SCOPED_ROLES.includes(role)) return records;
  return records.filter((r) => !r.treeId || treeIds.has(r.treeId));
}
export function scopeCareLogs(logs: CareLog[], treeIds: Set<string>, role: Role): CareLog[] {
  return scopeByTreeIds(logs, treeIds, role);
}
export function scopeCycles(cycles: YieldCycle[], treeIds: Set<string>, role: Role): YieldCycle[] {
  if (!SCOPED_ROLES.includes(role)) return cycles;
  return cycles.filter((c) => treeIds.has(c.treeId));
}
export function scopeEvents(events: YieldEvent[], treeIds: Set<string>, role: Role): YieldEvent[] {
  if (!SCOPED_ROLES.includes(role)) return events;
  return events.filter((e) => treeIds.has(e.treeId));
}

export interface TabDef { key: TabKey; label: string; icon: LucideIcon; need: Perm }
export const APP_TABS: TabDef[] = [
  { key: "home", label: "ទំព័រដើម", icon: Home, need: "view" },
  { key: "workers", label: "កម្មករ", icon: Users, need: "farm" },
  { key: "tasks", label: "ការងារ", icon: ClipboardList, need: "tasks" },
  { key: "payroll", label: "ប្រាក់ឈ្នួល", icon: Wallet, need: "payroll" },
  { key: "trees", label: "ដើមទុរេន", icon: TreePine, need: "farm" },
  { key: "expenses", label: "ចំណាយ", icon: Receipt, need: "addExpense" },
  { key: "sales", label: "លក់", icon: Store, need: "sales" },
  { key: "settings", label: "កំណត់", icon: SettingsIcon, need: "view" },
];
export const VISIBILITY_ROLES: Role[] = ["general_manager", "finance_manager", "team_lead", "skilled_worker", "sales"];
export const defaultVisibility = (): Record<string, Partial<RoleVisibility>> => ({
  general_manager: { home: true, workers: true, tasks: true, payroll: true, trees: true, expenses: true, sales: true, settings: true },
  finance_manager: { home: true, workers: false, tasks: true, payroll: true, trees: false, expenses: true, sales: true, settings: true },
  team_lead: { home: true, workers: false, tasks: true, payroll: true, trees: true, expenses: false, sales: false, settings: true },
  skilled_worker: { home: true, workers: false, tasks: true, payroll: false, trees: true, expenses: false, sales: false, settings: true },
  sales: { home: true, workers: false, tasks: true, payroll: false, trees: false, expenses: false, sales: true, settings: true },
});
export function getVisibleTabs(role: Role, visibility: Record<string, Partial<RoleVisibility>>): TabDef[] {
  const base = APP_TABS.filter((t) => can(role, t.need));
  if (role === "owner") return base;
  const v = visibility[role] ?? {};
  return base.filter((t) => v[t.key as keyof RoleVisibility] !== false);
}
