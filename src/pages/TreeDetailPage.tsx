import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, QrCode, Pencil, Trash2, Flower2, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTrees, useUpdateTree, useDeleteTree } from "@/hooks/useTrees";
import { useCareLogs, useCreateCareLog, useDeleteCareLog, useCycles, useCreateCycle, useDeleteCycle, useEvents, useCreateEvent, useDeleteEvent } from "@/hooks/useYield";
import { useWorkers } from "@/hooks/useWorkers";
import { useLocations, useCreateLocation } from "@/hooks/useSales";
import { can, SCOPED_ROLES } from "@/lib/permissions";
import { healthInfo, careInfo, YIELD_EVENT_TYPES } from "@/lib/constants";
import { qrImageUrl, treeDeepLink } from "@/lib/qr";
import { fmtDate } from "@/lib/format";
import { C, tint } from "@/lib/tokens";
import { Badge, PrimaryButton } from "@/components/ui/primitives";
import { SheetModal } from "@/components/ui/SheetModal";
import { DurianMark } from "@/components/ui/DurianMark";
import { TreeForm } from "@/components/trees/TreeForm";
import { CareForm } from "@/components/trees/CareForm";
import { CycleForm } from "@/components/trees/CycleForm";
import { EventForm } from "@/components/trees/EventForm";
import type { Role } from "@/types/domain";

