import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, History, Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuditLogs } from "@/hooks/useAudit";
import { AUDIT_TABLE_LABELS, AUDIT_ACTION_LABELS, type AuditAction } from "@/api/audit";
import { C, tint } from "@/lib/tokens";
import { EmptyState, FilterChip } from "@/components/ui/primitives";

const ACTION_STYLE: Record<AuditAction, { color: string; icon: typeof Plus }> = {
  INSERT: { color: "#3D6B4F", icon: Plus },
  UPDATE: { color: "#B9832C", icon: Pencil },
  DELETE: { color: "#B54B3A", icon: Trash2 },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ទើបតែឥឡូវ";
  if (mins < 60) return `${mins} នាទីមុន`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ម៉ោងមុន`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} ថ្ងៃមុន`;
  return new Date(iso).toLocaleDateString();
}

export function AuditLogPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const logsQ = useAuditLogs(!!profile?.farmId);
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");
  const [tableFilter, setTableFilter] = useState<string>("all");

  const logs = logsQ.data ?? [];
  const tables = useMemo(() => Array.from(new Set(logs.map((l) => l.tableName))), [logs]);
  const filtered = logs.filter(
    (l) => (actionFilter === "all" || l.action === actionFilter) && (tableFilter === "all" || l.tableName === tableFilter)
  );

  return (
    <div className="pt-1 pb-4">
      <button onClick={() => navigate("/settings")} className="flex items-center gap-1 text-xs font-medium mb-3" style={{ color: C.greenMid }}>
        <ArrowLeft size={15} /> ត្រឡប់ទៅកំណត់
      </button>

      <div className="flex gap-1.5 overflow-x-auto mb-2 pb-0.5">
        <FilterChip active={actionFilter === "all"} onClick={() => setActionFilter("all")} label={`ទាំងអស់ (${logs.length})`} />
        {(["INSERT", "UPDATE", "DELETE"] as AuditAction[]).map((a) => (
          <FilterChip key={a} active={actionFilter === a} onClick={() => setActionFilter(a)} label={AUDIT_ACTION_LABELS[a]} color={ACTION_STYLE[a].color} />
        ))}
      </div>
      {tables.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto mb-3 pb-0.5">
          <FilterChip active={tableFilter === "all"} onClick={() => setTableFilter("all")} label="គ្រប់ប្រភេទ" />
          {tables.map((t) => (
            <FilterChip key={t} active={tableFilter === t} onClick={() => setTableFilter(t)} label={AUDIT_TABLE_LABELS[t] ?? t} />
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={History} title="មិនទាន់មានប្រវត្តិ" hint="រាល់ការបន្ថែម កែសម្រួល និងលុប នឹងកត់ត្រានៅទីនេះដោយស្វ័យប្រវត្តិ" />
      ) : (
        <div className="space-y-2">
          {filtered.map((l) => {
            const st = ACTION_STYLE[l.action];
            const Icon = st.icon;
            return (
              <div key={l.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: tint(st.color, 12) }}>
                  <Icon size={14} color={st.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: C.ink }}>
                    {AUDIT_ACTION_LABELS[l.action]} {AUDIT_TABLE_LABELS[l.tableName] ?? l.tableName}
                    {l.summary ? ` · ${l.summary}` : ""}
                  </div>
                  <div className="text-[10.5px]" style={{ color: C.inkSoft }}>
                    {l.actorName ?? "មិនស្គាល់"} · {relativeTime(l.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
