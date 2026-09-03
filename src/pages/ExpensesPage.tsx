import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Receipt, Wallet, Check, FileText, Store } from "lucide-react";
import { MultiSelectFilter } from "@/components/ui/MultiSelectFilter";
import { useAuth } from "@/contexts/AuthContext";
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useSettleExpenses } from "@/hooks/useExpenses";
import { useTrees } from "@/hooks/useTrees";
import { can } from "@/lib/permissions";
import { EXPENSE_CATEGORIES, expenseInfo } from "@/lib/constants";
import { fmtDate, todayISO } from "@/lib/format";
import { fmtCurrency } from "@/lib/currency";
import { errorMessage } from "@/lib/errors";
import { C, tint } from "@/lib/tokens";
import { EmptyState, FilterChip, StatCard, PrimaryButton, Badge } from "@/components/ui/primitives";
import { SkeletonList } from "@/components/ui/Skeleton";
import { SortMenu } from "@/components/ui/SortMenu";
import { SheetModal } from "@/components/ui/SheetModal";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import type { Expense, FarmSettings, Role } from "@/types/domain";

type SortKey = "recent" | "amount" | "category";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "កាលបរិច្ឆេទ" }, { key: "amount", label: "ចំនួនទឹកប្រាក់" }, { key: "category", label: "ប្រភេទ" },
];
type StatusFilter = "all" | "paid" | "unpaid";
type SubTab = "list" | "settle";

