import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ScanLine, Plus, TreePine, MapPin, ChevronRight, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTrees, useCreateTree } from "@/hooks/useTrees";
import { can } from "@/lib/permissions";
import { HEALTH_LEVELS, healthInfo } from "@/lib/constants";
import { C } from "@/lib/tokens";
import { Badge, EmptyState, FilterChip } from "@/components/ui/primitives";
import { SkeletonList } from "@/components/ui/Skeleton";
import { DurianMark } from "@/components/ui/DurianMark";
import { SortMenu } from "@/components/ui/SortMenu";
import { TreeForm } from "@/components/trees/TreeForm";
import { ScanQRModal } from "@/components/trees/ScanQRModal";
import type { Role, Tree } from "@/types/domain";

type SortKey = "recent" | "code" | "plot" | "health";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "ថ្មីៗ" }, { key: "code", label: "លេខកូដ" }, { key: "plot", label: "ចម្រៀក" }, { key: "health", label: "សុខភាព" },
];
const HEALTH_ORDER: Record<Tree["health"], number> = { sick: 0, needs_care: 1, normal: 2, excellent: 3 };

export function TreesPage({ role, scopedPlots }: { role: Role; scopedPlots: string[] }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const enabled = !!profile?.farmId;
  const treesQ = useTrees(enabled);
  const createM = useCreateTree();

  const [q, setQ] = useState("");
  const [healthFilter, setHealthFilter] = useState<Tree["health"] | "all">("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [addOpen, setAddOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const trees = treesQ.data ?? [];
  const filtered = useMemo(() => {
    let list = trees.filter((t) => {
      const matchQ = !q || t.code.toLowerCase().includes(q.toLowerCase()) || (t.plot ?? "").toLowerCase().includes(q.toLowerCase()) || (t.variety ?? "").toLowerCase().includes(q.toLowerCase());
      const matchH = healthFilter === "all" || t.health === healthFilter;
      return matchQ && matchH;
    });
    list = [...list];
    if (sort === "code") list.sort((a, b) => a.code.localeCompare(b.code));
    else if (sort === "plot") list.sort((a, b) => (a.plot ?? "").localeCompare(b.plot ?? ""));
    else if (sort === "health") list.sort((a, b) => HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health]);
    return list;
  }, [trees, q, healthFilter, sort]);

  const allowedPlots = can(role, "addTree") && scopedPlots.length > 0 ? scopedPlots : null;

  return (
    <div className="pt-1 pb-4">
      {can(role, "viewReports") && (
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <button onClick={() => navigate("/tree-report")} className="flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.green }}>
            <FileText size={15} /> តារាង (ព្រីន/CSV)
          </button>
          <button onClick={() => navigate("/tree-map")} className="flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-semibold" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.green }}>
            <MapPin size={15} /> ផែនទីចម្ការ
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <Search size={15} color={C.inkSoft} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ស្វែងរកលេខដើម ចម្រៀក ឬពូជ..." className="flex-1 bg-transparent text-xs outline-none" style={{ color: C.ink }} />
        </div>
        <button onClick={() => setScanOpen(true)} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.bgAlt, border: `1px solid ${C.line}` }} title="ស្កេន QR"><ScanLine size={16} color={C.green} /></button>
        {can(role, "addTree") && <button onClick={() => setAddOpen(true)} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.green }}><Plus size={18} color="#fff" /></button>}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1.5 overflow-x-auto flex-1 pb-0.5">
          <FilterChip active={healthFilter === "all"} onClick={() => setHealthFilter("all")} label={`ទាំងអស់ (${trees.length})`} />
          {HEALTH_LEVELS.map((h) => <FilterChip key={h.key} active={healthFilter === h.key} onClick={() => setHealthFilter(h.key)} label={h.label} color={h.color} />)}
        </div>
        <SortMenu value={sort} options={SORT_OPTIONS} onChange={setSort} />
      </div>

      {treesQ.isPending ? (
        <SkeletonList count={5} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={TreePine} title="មិនទាន់មានដើមទុរេន" hint="ចុចប៊ូតុង + ដើម្បីបន្ថែមដើមទុរេន" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filtered.map((t) => (
            <button key={t.id} onClick={() => navigate(`/trees/${t.id}`)} className="w-full flex items-center gap-3 rounded-2xl p-3 text-left" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ background: C.bgAlt }}>{t.photo ? <img src={t.photo} className="w-full h-full object-cover" alt="" /> : <DurianMark size={24} />}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: C.ink }}>{t.code}</div>
                <div className="flex items-center gap-1.5 text-[11px] mt-0.5" style={{ color: C.inkSoft }}><MapPin size={11} /> {t.plot || "គ្មានចម្រៀក"} {t.variety ? `· ${t.variety}` : ""}</div>
              </div>
              <Badge label={healthInfo(t.health).label} color={healthInfo(t.health).color} />
              <ChevronRight size={15} color={C.inkSoft} />
            </button>
          ))}
        </div>
      )}

      {addOpen && (
        <TreeForm
          allowedPlots={allowedPlots}
          existingTrees={trees}
          onClose={() => setAddOpen(false)}
          onSubmit={async (t) => { await createM.mutateAsync(t); }}
        />
      )}
      {scanOpen && (
        <ScanQRModal trees={trees} onClose={() => setScanOpen(false)} onFound={(id) => { setScanOpen(false); navigate(`/trees/${id}?scanned=1`); }} />
      )}
    </div>
  );
}