export function TreeDetailPage({ role, scopedPlots }: { role: Role; scopedPlots: string[] }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const enabled = !!profile?.farmId;

  const treesQ = useTrees(enabled);
  const careQ = useCareLogs(enabled);
  const cyclesQ = useCycles(enabled);
  const eventsQ = useEvents(enabled);
  const workersQ = useWorkers(enabled);
  const locationsQ = useLocations(enabled);

  const updateTreeM = useUpdateTree();
  const deleteTreeM = useDeleteTree();
  const createCareM = useCreateCareLog();
  const deleteCareM = useDeleteCareLog();
  const createCycleM = useCreateCycle();
  const deleteCycleM = useDeleteCycle();
  const createEventM = useCreateEvent();
  const deleteEventM = useDeleteEvent();
  const createLocationM = useCreateLocation();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [careOpen, setCareOpen] = useState(false);
  const [cycleOpen, setCycleOpen] = useState(false);
  const [eventCycleId, setEventCycleId] = useState<string | null>(null);

  const tree = (treesQ.data ?? []).find((t) => t.id === id);
  if (!tree) {
    return (
      <div className="pt-10 text-center text-sm" style={{ color: C.inkSoft }}>
        <button onClick={() => navigate("/trees")} className="flex items-center gap-1 text-xs font-medium mb-4 mx-auto" style={{ color: C.greenMid }}><ArrowLeft size={15} /> ត្រឡប់ក្រោយ</button>
        មិនឃើញដើមទុរេននេះទេ
      </div>
    );
  }

  const workers = workersQ.data ?? [];
  const locations = locationsQ.data ?? [];
  const careLogs = (careQ.data ?? []).filter((c) => c.treeId === tree.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const cycles = (cyclesQ.data ?? []).filter((c) => c.treeId === tree.id).sort((a, b) => b.year - a.year);
  const events = (eventsQ.data ?? []).filter((e) => e.treeId === tree.id);

  const inScope = !SCOPED_ROLES.includes(role) || (tree.plot ? scopedPlots.includes(tree.plot) : false);
  const canManage = inScope && can(role, "editTree");
  const canAddCare = inScope && can(role, "addCare");
  const canAddCycle = inScope && can(role, "addYieldCycle");
  const canAddEvent = inScope && can(role, "addYieldEvent");

  const workerName = (wid?: string | null) => workers.find((w) => w.id === wid)?.name;
  const locationName = (lid?: string | null) => locations.find((l) => l.id === lid)?.name;
  const qrUrl = qrImageUrl(treeDeepLink(tree.id));

  return (
    <div className="pt-1 pb-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => navigate("/trees")} className="flex items-center gap-1 text-xs font-medium" style={{ color: C.greenMid }}><ArrowLeft size={15} /> ត្រឡប់ក្រោយ</button>
        <div className="flex items-center gap-2">
          <button onClick={() => setQrOpen(true)} className="p-1.5 rounded-lg" style={{ background: C.bgAlt }}><QrCode size={14} color={C.green} /></button>
          {canManage && (<>
            <button onClick={() => setEditOpen(true)} className="p-1.5 rounded-lg" style={{ background: C.bgAlt }}><Pencil size={14} color={C.ink} /></button>
            {can(role, "deleteTree") && <button onClick={() => setConfirmDel(true)} className="p-1.5 rounded-lg" style={{ background: tint(C.red, 10) }}><Trash2 size={14} color={C.red} /></button>}
          </>)}
        </div>
      </div>

      {!inScope && (
        <div className="flex items-center gap-2 rounded-xl p-3 mb-3" style={{ background: tint(C.goldDeep, 8), border: `1px solid ${tint(C.goldDeep, 27)}` }}>
          <Lock size={14} color={C.goldDeep} /><div className="text-[11px]" style={{ color: C.brown }}>ដើមនេះនៅក្រៅតំបន់ដែលអ្នកគ្រប់គ្រង — អ្នកអាចមើលបានតែប៉ុណ្ណោះ</div>
        </div>
      )}

      <div className="rounded-2xl p-4 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        {tree.photo && <img src={tree.photo} alt={tree.code} className="w-full h-40 object-cover rounded-xl mb-3" />}
        <div className="flex items-center gap-3">
          {!tree.photo && <DurianMark size={44} />}
          <div className="flex-1"><div className="text-base font-bold" style={{ color: C.green }}>{tree.code}</div><div className="text-[11px]" style={{ color: C.inkSoft }}>{tree.variety || "មិនបញ្ជាក់ពូជ"}</div></div>
          <Badge label={healthInfo(tree.health).label} color={healthInfo(tree.health).color} size="md" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 mt-4 text-xs">
          <div><div className="text-[10.5px]" style={{ color: C.inkSoft }}>ចម្រៀក/តំបន់</div><div className="font-medium mt-0.5" style={{ color: C.ink }}>{tree.plot || "—"}</div></div>
          <div><div className="text-[10.5px]" style={{ color: C.inkSoft }}>ថ្ងៃដាំ</div><div className="font-medium mt-0.5" style={{ color: C.ink }}>{fmtDate(tree.plantedDate)}</div></div>
        </div>
        {tree.notes && <div className="mt-3 text-xs rounded-xl p-2.5" style={{ background: C.bgAlt, color: C.ink }}>{tree.notes}</div>}
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold" style={{ color: C.green }}>ទិន្នផលប្រចាំឆ្នាំ</div>
        {canAddCycle && <button onClick={() => setCycleOpen(true)} className="text-xs font-semibold" style={{ color: C.goldDeep }}>+ ចាប់ផ្តើមឆ្នាំថ្មី</button>}
      </div>
      {cycles.length === 0 ? (
        <div className="text-xs mb-4" style={{ color: C.inkSoft }}>មិនទាន់មានទិន្នផលឆ្នាំណាទេ — ចាប់ផ្តើមកត់ត្រានៅពេលចេញផ្កា/ផ្លែតូច</div>
      ) : (
        <div className="space-y-3 mb-4">
          {cycles.map((cy) => {
            const cyEvents = events.filter((e) => e.cycleId === cy.id);
            const sums = cyEvents.reduce<Record<string, number>>((a, e) => { a[e.type] = (a[e.type] || 0) + e.quantity; return a; }, {});
            const used = (sums.fallen || 0) + (sums.rotten || 0) + (sums.harvested || 0) + (sums.ripeFallen || 0);
            const remaining = Math.max(0, cy.initialCount - used);
            const totalWeight = cyEvents.filter((e) => e.type === "harvested").reduce((s, e) => s + (e.weightKg || 0), 0);
            const harvestEvents = cyEvents.filter((e) => e.type === "harvested");
            return (
              <div key={cy.id} className="rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div><div className="text-sm font-bold" style={{ color: C.green }}>ឆ្នាំ {cy.year}</div>{cy.flowerDate && <div className="flex items-center gap-1 text-[10.5px]" style={{ color: C.goldDeep }}><Flower2 size={11} /> ចេញផ្កា៖ {fmtDate(cy.flowerDate)}</div>}</div>
                  <div className="flex items-center gap-2">
                    {canAddEvent && <button onClick={() => setEventCycleId(cy.id)} className="text-[11px] font-semibold" style={{ color: C.greenMid }}>+ កត់ត្រា</button>}
                    {canManage && <button onClick={() => deleteCycleM.mutate(cy.id)}><Trash2 size={13} color={C.red} /></button>}
                  </div>
                </div>
                <div className="text-[11px] mb-2" style={{ color: C.inkSoft }}>ចំនួនផ្លែតូចដំបូង៖ <b style={{ color: C.ink }}>{cy.initialCount}</b> · នៅសល់លើដើម៖ <b style={{ color: C.ink }}>{remaining}</b></div>
                <div className="grid grid-cols-4 gap-1.5 text-center mb-2">
                  {YIELD_EVENT_TYPES.map((y) => (
                    <div key={y.key} className="rounded-lg py-1.5" style={{ background: tint(y.color, 10) }}><div className="text-xs font-bold" style={{ color: y.color }}>{sums[y.key] || 0}</div><div className="text-[9px]" style={{ color: C.inkSoft }}>{y.label}</div></div>
                  ))}
                </div>
                {totalWeight > 0 && <div className="text-[11px]" style={{ color: C.inkSoft }}>ទម្ងន់សរុបប្រមូលផល៖ <b style={{ color: C.ink }}>{totalWeight} kg</b></div>}
                {harvestEvents.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {harvestEvents.map((e) => (
                      <div key={e.id} className="flex items-center justify-between text-[10.5px]" style={{ color: C.inkSoft }}>
                        <span>{fmtDate(e.date)} · {e.quantity} ផ្លែ · {e.weightKg || 0}kg{e.destination ? ` · ${locationName(e.destination) ?? e.destination}` : ""}{e.workerId ? ` · ${workerName(e.workerId)}` : ""}</span>
                        {canManage && <button onClick={() => deleteEventM.mutate(e.id)}><Trash2 size={11} color={C.red} /></button>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold" style={{ color: C.green }}>កំណត់ត្រាការថែទាំ</div>
        {canAddCare && <button onClick={() => setCareOpen(true)} className="text-xs font-semibold" style={{ color: C.goldDeep }}>+ ថ្មី</button>}
      </div>
      {careLogs.length === 0 ? (
        <div className="text-xs" style={{ color: C.inkSoft }}>មិនទាន់មានកំណត់ត្រាការថែទាំទេ</div>
      ) : (
        <div className="space-y-2">
          {careLogs.map((c) => {
            const ci = careInfo(c.type); const Icon = ci.icon;
            return (
              <div key={c.id} className="flex items-center gap-2.5 rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: tint(ci.color, 10) }}><Icon size={14} color={ci.color} /></div>
                <div className="flex-1 min-w-0"><div className="text-xs font-medium" style={{ color: C.ink }}>{ci.label}</div><div className="text-[10.5px]" style={{ color: C.inkSoft }}>{fmtDate(c.date)} {c.workerId ? `· ${workerName(c.workerId)}` : ""}{c.note ? ` · ${c.note}` : ""}</div></div>
                {canManage && <button onClick={() => deleteCareM.mutate(c.id)}><Trash2 size={13} color={C.red} /></button>}
              </div>
            );
          })}
        </div>
      )}

      {editOpen && (
        <TreeForm
          initial={tree}
          allowedPlots={SCOPED_ROLES.includes(role) ? scopedPlots : null}
          existingTrees={treesQ.data ?? []}
          onClose={() => setEditOpen(false)}
          onSubmit={async (t) => { await updateTreeM.mutateAsync({ ...tree, ...t } as never); }}
        />
      )}
      {confirmDel && (
        <SheetModal title="លុបដើមទុរេន?" onClose={() => setConfirmDel(false)}>
          <p className="text-xs mb-4" style={{ color: C.inkSoft }}>សកម្មភាពនេះនឹងលុបទិន្នន័យទិន្នផល និងកំណត់ត្រាថែទាំទាំងអស់របស់ដើមនេះផងដែរ។</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDel(false)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{ background: C.bgAlt, color: C.ink }}>បោះបង់</button>
            <PrimaryButton danger full onClick={() => { deleteTreeM.mutate(tree.id); navigate("/trees"); }}>លុបជាស្ថាពរ</PrimaryButton>
          </div>
        </SheetModal>
      )}
      {qrOpen && (
        <SheetModal title={`កូដ QR — ${tree.code}`} onClose={() => setQrOpen(false)}>
          <div className="flex flex-col items-center">
            <div className="rounded-2xl p-4" style={{ background: C.bgAlt }}><img src={qrUrl} alt={`QR ${tree.code}`} width={200} height={200} className="rounded-lg" /></div>
            <div className="text-sm font-bold mt-3" style={{ color: C.green }}>{tree.code}</div>
            <p className="text-[11px] text-center mt-3" style={{ color: C.inkSoft }}>បិទស្អិតកូដនេះលើដើមទុរេន — ស្កេនដោយកាមេរ៉ាធម្មតារបស់ទូរស័ព្ទ (មិនចាំបាច់បើក app នេះជាមុនទេ) នឹងបើកទំព័រនេះដោយផ្ទាល់។</p>
          </div>
        </SheetModal>
      )}
      {careOpen && (
        <CareForm treeId={tree.id} workers={workers} onClose={() => setCareOpen(false)} onSubmit={async (c) => { await createCareM.mutateAsync(c); }} />
      )}
      {cycleOpen && (
        <CycleForm treeId={tree.id} onClose={() => setCycleOpen(false)} onSubmit={async (cy) => { await createCycleM.mutateAsync(cy); }} />
      )}
      {eventCycleId && (
        <EventForm
          treeId={tree.id}
          cycleId={eventCycleId}
          workers={workers}
          locations={locations}
          onClose={() => setEventCycleId(null)}
          onSubmit={async (ev) => { await createEventM.mutateAsync(ev); }}
          onAddLocation={async (l) => createLocationM.mutateAsync(l)}
        />
      )}
    </div>
  );
}
