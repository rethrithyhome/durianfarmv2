import type { Currency } from "@/lib/currency";
export type { Currency };

export type Role = "owner" | "general_manager" | "finance_manager" | "team_lead" | "skilled_worker" | "sales";

export type Health = "excellent" | "normal" | "needs_care" | "sick";

export type CareType = "watering" | "fertilizing" | "pesticide" | "pruning" | "treatment" | "other";

export type YieldEventType = "fallen" | "rotten" | "harvested" | "ripeFallen";

export type ExpenseCategory =
  | "seedling" | "fertilizer" | "pesticide" | "labor" | "equipment"
  | "transport" | "packaging" | "salesCost" | "other";

export type SaleType = "retail" | "wholesale";

export type Status = "active" | "inactive";

export type WageType = "monthly" | "hourly";
/** How a daily worker's pay is calculated: by hours worked, or by an
 * amount entered for each individual day. */
export type DailyRateMode = "hourly" | "daily";
export type Gender = "male" | "female" | "other";

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
  // Payroll — each worker has their own rate, set individually, so
  // different people can be paid differently for the same work.
  gender?: Gender | null;
  birthDate?: string | null;
  idDocUrl?: string | null;   // scanned ID / contract (PDF or image)
  idDocName?: string | null;  // original filename, for display
  wageType: WageType;
  wageRate: number;          // monthly salary, or per-hour rate
  wageCurrency: Currency;
  dailyRateMode?: DailyRateMode | null; // only for wageType === "hourly"
  startDate?: string | null; // first day of work; pro-rates a partial first cycle
}

export interface WorkLog {
  id: string;
  workerId: string;
  date: string;
  hours: number;         // used when dailyRateMode === "hourly"
  /** Amount actually earned that day, entered per day. Used when
   * dailyRateMode === "daily", where the sum varies with how much of the
   * day was worked (a full day vs leaving an hour early, etc). */
  dayAmount?: number | null;
  note?: string | null;
  paymentId?: string | null; // null = not yet paid out
}

export interface PayrollPayment {
  id: string;
  workerId: string;
  wageType: WageType;
  hoursPaid?: number | null;  // hourly payments: hours settled by this payment
  cycleStart: string;         // period covered — a monthly cycle, or any chosen range
  cycleEnd: string;
  amount: number;            // in the currency it was paid in
  currency: Currency;
  amountKhr: number;         // converted at the time of payment
  exchangeRate: number;      // rate used, frozen at payment time
  paidDate: string;
  expenseId?: string | null;
  note?: string | null;
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
  amount: number;            // as entered, in `currency`
  currency: Currency;
  amountKhr: number;         // converted to base currency at entry time
  exchangeRate: number;      // rate used, frozen so history never shifts
  date: string;              // when the expense was incurred
  paid: boolean;             // false = bought on credit, not yet settled
  paidDate?: string | null;  // when it was actually settled (null if unpaid)
  vendor?: string | null;    // who it's owed to, e.g. a shop or supplier
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
  unitPrice: number;            // as entered, in `currency`
  totalRevenue: number;         // as entered, in `currency`
  currency: Currency;
  totalRevenueKhr: number;      // converted to base currency at entry time
  exchangeRate: number;         // rate used, frozen so history never shifts
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

export type TabKey = "home" | "workers" | "tasks" | "payroll" | "trees" | "expenses" | "sales" | "settings";

export interface RoleVisibility {
  home: boolean;
  workers: boolean;
  tasks: boolean;
  payroll: boolean;
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
  exchangeRate: number;          // ៛ per $1, set manually by the owner
  payrollCycleStartDay: number;  // 1–28; e.g. 15 means the 15th–14th
  visibility: Partial<Record<Role, Partial<RoleVisibility>>>;
}

export type TaskStatus = "open" | "done" | "cancelled";
export type TaskPriority = "low" | "normal" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  careType?: CareType | null;
  plot?: string | null;
  treeId?: string | null;
  workerId?: string | null;
  assigneeId?: string | null;
  dueDate?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt?: string | null;
  completedBy?: string | null;
  createdBy?: string | null;
}
