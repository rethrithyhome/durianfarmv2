import { useState } from "react";
import type { Tree } from "@/types/domain";
import { SheetModal } from "@/components/ui/SheetModal";
import { Field, PrimaryButton, inputCls, inputStyle } from "@/components/ui/primitives";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { HEALTH_LEVELS } from "@/lib/constants";
import { C } from "@/lib/tokens";
import { errorMessage } from "@/lib/errors";
import { getCurrentLocation } from "@/lib/geo";
import { MapPin, Check } from "lucide-react";
import { tint } from "@/lib/tokens";

interface Props {
  initial?: Tree;
  allowedPlots: string[] | null;
  existingTrees: Tree[];
  onClose: () => void;
  onSubmit: (t: Partial<Tree>) => Promise<void>;
}

export function TreeForm({ initial, allowedPlots, existingTrees, onClose, onSubmit }: Props) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [plot, setPlot] = useState(initial?.plot ?? (allowedPlots?.[0] ?? ""));
  const [variety, setVariety] = useState(initial?.variety ?? "");
  const [plantedDate, setPlantedDate] = useState(initial?.plantedDate ?? "");
  const [health, setHealth] = useState<Tree["health"]>(initial?.health ?? "normal");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [photo, setPhoto] = useState<string | null>(initial?.photo ?? null);
  const [lat, setLat] = useState<number | null>(initial?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initial?.lng ?? null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [busy, setBusy] = useState(false);

  const isDuplicate = (val: string) => existingTrees.some((t) => t.id !== initial?.id && t.code.trim().toLowerCase() === val.trim().toLowerCase());

  const submit = async () => {
    const trimmed = code.trim();
    if (!trimmed) { setCodeError("សូមបញ្ចូលលេខកូដដើម"); return; }
    if (isDuplicate(trimmed)) { setCodeError("លេខកូដនេះមានស្រាប់ហើយលើដើមផ្សេង — សូមប្តូរលេខកូដថ្មី"); return; }
    setBusy(true);
    try {
      await onSubmit({ ...(initial ?? {}), code: trimmed, plot: plot.trim(), variety: variety.trim(), plantedDate, health, notes: notes.trim(), photo, lat, lng });
      onClose();
    } catch (err) {
      const msg = errorMessage(err);
      setCodeError((err as { code?: string })?.code === "23505" ? "លេខកូដដើមនេះមានស្រាប់ហើយ សូមប្តូរលេខកូដថ្មី" : msg);
    } finally { setBusy(false); }
  };

  return (
    <SheetModal title={initial ? "កែសម្រួលដើមទុរេន" : "បន្ថែមដើមទុរេនថ្មី"} onClose={onClose}>
      <PhotoPicker value={photo} onChange={setPhoto} label="រូបភាពដើមទុរេន" folder="trees" />
      <Field label="លេខកូដដើម *">
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value); setCodeError(""); }}
          onBlur={() => setCodeError(code.trim() && isDuplicate(code.trim()) ? "លេខកូដនេះមានស្រាប់ហើយលើដើមផ្សេង — សូមប្តូរលេខកូដថ្មី" : "")}
          placeholder="ឧ. ដើមលេខ A-12"
          className={inputCls}
          style={inputStyle}
        />
        {codeError && <div className="text-[11px] mt-1" style={{ color: C.red }}>{codeError}</div>}
      </Field>
      <Field label="ចម្រៀក/តំបន់">
        {allowedPlots && allowedPlots.length > 0 ? (
          <select value={plot} onChange={(e) => setPlot(e.target.value)} className={inputCls} style={inputStyle}>{allowedPlots.map((p) => <option key={p} value={p}>{p}</option>)}</select>
        ) : (<input value={plot} onChange={(e) => setPlot(e.target.value)} placeholder="ឧ. ចម្រៀក A" className={inputCls} style={inputStyle} />)}
      </Field>
      <Field label="ពូជ"><input value={variety} onChange={(e) => setVariety(e.target.value)} placeholder="ឧ. មូសាំងគីង" className={inputCls} style={inputStyle} /></Field>
      <Field label="ថ្ងៃខែឆ្នាំដាំ"><input type="date" value={plantedDate ?? ""} onChange={(e) => setPlantedDate(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <Field label="សុខភាពដើម">
        <div className="grid grid-cols-2 gap-2">
          {HEALTH_LEVELS.map((h) => (
            <button key={h.key} onClick={() => setHealth(h.key)} className="rounded-xl px-3 py-2 text-xs font-medium text-left" style={{ background: health === h.key ? `color-mix(in srgb, ${h.color} 12%, transparent)` : C.bgAlt, border: `1.5px solid ${health === h.key ? h.color : "transparent"}`, color: health === h.key ? h.color : C.ink }}>{h.label}</button>
          ))}
        </div>
      </Field>
      <Field label="ទីតាំង GPS (ស្រេចចិត្ត)">
        {lat != null && lng != null ? (
          <div className="flex items-center gap-2.5 rounded-xl p-3" style={{ background: tint(C.greenMid, 10), border: `1px solid ${C.line}` }}>
            <Check size={16} color={C.greenMid} />
            <div className="flex-1 text-[11px]" style={{ color: C.ink }}>ចាប់យករួច៖ {lat.toFixed(5)}, {lng.toFixed(5)}</div>
            <button onClick={() => { setLat(null); setLng(null); }} className="text-[11px] font-semibold" style={{ color: C.red }}>លុប</button>
          </div>
        ) : (
          <button
            onClick={async () => {
              setGpsBusy(true); setGpsError("");
              try { const p = await getCurrentLocation(); setLat(p.lat); setLng(p.lng); }
              catch (err) { setGpsError(errorMessage(err)); }
              finally { setGpsBusy(false); }
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold"
            style={{ background: C.bgAlt, color: C.green }}
          >
            <MapPin size={15} /> {gpsBusy ? "កំពុងចាប់យកទីតាំង..." : "ចាប់យកទីតាំង GPS (ត្រូវឈរនៅជិតដើម)"}
          </button>
        )}
        {gpsError && <div className="text-[11px] mt-1" style={{ color: C.red }}>{gpsError}</div>}
      </Field>
      <Field label="កំណត់ចំណាំ"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputCls} style={inputStyle} /></Field>
      <PrimaryButton full onClick={submit} disabled={busy}>{busy ? "កំពុងរក្សាទុក..." : initial ? "រក្សាទុកការផ្លាស់ប្តូរ" : "បន្ថែមដើមទុរេន"}</PrimaryButton>
    </SheetModal>
  );
}
