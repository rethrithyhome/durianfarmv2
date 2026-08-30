export type Role = "owner" | "general_manager" | "team_lead" | "skilled_worker" | "sales";

export type Health = "excellent" | "normal" | "needs_care" | "sick";

export type CareType = "watering" | "fertilizing" | "pesticide" | "pruning" | "treatment" | "other";

export type YieldEventType = "fallen" | "rotten" | "harvested" | "ripeFallen";

export type ExpenseCategory =
  | "seedling" | "fertilizer" | "pesticide" | "labor" | "equipment"
  | "transport" | "packaging" | "salesCost" | "other";

export type SaleType = "retail" | "wholesale";

export type Status = "active" | "inactive";

export interface Worker {
  id: string;
  name: string;
  phone?: string | null;
  position?: string | null;
  specialty?: string | null;
  plot?: string | null;
  status: Status;
  photo?: string | null;
  notes?: string | null;
}

export interface Tree {
  id: string;
  code: string;
  plot?: string | null;
  variety?: string | null;
  plantedDate?: string | null;
  health: Health;
  notes?: string | null;
  photo?: string | null;
}

export interface CareLog {
  id: string;
  treeId: string;
  type: CareType;
  date: string;
  workerId?: string | null;
  note?: string | null;
}

export interface YieldCycle {
  id: string;
  treeId: string;
  year: number;
  flowerDate?: string | null;
  initialCount: number;
  note?: string | null;
}

export interface YieldEvent {
  id: string;
  treeId: string;
  cycleId: string;
  type: YieldEventType;
  quantity: number;
  date: string;
  weightKg?: number | null;
  destination?: string | null; // sale_locations.id
  workerId?: string | null;
  photo?: string | null;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  treeId?: string | null;
  note?: string | null;
}

export interface SaleLocation {
  id: string;
  name: string;
  type: SaleType;
  area?: string | null;
  notes?: string | null;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  type: SaleType;
  address?: string | null;
  notes?: string | null;
}

export interface Sale {
  id: string;
  locationId?: string | null;
  customerId?: string | null;
  saleType: SaleType;
  date: string;
  quantity: number;
  weightKg: number;
  unitPrice: number;
  totalRevenue: number;
  note?: string | null;
}

export interface UserProfile {
  id: string;
  farmId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: Role;
  plots: string[];
  status: Status;
  photo?: string | null;
  notes?: string | null;
}

export type TabKey = "home" | "workers" | "trees" | "expenses" | "sales" | "settings";

export interface RoleVisibility {
  home: boolean;
  workers: boolean;
  trees: boolean;
  expenses: boolean;
  sales: boolean;
  settings: boolean;
}

export interface FarmSettings {
  farmName: string;
  logo: string | null;
  ownerPin: string;
  theme: string;
  visibility: Partial<Record<Role, Partial<RoleVisibility>>>;
}
