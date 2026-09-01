export type Currency = "KHR" | "USD";

export const DEFAULT_EXCHANGE_RATE = 4100; // ៛ per $1

/** Formats an amount in its own currency.
 * KHR shows as a whole number with thousand separators (៛400,000);
 * USD keeps two decimals ($50.00). */
export function fmtCurrency(amount: number | null | undefined, currency: Currency = "KHR"): string {
  const n = Number(amount || 0);
  if (currency === "USD") {
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `៛${Math.round(n).toLocaleString()}`;
}

/** Converts any amount into KHR, the reporting base currency. */
export function toKhr(amount: number, currency: Currency, rate: number): number {
  return currency === "USD" ? amount * rate : amount;
}

/** Converts a KHR amount back into the given currency. */
export function fromKhr(amountKhr: number, currency: Currency, rate: number): number {
  return currency === "USD" ? amountKhr / rate : amountKhr;
}

/**
 * Shows the amount as it was entered, plus its KHR equivalent in
 * parentheses when the entry wasn't already in KHR — so the person sees
 * both the figure they typed and what it means in the base currency.
 */
export function fmtWithBase(amount: number, currency: Currency, amountKhr: number): string {
  if (currency === "KHR") return fmtCurrency(amount, "KHR");
  return `${fmtCurrency(amount, "USD")} (≈ ${fmtCurrency(amountKhr, "KHR")})`;
}

export const CURRENCIES: { key: Currency; label: string; symbol: string }[] = [
  { key: "KHR", label: "រៀល", symbol: "៛" },
  { key: "USD", label: "ដុល្លារ", symbol: "$" },
];
