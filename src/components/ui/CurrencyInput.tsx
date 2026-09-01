import { Field, inputCls, inputStyle } from "./primitives";
import { CURRENCIES, fmtCurrency, toKhr, type Currency } from "@/lib/currency";
import { C, tint } from "@/lib/tokens";

interface Props {
  label: string;
  amount: string;
  currency: Currency;
  exchangeRate: number;
  onAmountChange: (v: string) => void;
  onCurrencyChange: (c: Currency) => void;
  placeholder?: string;
  step?: string;
}

export function CurrencyInput({ label, amount, currency, exchangeRate, onAmountChange, onCurrencyChange, placeholder, step = "0.01" }: Props) {
  const numeric = Number(amount) || 0;
  const khr = toKhr(numeric, currency, exchangeRate);

  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input
          type="number"
          min="0"
          step={step}
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className={`${inputCls} flex-1`}
          style={inputStyle}
          placeholder={placeholder}
        />
        <div className="flex rounded-xl overflow-hidden shrink-0" style={{ border: `1px solid ${C.line}` }}>
          {CURRENCIES.map((c) => (
            <button
              key={c.key}
              onClick={() => onCurrencyChange(c.key)}
              className="px-3 text-sm font-semibold"
              style={{ background: currency === c.key ? C.green : C.bgAlt, color: currency === c.key ? "#fff" : C.inkSoft }}
            >
              {c.symbol}
            </button>
          ))}
        </div>
      </div>
      {currency === "USD" && numeric > 0 && (
        <div className="text-[11px] mt-1.5 rounded-lg px-2 py-1 inline-block" style={{ background: tint(C.greenMid, 10), color: C.greenMid }}>
          ≈ {fmtCurrency(khr, "KHR")} (អត្រា ៛{exchangeRate.toLocaleString()})
        </div>
      )}
    </Field>
  );
}
