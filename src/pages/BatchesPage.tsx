import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Printer, ExternalLink, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFarmSettings } from "@/hooks/useFarmSettings";
import { useTrees } from "@/hooks/useTrees";
import { useEvents } from "@/hooks/useYield";
import { useBatches, useCreateBatch, useDeleteBatch } from "@/hooks/useBatches";
import { traceUrl } from "@/api/batches";
import { qrImageUrl } from "@/lib/qr";
import { fmtDate } from "@/lib/format";
import { errorMessage } from "@/lib/errors";
import { C } from "@/lib/tokens";
import { EmptyState } from "@/components/ui/primitives";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { BatchForm } from "@/components/sales/BatchForm";

export function BatchesPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { profile } = useAuth();
  const enabled = !!profile?.farmId;
  const farmQ = useFarmSettings(enabled);
  const treesQ = useTrees(enabled);
  const eventsQ = useEvents(enabled);
  const batchesQ = useBatches(enabled);
  const createM = useCreateBatch();
  const deleteM = useDeleteBatch();

  const [formOpen, setFormOpen] = useState(false);
  const [printBatch, setPrintBatch] = useState<{ code: string } | null>(null);

  const trees = treesQ.data ?? [];
  const harvestedEvents = (eventsQ.data ?? []).filter((e) => e.type === "harvested");
  const batches = batchesQ.data ?? [];

  return (
    <div className="pt-1 pb-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-medium mb-3" style={{ color: C.greenMid }}>
        <ArrowLeft size={15} /> ត្រឡប់ក្រោយ
      </button>

      <div className="rounded-xl p-3 text-[11px] mb-4" style={{ background: `color-mix(in srgb, ${C.blue} 10%, transparent)`, color: C.brown }}>
        តាមដានប្រភពដើម៖ បង្កើតបាច់ប្រមូលផល → បោះពុម្ពស្លាក QR → បិទលើកញ្ចប់ — អ្នកទិញស្កេនមើលប្រភពដើមបានដោយមិនចាំបាច់ login
      </div>

      <button onClick={() => setFormOpen(true)} className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 mb-4 text-sm font-semibold" style={{ background: C.green, color: "#fff" }}>
        <Plus size={16} /> បង្កើតបាច់ថ្មី
      </button>

      {batches.length === 0 ? (
        <EmptyState icon={Package} title="មិនទាន់មានបាច់ណាមួយទេ" hint="បង្កើតបាច់ដំបូងពីកំណត់ត្រាប្រមូលផលដែលមាន" />
      ) : (
        <div className="space-y-2">
          {batches.map((b) => (
            <div key={b.id} className="rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-bold" style={{ color: C.green }}>{b.batchCode}</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPrintBatch({ code: b.batchCode })}><Printer size={14} color={C.inkSoft} /></button>
                  <a href={traceUrl(b.batchCode)} target="_blank" rel="noreferrer"><ExternalLink size={14} color={C.inkSoft} /></a>
                  <button onClick={async () => { if (await confirm({ title: "លុបបាច់នេះ?", message: "QR ដែលបោះពុម្ពរួចនឹងលែងប្រើការទេ។", confirmLabel: "លុប", danger: true })) deleteM.mutate(b.id); }}>
                    <Trash2 size={14} color={C.red} />
                  </button>
                </div>
              </div>
              <div className="text-[11px]" style={{ color: C.inkSoft }}>
                វេចខ្ចប់ {fmtDate(b.packedDate)}{b.destination ? ` · ${b.destination}` : ""} · {b.eventIds.length} កំណត់ត្រា
              </div>
              {b.notes && <div className="text-[11px] mt-1" style={{ color: C.ink }}>{b.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <BatchForm
          events={harvestedEvents}
          trees={trees}
          farmName={farmQ.data?.farmName ?? "Farm"}
          onClose={() => setFormOpen(false)}
          onSubmit={async (input) => {
            try { await createM.mutateAsync(input); }
            catch (err) { window.alert("បង្កើតបាច់មិនបានជោគជ័យ៖ " + errorMessage(err)); throw err; }
          }}
        />
      )}

      {printBatch && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setPrintBatch(null)}>
          <div className="bg-white rounded-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <img src={qrImageUrl(traceUrl(printBatch.code), 260)} alt={printBatch.code} className="mx-auto rounded-lg" />
            <div className="text-sm font-bold mt-3" style={{ color: C.green }}>{printBatch.code}</div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setPrintBatch(null)} className="flex-1 rounded-xl py-2 text-xs font-semibold" style={{ background: C.bgAlt, color: C.ink }}>បិទ</button>
              <button onClick={() => window.print()} className="flex-1 rounded-xl py-2 text-xs font-semibold" style={{ background: C.green, color: "#fff" }}>បោះពុម្ព</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
