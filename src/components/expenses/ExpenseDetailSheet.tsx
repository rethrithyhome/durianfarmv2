import { Calendar, Store, FileText, ExternalLink, Pencil, Trash2, TreePine } from "lucide-react";
import { SheetModal } from "@/components/ui/SheetModal";
import { Badge } from "@/components/ui/primitives";
import { expenseInfo } from "@/lib/constants";
import { fmtCurrency } from "@/lib/currency";
import { fmtDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { C, tint } from "@/lib/tokens";
import type { Expense, Role, Tree } from "@/types/domain";

export function ExpenseDetailSheet({
  expense, role, trees, onClose, onEdit, onDelete,
}: {
  expense: Expense;
  role: Role;
  trees: Tree[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const tree = trees.find((t) => t.id === expense.treeId);

  return (
    <SheetModal title="ព័ត៌មានចំណាយ" onClose={onClose}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: tint(expense.paid ? C.red : C.goldDeep, 12) }}>
          <FileText size={20} color={expense.paid ? C.red : C.goldDeep} />
        </div>
        <div className="min-w-0">
          <div className="text-base font-bold" style={{ color: C.green }}>{expenseInfo(expense.category).label}</div>
          <div className="text-lg font-bold" style={{ color: expense.paid ? C.red : C.goldDeep }}>{fmtCurrency(expense.amount, expense.currency)}</div>
        </div>
        <div className="ml-auto">
          <Badge label={expense.paid ? "បង់រួច" : "ជំពាក់"} color={expense.paid ? C.greenMid : C.goldDeep} />
        </div>
      </div>

      <div className="space-y-2.5 mb-4">
        <div className="flex items-center gap-2.5 text-xs" style={{ color: C.ink }}><Calendar size={14} color={C.inkSoft} /> {fmtDate(expense.date)}</div>
        {expense.paid && expense.paidDate && (
          <div className="flex items-center gap-2.5 text-xs" style={{ color: C.ink }}><Calendar size={14} color={C.inkSoft} /> ទូទាត់ថ្ងៃ {fmtDate(expense.paidDate)}</div>
        )}
        {expense.vendor && (
          <div className="flex items-center gap-2.5 text-xs" style={{ color: C.ink }}><Store size={14} color={C.inkSoft} /> {expense.vendor}</div>
        )}
        {tree && (
          <div className="flex items-center gap-2.5 text-xs" style={{ color: C.ink }}><TreePine size={14} color={C.inkSoft} /> ភ្ជាប់ជាមួយដើម {tree.code}</div>
        )}
      </div>

      {expense.receiptUrl ? (
        <a href={expense.receiptUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl p-3 mb-4" style={{ background: tint(C.red, 8), border: `1px solid ${tint(C.red, 20)}` }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: tint(C.red, 15) }}><FileText size={17} color={C.red} /></div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: C.ink }}>{expense.receiptName ?? "វិក័យបត្រ/បង្កាន់ដៃ"}</div>
            <div className="text-[10.5px] flex items-center gap-1" style={{ color: C.greenMid }}><ExternalLink size={10} /> ចុចដើម្បីបើកមើល</div>
          </div>
        </a>
      ) : (
        <div className="text-[11px] mb-4" style={{ color: C.inkSoft }}>មិនទាន់មានវិក័យបត្រភ្ជាប់ទេ</div>
      )}

      {expense.note && (
        <div className="text-xs rounded-xl p-3 mb-4" style={{ background: C.bgAlt, color: C.ink }}>{expense.note}</div>
      )}

      {can(role, "editExpense") && (
        <div className="flex gap-2">
          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold" style={{ background: C.bgAlt, color: C.green }}>
            <Pencil size={13} /> កែសម្រួល
          </button>
          {can(role, "deleteExpense") && (
            <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold" style={{ background: tint(C.red, 10), color: C.red }}>
              <Trash2 size={13} /> លុប
            </button>
          )}
        </div>
      )}
    </SheetModal>
  );
}