export function ExpensesPage({ role, farm }: { role: Role; farm: FarmSettings }) {
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const enabled = !!profile?.farmId;
  const expensesQ = useExpenses(enabled);
  const treesQ = useTrees(enabled);
  const createM = useCreateExpense();
  const updateM = useUpdateExpense();
  const deleteM = useDeleteExpense();
  const settleM = useSettleExpenses();

  const [sub, setSub] = useState<SubTab>("list");
  const [catFilter, setCatFilter] = useState<Set<Expense["category"]>>(new Set());
  const [monthFilter, setMonthFilter] = useState(""); // "" = all time, else "YYYY-MM"
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [settleCatFilter, setSettleCatFilter] = useState<Set<Expense["category"]>>(new Set());
  const [settleSort, setSettleSort] = useState<"oldest" | "newest" | "amount">("oldest");
  const [modal, setModal] = useState<{ mode: "add" | "edit"; expense?: Expense } | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [confirmSettle, setConfirmSettle] = useState(false);
  const [busy, setBusy] = useState(false);

  const expenses = expensesQ.data ?? [];
  const trees = treesQ.data ?? [];
  const unpaid = useMemo(() => expenses.filter((e) => !e.paid), [expenses]);
  const visibleUnpaid = useMemo(() => {
    let list = settleCatFilter.size === 0 ? unpaid : unpaid.filter((e) => settleCatFilter.has(e.category));
    list = [...list];
    if (settleSort === "oldest") list.sort((a, b) => a.date.localeCompare(b.date));
    else if (settleSort === "newest") list.sort((a, b) => b.date.localeCompare(a.date));
    else list.sort((a, b) => b.amountKhr - a.amountKhr);
    return list;
  }, [unpaid, settleCatFilter, settleSort]);
  const totalDebtKhr = unpaid.reduce((s, e) => s + e.amountKhr, 0);

  const sorted = useMemo(() => {
    let list = catFilter.size === 0 ? expenses : expenses.filter((e) => catFilter.has(e.category));
    if (statusFilter !== "all") list = list.filter((e) => (statusFilter === "paid" ? e.paid : !e.paid));
    if (monthFilter) list = list.filter((e) => e.date.startsWith(monthFilter));
    list = [...list];
    if (sort === "recent") list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    else if (sort === "amount") list.sort((a, b) => b.amountKhr - a.amountKhr);
    else if (sort === "category") list.sort((a, b) => a.category.localeCompare(b.category));
    return list;
  }, [expenses, catFilter, statusFilter, monthFilter, sort]);

  const total = sorted.reduce((s, e) => s + e.amountKhr, 0);
  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const selectedTotalKhr = unpaid.filter((e) => selected[e.id]).reduce((s, e) => s + e.amountKhr, 0);

  const settleSelected = async () => {
    setBusy(true);
    try {
      await settleM.mutateAsync({ ids: selectedIds, paidDate: todayISO() });
      toast.success(`ទូទាត់ជោគជ័យ ${selectedIds.length} ធាតុ`);
      setSelected({});
      setConfirmSettle(false);
    } catch (err) {
      toast.error("ទូទាត់មិនបានជោគជ័យ៖ " + errorMessage(err));
    } finally { setBusy(false); }
  };

  return (
    <div className="pt-1 pb-4">
      {can(role, "viewReports") && (
        <button onClick={() => navigate("/expense-report")} className="w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 mb-3 text-xs font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.green }}>
          <FileText size={15} /> តារាងចំណាយ (ព្រីន/CSV)
        </button>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <StatCard icon={Wallet} label="ចំណាយសរុប" value={fmtCurrency(total, "KHR")} accent={C.green} sub={monthFilter ? new Date(monthFilter + "-01").toLocaleDateString("km", { year: "numeric", month: "long" }) : undefined} />
        <StatCard icon={Store} label="នៅជំពាក់" value={fmtCurrency(totalDebtKhr, "KHR")} accent={unpaid.length ? C.goldDeep : C.greenMid} sub={`${unpaid.length} ធាតុ`} />
      </div>

      <div className="flex rounded-xl p-1 mb-3" style={{ background: C.bgAlt }}>
        <button onClick={() => setSub("list")} className="flex-1 rounded-lg py-2 text-[11px] font-semibold" style={{ background: sub === "list" ? C.card : "transparent", color: sub === "list" ? C.green : C.inkSoft }}>ចំណាយទាំងអស់</button>
        <button onClick={() => setSub("settle")} className="flex-1 rounded-lg py-2 text-[11px] font-semibold" style={{ background: sub === "settle" ? C.card : "transparent", color: sub === "settle" ? C.green : C.inkSoft }}>ទូទាត់ជំពាក់ {unpaid.length > 0 ? `(${unpaid.length})` : ""}</button>
      </div>

      {sub === "list" && (
        <>
          <div className="flex items-center justify-between mb-3">
            {can(role, "addExpense") && <button onClick={() => setModal({ mode: "add" })} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: C.green, color: "#fff" }}><Plus size={13} /> ថ្មី</button>}
            <SortMenu value={sort} options={SORT_OPTIONS} onChange={setSort} />
          </div>
          <div className="flex gap-1.5 overflow-x-auto mb-2 pb-0.5">
            <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")} label="ស្ថានភាពទាំងអស់" />
            <FilterChip active={statusFilter === "paid"} onClick={() => setStatusFilter("paid")} label="បង់រួច" color={C.greenMid} />
            <FilterChip active={statusFilter === "unpaid"} onClick={() => setStatusFilter("unpaid")} label="ជំពាក់" color={C.goldDeep} />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <MultiSelectFilter label="ប្រភេទ" options={EXPENSE_CATEGORIES} selected={catFilter} onChange={setCatFilter} />
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="rounded-xl px-3 py-2 text-[11px] font-medium outline-none"
              style={{ background: monthFilter ? tint(C.greenMid, 12) : C.card, border: `1px solid ${monthFilter ? C.greenMid : C.line}`, color: monthFilter ? C.greenMid : C.inkSoft }}
            />
            {monthFilter && (
              <button onClick={() => setMonthFilter("")} className="text-[11px] font-semibold shrink-0" style={{ color: C.red }}>សម្អាត</button>
            )}
          </div>

          {expensesQ.isPending ? (
            <SkeletonList count={5} />
          ) : sorted.length === 0 ? (
            <EmptyState icon={Wallet} title="មិនទាន់មានកំណត់ត្រាចំណាយ" hint="បន្ថែមចំណាយពីការដាំរហូតដល់លក់" />
          ) : (
            <div className="space-y-2">
              {sorted.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${e.paid ? C.line : tint(C.goldDeep, 35)}` }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: tint(e.paid ? C.red : C.goldDeep, 12) }}><Receipt size={15} color={e.paid ? C.red : C.goldDeep} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: C.ink }}>
                      {expenseInfo(e.category).label}
                      {!e.paid && <Badge label="ជំពាក់" color={C.goldDeep} />}
                    </div>
                    <div className="text-[10.5px] flex items-center gap-1" style={{ color: C.inkSoft }}>
                      {fmtDate(e.date)}{e.vendor ? ` · ${e.vendor}` : ""}{e.note ? ` · ${e.note}` : ""}
                      {e.receiptUrl && <FileText size={11} />}
                    </div>
                  </div>
                  <div className="text-sm font-bold shrink-0" style={{ color: e.paid ? C.red : C.goldDeep }}>{fmtCurrency(e.amount, e.currency)}</div>
                  {can(role, "editExpense") && <button onClick={() => setModal({ mode: "edit", expense: e })}><Pencil size={13} color={C.inkSoft} /></button>}
                  {can(role, "deleteExpense") && <button onClick={async () => { if (await confirm({ title: "លុបកំណត់ត្រាចំណាយ?", message: `លុបចំណាយ "${expenseInfo(e.category).label}" ចេញពីប្រព័ន្ធ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`, confirmLabel: "លុប", danger: true })) deleteM.mutate(e.id); }}><Trash2 size={13} color={C.red} /></button>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {sub === "settle" && (
        expensesQ.isPending ? (
          <SkeletonList count={4} avatar={false} />
        ) : unpaid.length === 0 ? (
          <EmptyState icon={Check} title="គ្មានចំណាយជំពាក់ទេ" hint="ចំណាយទាំងអស់ត្រូវបានទូទាត់រួច" />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <MultiSelectFilter label="ប្រភេទ" options={EXPENSE_CATEGORIES} selected={settleCatFilter} onChange={setSettleCatFilter} />
              <SortMenu value={settleSort} options={[{ key: "oldest", label: "ចាស់បំផុតមុន" }, { key: "amount", label: "ចំនួនច្រើនបំផុត" }, { key: "newest", label: "ថ្មីបំផុត" }]} onChange={setSettleSort} />
            </div>
            <div className="rounded-xl p-2.5 text-[10.5px] mb-3" style={{ background: tint(C.blue, 8), color: C.brown }}>
              ជ្រើសរើសតែធាតុដែលចង់បង់ឥឡូវ — ទុកអ្វីមិនទាន់ត្រៀម សម្រាប់បង់នៅពេលក្រោយវិញបាន
            </div>
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setSelected(visibleUnpaid.every((e) => selected[e.id]) ? {} : Object.fromEntries(visibleUnpaid.map((e) => [e.id, true])))} className="text-[11px] font-semibold" style={{ color: C.greenMid }}>
                {visibleUnpaid.every((e) => selected[e.id]) ? "ដកការជ្រើសទាំងអស់" : "ជ្រើសទាំងអស់ដែលបង្ហាញ"}
              </button>
              <div className="text-[11px]" style={{ color: C.inkSoft }}>ជ្រើស {selectedIds.length}/{visibleUnpaid.length}</div>
            </div>
            <div className="space-y-2 mb-3">
              {visibleUnpaid.map((e) => {
                const on = !!selected[e.id];
                return (
                  <button key={e.id} onClick={() => setSelected((s) => ({ ...s, [e.id]: !on }))} className="w-full flex items-center gap-3 rounded-2xl p-3 text-left" style={{ background: C.card, border: `1.5px solid ${on ? C.green : C.line}` }}>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: on ? C.green : C.bgAlt, border: `1px solid ${on ? C.green : C.line}` }}>
                      {on && <Check size={13} color="#fff" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold" style={{ color: C.ink }}>{expenseInfo(e.category).label}</div>
                      <div className="text-[10.5px]" style={{ color: C.inkSoft }}>{fmtDate(e.date)}{e.vendor ? ` · ${e.vendor}` : ""}{e.note ? ` · ${e.note}` : ""}</div>
                    </div>
                    <div className="text-sm font-bold shrink-0" style={{ color: C.goldDeep }}>{fmtCurrency(e.amount, e.currency)}</div>
                  </button>
                );
              })}
            </div>
            <div className="sticky bottom-20 lg:bottom-4 rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: "var(--shadow-float)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px]" style={{ color: C.inkSoft }}>សរុបត្រូវទូទាត់</div>
                <div className="text-base font-bold" style={{ color: C.green }}>{fmtCurrency(selectedTotalKhr, "KHR")}</div>
              </div>
              <PrimaryButton full onClick={() => setConfirmSettle(true)} disabled={selectedIds.length === 0}>ទូទាត់ {selectedIds.length} ធាតុ</PrimaryButton>
            </div>
          </>
        )
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

      {confirmSettle && (
        <SheetModal title="បញ្ជាក់ការទូទាត់" onClose={() => setConfirmSettle(false)}>
          <div className="text-[11px] mb-3" style={{ color: C.inkSoft }}>{selectedIds.length} ធាតុ</div>
          <div className="rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${C.line}` }}>
            {unpaid.filter((e) => selected[e.id]).map((e) => (
              <div key={e.id} className="flex items-center justify-between px-3 py-2 text-xs" style={{ borderBottom: `1px solid ${C.line}` }}>
                <span style={{ color: C.ink }}>{expenseInfo(e.category).label}{e.vendor ? ` · ${e.vendor}` : ""}{e.note ? ` · ${e.note}` : ""}</span>
                <b style={{ color: C.green }}>{fmtCurrency(e.amount, e.currency)}</b>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2.5" style={{ background: C.bgAlt }}>
              <span className="text-xs font-semibold" style={{ color: C.ink }}>សរុប</span>
              <b className="text-sm" style={{ color: C.green }}>{fmtCurrency(selectedTotalKhr, "KHR")}</b>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setConfirmSettle(false)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{ background: C.bgAlt, color: C.ink }}>បោះបង់</button>
            <PrimaryButton full onClick={settleSelected} disabled={busy}>{busy ? "កំពុងកត់ត្រា..." : "បញ្ជាក់ទូទាត់"}</PrimaryButton>
          </div>
        </SheetModal>
      )}
    </div>
  );
}
