import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Receipt, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from "@/hooks/useExpenses";
import { useTrees } from "@/hooks/useTrees";
import { can } from "@/lib/permissions";
import { EXPENSE_CATEGORIES, expenseInfo } from "@/lib/constants";
import { fmtDate } from "@/lib/format";
import { fmtCurrency, fmtWithBase } from "@/lib/currency";
import { C } from "@/lib/tokens";
import { EmptyState, FilterChip } from "@/components/ui/primitives";
import { SortMenu } from "@/components/ui/SortMenu";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import type { Expense, FarmSettings, Role } from "@/types/domain";
import { useConfirm } from "@/components/ui/ConfirmDialog";

type SortKey = "recent" | "amount" | "category";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "កាលបរិច្ឆេទ" }, { key: "amount", label: "ចំនួនទឹកប្រាក់" }, { key: "category", label: "ប្រភេទ" },
];

export function ExpensesPage({ role, farm }: { role: Role; farm: FarmSettings }) {
  const confirm = useConfirm();
  const { profile } = useAuth();
  const enabled = !!profile?.farmId;
  const expensesQ = useExpenses(enabled);
  const treesQ = useTrees(enabled);
  const createM = useCreateExpense();
  const updateM = useUpdateExpense();
  const deleteM = useDeleteExpense();

  const [catFilter, setCatFilter] = useState<Expense["category"] | "all">("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [modal, setModal] = useState<{ mode: "add" | "edit"; expense?: Expense } | null>(null);

  const expenses = expensesQ.data ?? [];
  const trees = treesQ.data ?? [];

  const sorted = useMemo(() => {
    let list = catFilter === "all" ? expenses : expenses.filter((e) => e.category === catFilter);
    list = [...list];
    if (sort === "recent") list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    else if (sort === "amount") list.sort((a, b) => b.amountKhr - a.amountKhr);
    else if (sort === "category") list.sort((a, b) => a.category.localeCompare(b.category));
    return list;
  }, [expenses, catFilter, sort]);

  const total = sorted.reduce((s, e) => s + e.amountKhr, 0);

  return (
    <div className="pt-1 pb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold" style={{ color: C.green }}>ចំណាយសរុប៖ {fmtCurrency(total, "KHR")}</div>
        {can(role, "addExpense") && <button onClick={() => setModal({ mode: "add" })} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: C.green, color: "#fff" }}><Plus size={13} /> ថ្មី</button>}
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1.5 overflow-x-auto flex-1 pb-0.5">
          <FilterChip active={catFilter === "all"} onClick={() => setCatFilter("all")} label="ទាំងអស់" />
          {EXPENSE_CATEGORIES.map((c) => <FilterChip key={c.key} active={catFilter === c.key} onClick={() => setCatFilter(c.key)} label={c.label} />)}
        </div>
        <SortMenu value={sort} options={SORT_OPTIONS} onChange={setSort} />
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={Wallet} title="មិនទាន់មានកំណត់ត្រាចំណាយ" hint="បន្ថែមចំណាយពីការដាំរហូតដល់លក់" />
      ) : (
        <div className="space-y-2">
          {sorted.map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${C.red} 12%, transparent)` }}><Receipt size={15} color={C.red} /></div>
              <div className="flex-1 min-w-0"><div className="text-xs font-semibold" style={{ color: C.ink }}>{expenseInfo(e.category).label}</div><div className="text-[10.5px]" style={{ color: C.inkSoft }}>{fmtDate(e.date)}{e.note ? ` · ${e.note}` : ""}</div></div>
              <div className="text-sm font-bold shrink-0" style={{ color: C.red }}>{fmtCurrency(e.amount, e.currency)}</div>
              {can(role, "editExpense") && <button onClick={() => setModal({ mode: "edit", expense: e })}><Pencil size={13} color={C.inkSoft} /></button>}
              {can(role, "deleteExpense") && <button onClick={async () => { if (await confirm({ title: "លុបកំណត់ត្រាចំណាយ?", message: `លុបចំណាយ "${expenseInfo(e.category).label}" ចេញពីប្រព័ន្ធ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`, confirmLabel: "លុប", danger: true })) deleteM.mutate(e.id); }}><Trash2 size={13} color={C.red} /></button>}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ExpenseForm
          initial={modal.expense}
          trees={trees}
          exchangeRate={farm.exchangeRate}
          onClose={() => setModal(null)}
          onSubmit={async (e) => { modal.mode === "add" ? await createM.mutateAsync(e) : await updateM.mutateAsync(e as Expense); }}
        />
      )}
    </div>
  );
}
