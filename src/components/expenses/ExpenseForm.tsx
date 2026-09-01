import { useState } from "react";
import type { Currency, Expense, Tree } from "@/types/domain";
import { SheetModal } from "@/components/ui/SheetModal";
import { Field, PrimaryButton, inputCls, inputStyle } from "@/components/ui/primitives";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { toKhr } from "@/lib/currency";
import { todayISO } from "@/lib/format";

interface Props {
  initial?: Expense;
  trees: Tree[];
  exchangeRate: number;
  onClose: () => void;
  onSubmit: (e: Partial<Expense>) => Promise<void>;
}

export function ExpenseForm({ initial, trees, exchangeRate, onClose, onSubmit }: Props) {
  const [category, setCategory] = useState<Expense["category"]>(initial?.category ?? "fertilizer");
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? "");
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? "KHR");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [treeId, setTreeId] = useState(initial?.treeId ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!amount) return;
    setBusy(true);
    try {
      const numeric = Number(amount);
      await onSubmit({
        ...(initial ?? {}),
        category, amount: numeric, currency,
        amountKhr: toKhr(numeric, currency, exchangeRate),
        exchangeRate,
        date, treeId: treeId || null, note: note.trim(),
      });
      onClose();
    } finally { setBusy(false); }
  };

  return (
    <SheetModal title={initial ? "កែសម្រួលចំណាយ" : "កត់ត្រាចំណាយថ្មី"} onClose={onClose}>
      <Field label="ប្រភេទចំណាយ">
        <select value={category} onChange={(e) => setCategory(e.target.value as Expense["category"])} className={inputCls} style={inputStyle}>{EXPENSE_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select>
      </Field>
      <CurrencyInput
        label="ចំនួនទឹកប្រាក់ *"
        amount={amount}
        currency={currency}
        exchangeRate={exchangeRate}
        onAmountChange={setAmount}
        onCurrencyChange={setCurrency}
      />
      <Field label="កាលបរិច្ឆេទ"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <Field label="ភ្ជាប់ជាមួយដើម (ស្រេចចិត្ត)">
        <select value={treeId} onChange={(e) => setTreeId(e.target.value)} className={inputCls} style={inputStyle}>
          <option value="">មិនភ្ជាប់</option>
          {trees.map((t) => <option key={t.id} value={t.id}>{t.code}</option>)}
        </select>
      </Field>
      <Field label="កំណត់ចំណាំ"><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputCls} style={inputStyle} /></Field>
      <PrimaryButton full onClick={submit} disabled={busy}>{busy ? "កំពុងរក្សាទុក..." : initial ? "រក្សាទុកការផ្លាស់ប្តូរ" : "កត់ត្រាចំណាយ"}</PrimaryButton>
    </SheetModal>
  );
}
