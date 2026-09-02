import {
  Droplet, Sprout, Bug, Scissors, ShieldAlert, FileText,
  type LucideIcon,
} from "lucide-react";
import type { CareType, ExpenseCategory, Health, SaleType, YieldEventType } from "@/types/domain";

export interface HealthInfo { key: Health; label: string; color: string }
export const HEALTH_LEVELS: HealthInfo[] = [
  { key: "excellent", label: "ល្អប្រសើរ", color: "#2F7A4D" },
  { key: "normal", label: "ធម្មតា", color: "#D9A441" },
  { key: "needs_care", label: "ត្រូវការថែទាំ", color: "#C97A3D" },
  { key: "sick", label: "មានជំងឺ", color: "#B54B3A" },
];
export const healthInfo = (k: Health): HealthInfo => HEALTH_LEVELS.find((h) => h.key === k) ?? HEALTH_LEVELS[1];

export interface CareTypeInfo { key: CareType; label: string; icon: LucideIcon; color: string }
export const CARE_TYPES: CareTypeInfo[] = [
  { key: "watering", label: "ស្រោចទឹក", icon: Droplet, color: "#3E7C8C" },
  { key: "fertilizing", label: "ដាក់ជី", icon: Sprout, color: "#3D6B4F" },
  { key: "pesticide", label: "បាញ់ថ្នាំ", icon: Bug, color: "#6B4A2F" },
  { key: "pruning", label: "កាត់មែក", icon: Scissors, color: "#B9832C" },
  { key: "treatment", label: "ព្យាបាលជំងឺ", icon: ShieldAlert, color: "#B54B3A" },
  { key: "other", label: "ផ្សេងៗ", icon: FileText, color: "#5B6650" },
];
export const careInfo = (k: CareType): CareTypeInfo => CARE_TYPES.find((c) => c.key === k) ?? CARE_TYPES[5];

export interface YieldEventInfo { key: YieldEventType; label: string; color: string; needsHarvestInfo: boolean }
export const YIELD_EVENT_TYPES: YieldEventInfo[] = [
  { key: "fallen", label: "ជ្រុះ", color: "#B9832C", needsHarvestInfo: false },
  { key: "rotten", label: "ស្អុយ/ខូច", color: "#B54B3A", needsHarvestInfo: false },
  { key: "harvested", label: "បេះផ្លែស្អាត", color: "#3D6B4F", needsHarvestInfo: true },
  { key: "ripeFallen", label: "ទុំជ្រុះ", color: "#3E7C8C", needsHarvestInfo: false },
];
export const yieldEventInfo = (k: YieldEventType): YieldEventInfo =>
  YIELD_EVENT_TYPES.find((y) => y.key === k) ?? YIELD_EVENT_TYPES[0];

export interface ExpenseCategoryInfo { key: ExpenseCategory; label: string }
export const EXPENSE_CATEGORIES: ExpenseCategoryInfo[] = [
  { key: "seedling", label: "ដើមកូន/សម្ភារៈដាំដុះ" },
  { key: "fertilizer", label: "ជី" },
  { key: "pesticide", label: "ថ្នាំបាញ់" },
  { key: "labor", label: "ប្រាក់ខែកម្មករ" },
  { key: "equipment", label: "ឧបករណ៍" },
  { key: "transport", label: "ដឹកជញ្ជូន" },
  { key: "packaging", label: "វេចខ្ចប់" },
  { key: "salesCost", label: "ចំណាយផ្នែកលក់" },
  { key: "other", label: "ផ្សេងៗ" },
];
export const expenseInfo = (k: ExpenseCategory): ExpenseCategoryInfo =>
  EXPENSE_CATEGORIES.find((e) => e.key === k) ?? EXPENSE_CATEGORIES[8];

export const SALE_TYPES: { key: SaleType; label: string }[] = [
  { key: "retail", label: "លក់រាយ" },
  { key: "wholesale", label: "លក់ដុំ" },
];

export const GENDER_LABELS: Record<string, string> = { male: "ប្រុស", female: "ស្រី", other: "ផ្សេងៗ" };
export function genderColor(g?: string | null): string {
  return g === "male" ? "#3E7C8C" : g === "female" ? "#DB2777" : "#5B6650";
}
