import { useState } from "react";
import type { Currency, Customer, Sale, SaleLocation } from "@/types/domain";
import { SheetModal } from "@/components/ui/SheetModal";
import { Field, PrimaryButton, inputCls, inputStyle } from "@/components/ui/primitives";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { SALE_TYPES } from "@/lib/constants";
import { fmtCurrency, toKhr } from "@/lib/currency";
import { todayISO } from "@/lib/format";
import { C } from "@/lib/tokens";

interface Props {
  initial?: Sale;
  locations: SaleLocation[];
  customers: Customer[];
  exchangeRate: number;
  onAddCustomer: (c: Partial<Customer>) => Promise<Customer>;
  onClose: () => void;
  onSubmit: (s: Partial<Sale>) => Promise<void>;
}

export function SaleForm({ initial, locations, customers, exchangeRate, onAddCustomer, onClose, onSubmit }: Props) {
  const [locationId, setLocationId] = useState(initial?.locationId ?? locations[0]?.id ?? "");
  const [customerId, setCustomerId] = useState(initial?.customerId ?? "");
  const [newCustomer, setNewCustomer] = useState("");
  const [saleType, setSaleType] = useState<Sale["saleType"]>(initial?.saleType ?? "retail");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [quantity, setQuantity] = useState(initial?.quantity?.toString() ?? "");
  const [weightKg, setWeightKg] = useState(initial?.weightKg?.toString() ?? "");
  const [unitPrice, setUnitPrice] = useState(initial?.unitPrice?.toString() ?? "");
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? "KHR");
  const [note, setNote] = useState(initial?.note ?? "");
  const [busy, setBusy] = useState(false);
  const total = (Number(weightKg) || 0) * (Number(unitPrice) || 0);
  const totalKhr = toKhr(total, currency, exchangeRate);

  const submit = async () => {
    if (!locationId || !quantity) return;
    setBusy(true);
    try {
      await onSubmit({
        ...(initial ?? {}), locationId, customerId: customerId || null, saleType, date,
        quantity: Number(quantity), weightKg: Number(weightKg || 0), unitPrice: Number(unitPrice || 0),
        totalRevenue: total, currency, totalRevenueKhr: totalKhr, exchangeRate,
        note: note.trim(),
      });
      onClose();
    } finally { setBusy(false); }
  };

  const addQuickCustomer = async () => {
    if (!newCustomer.trim()) return;
    const saved = await onAddCustomer({ name: newCustomer.trim(), type: saleType });
    setCustomerId(saved.id); setNewCustomer("");
  };

  return (
    <SheetModal title={initial ? "កែសម្រួលការលក់" : "កត់ត្រាការលក់ថ្មី"} onClose={onClose}>
      <Field label="ទីតាំង *">
        <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className={inputCls} style={inputStyle}>
          {locations.length === 0 && <option value="">មិនទាន់មានទីតាំង</option>}
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </Field>
      <Field label="អតិថិជន (ស្រេចចិត្ត)">
        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputCls} style={inputStyle}>
          <option value="">មិនបញ្ជាក់</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex gap-2 mt-2">
          <input value={newCustomer} onChange={(e) => setNewCustomer(e.target.value)} placeholder="បន្ថែមអតិថិជនថ្មី..." className="flex-1 rounded-lg px-2.5 py-1.5 text-[11px] outline-none" style={{ background: C.bgAlt, border: `1px solid ${C.line}`, color: C.ink }} />
          <button onClick={addQuickCustomer} className="rounded-lg px-2.5 text-[11px] font-semibold" style={{ background: C.bgAlt, color: C.greenMid }}>+</button>
        </div>
      </Field>
      <Field label="ប្រភេទលក់"><div className="grid grid-cols-2 gap-2">{SALE_TYPES.map((t) => <button key={t.key} onClick={() => setSaleType(t.key)} className="rounded-xl px-3 py-2 text-xs font-medium" style={{ background: saleType === t.key ? `color-mix(in srgb, ${C.greenMid} 12%, transparent)` : C.bgAlt, color: saleType === t.key ? C.greenMid : C.ink }}>{t.label}</button>)}</div></Field>
      <Field label="កាលបរិច្ឆេទ"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="ចំនួនផ្លែ *"><input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputCls} style={inputStyle} /></Field>
        <Field label="ទម្ងន់ (kg)"><input type="number" min="0" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      </div>
      <CurrencyInput
        label="តម្លៃក្នុងមួយ kg"
        amount={unitPrice}
        currency={currency}
        exchangeRate={exchangeRate}
        onAmountChange={setUnitPrice}
        onCurrencyChange={setCurrency}
      />
      <div className="text-sm font-semibold mb-4" style={{ color: C.greenMid }}>
        ចំណូលសរុប៖ {fmtCurrency(total, currency)}
        {currency === "USD" && total > 0 && <span className="font-normal" style={{ color: C.inkSoft }}> (≈ {fmtCurrency(totalKhr, "KHR")})</span>}
      </div>
      <Field label="កំណត់ចំណាំ"><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputCls} style={inputStyle} /></Field>
      <PrimaryButton full onClick={submit} disabled={busy}>{busy ? "កំពុងរក្សាទុក..." : initial ? "រក្សាទុកការផ្លាស់ប្តូរ" : "កត់ត្រាការលក់"}</PrimaryButton>
    </SheetModal>
  );
}
