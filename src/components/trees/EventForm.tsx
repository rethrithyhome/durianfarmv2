import { useState } from "react";
import type { SaleLocation, Worker, YieldEvent, YieldEventType } from "@/types/domain";
import { SheetModal } from "@/components/ui/SheetModal";
import { Field, PrimaryButton, inputCls, inputStyle } from "@/components/ui/primitives";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { YIELD_EVENT_TYPES, yieldEventInfo } from "@/lib/constants";
import { todayISO } from "@/lib/format";
import { C } from "@/lib/tokens";

interface Props {
  treeId: string;
  cycleId: string;
  workers: Worker[];
  locations: SaleLocation[];
  onClose: () => void;
  onSubmit: (ev: Partial<YieldEvent>) => Promise<void>;
  onAddLocation: (l: Partial<SaleLocation>) => Promise<SaleLocation>;
}

export function EventForm({ treeId, cycleId, workers, locations, onClose, onSubmit, onAddLocation }: Props) {
  const [type, setType] = useState<YieldEventType>("harvested");
  const [quantity, setQuantity] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [date, setDate] = useState(todayISO());
  const [destination, setDestination] = useState("");
  const [newLoc, setNewLoc] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const info = yieldEventInfo(type);

  const submit = async () => {
    if (!quantity) return;
    setBusy(true);
    try {
      await onSubmit({
        treeId, cycleId, type, quantity: Number(quantity), date,
        weightKg: info.needsHarvestInfo ? Number(weightKg || 0) : null,
        destination: info.needsHarvestInfo ? (destination || null) : null,
        workerId: workerId || null,
        photo: info.needsHarvestInfo ? photo : null,
      });
      onClose();
    } finally { setBusy(false); }
  };

  const addQuickLocation = async () => {
    if (!newLoc.trim()) return;
    const loc = await onAddLocation({ name: newLoc.trim(), type: "retail" });
    setDestination(loc.id); setNewLoc("");
  };

  return (
    <SheetModal title="កត់ត្រាទិន្នផល" onClose={onClose}>
      <Field label="ប្រភេទ">
        <div className="grid grid-cols-2 gap-2">
          {YIELD_EVENT_TYPES.map((y) => (
            <button key={y.key} onClick={() => setType(y.key)} className="rounded-xl px-3 py-2 text-xs font-medium" style={{ background: type === y.key ? `color-mix(in srgb, ${y.color} 12%, transparent)` : C.bgAlt, border: `1.5px solid ${type === y.key ? y.color : "transparent"}`, color: type === y.key ? y.color : C.ink }}>{y.label}</button>
          ))}
        </div>
      </Field>
      <Field label="ចំនួនផ្លែ *"><input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <Field label="កាលបរិច្ឆេទ"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      {info.needsHarvestInfo && (
        <>
          <PhotoPicker value={photo} onChange={setPhoto} label="រូបភាពការប្រមូលផល" folder="harvests" />
          <Field label="ទម្ងន់ (kg)"><input type="number" min="0" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="ដឹកជញ្ជូនទៅទីតាំង">
            <select value={destination} onChange={(e) => setDestination(e.target.value)} className={inputCls} style={inputStyle}>
              <option value="">មិនទាន់កំណត់</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <div className="flex gap-2 mt-2">
              <input value={newLoc} onChange={(e) => setNewLoc(e.target.value)} placeholder="បន្ថែមទីតាំងថ្មី..." className="flex-1 rounded-lg px-2.5 py-1.5 text-[11px] outline-none" style={{ background: C.bgAlt, border: `1px solid ${C.line}`, color: C.ink }} />
              <button onClick={addQuickLocation} className="rounded-lg px-2.5 text-[11px] font-semibold" style={{ background: C.bgAlt, color: C.greenMid }}>+</button>
            </div>
          </Field>
          <Field label="កម្មករបេះផ្លែ">
            <select value={workerId} onChange={(e) => setWorkerId(e.target.value)} className={inputCls} style={inputStyle}>
              <option value="">មិនបញ្ជាក់</option>
              {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </Field>
        </>
      )}
      <PrimaryButton full onClick={submit} disabled={busy}>{busy ? "កំពុងរក្សាទុក..." : "រក្សាទុក"}</PrimaryButton>
    </SheetModal>
  );
}
