import { useState } from "react";
import type { Currency, DailyRateMode, Gender, WageType, Worker } from "@/types/domain";
import { SheetModal } from "@/components/ui/SheetModal";
import { Field, PrimaryButton, inputCls, inputStyle } from "@/components/ui/primitives";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DocumentPicker } from "@/components/ui/DocumentPicker";
import { C } from "@/lib/tokens";

interface Props {
  initial?: Worker;
  allowedPlots: string[] | null;
  exchangeRate: number;
  canSetWage: boolean;
  onClose: () => void;
  onSubmit: (w: Partial<Worker>) => Promise<void>;
}

export function WorkerForm({ initial, allowedPlots, exchangeRate, canSetWage, onClose, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [position, setPosition] = useState(initial?.position ?? "");
  const [specialty, setSpecialty] = useState(initial?.specialty ?? "");
  const [plot, setPlot] = useState(initial?.plot ?? (allowedPlots?.[0] ?? ""));
  const [status, setStatus] = useState<Worker["status"]>(initial?.status ?? "active");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [photo, setPhoto] = useState<string | null>(initial?.photo ?? null);
  const [gender, setGender] = useState<Gender | "">(initial?.gender ?? "");
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "");
  const [idDocUrl, setIdDocUrl] = useState<string | null>(initial?.idDocUrl ?? null);
  const [idDocName, setIdDocName] = useState<string | null>(initial?.idDocName ?? null);
  const [wageType, setWageType] = useState<WageType>(initial?.wageType ?? "hourly");
  const [wageRate, setWageRate] = useState(initial?.wageRate?.toString() ?? "");
  const [wageCurrency, setWageCurrency] = useState<Currency>(initial?.wageCurrency ?? "KHR");
  const [dailyRateMode, setDailyRateMode] = useState<DailyRateMode>(initial?.dailyRateMode ?? "hourly");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSubmit({
        ...(initial ?? {}), name: name.trim(), phone: phone.trim(), position: position.trim(),
        specialty: specialty.trim(), plot: plot.trim(), status, notes: notes.trim(), photo,
        gender: (gender || null) as Gender | null, birthDate: birthDate || null,
        idDocUrl, idDocName,
        wageType, wageRate: Number(wageRate) || 0, wageCurrency, dailyRateMode, startDate: startDate || null,
      });
      onClose();
    } finally { setBusy(false); }
  };

  return (
    <SheetModal title={initial ? "កែសម្រួលកម្មករ" : "បន្ថែមកម្មករថ្មី"} onClose={onClose}>
      <PhotoPicker value={photo} onChange={setPhoto} label="រូបថតកម្មករ" maxDim={480} quality={0.65} folder="workers" />
      <Field label="ឈ្មោះពេញ *"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <Field label="លេខទូរស័ព្ទ"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <Field label="ភេទ">
        <div className="grid grid-cols-3 gap-2">
          {([["male", "ប្រុស"], ["female", "ស្រី"], ["other", "ផ្សេងៗ"]] as const).map(([key, lbl]) => (
            <button key={key} onClick={() => setGender(gender === key ? "" : key)} className="rounded-xl px-3 py-2 text-xs font-medium"
              style={{ background: gender === key ? `color-mix(in srgb, ${C.greenMid} 12%, transparent)` : C.bgAlt, border: `1.5px solid ${gender === key ? C.greenMid : "transparent"}`, color: gender === key ? C.greenMid : C.ink }}>
              {lbl}
            </button>
          ))}
        </div>
      </Field>
      <Field label="ថ្ងៃខែឆ្នាំកំណើត"><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <Field label="តួនាទី/មុខតំណែង"><input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="ឧ. កម្មករបេះផ្លែ" className={inputCls} style={inputStyle} /></Field>
      <Field label="ជំនាញឯកទេស"><input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="ឧ. ព្យាបាលជំងឺដើម" className={inputCls} style={inputStyle} /></Field>

      {canSetWage && (
        <>
          <Field label="ប្រភេទប្រាក់ឈ្នួល">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setWageType("monthly")} className="rounded-xl px-3 py-2 text-xs font-medium" style={{ background: wageType === "monthly" ? `color-mix(in srgb, ${C.greenMid} 12%, transparent)` : C.bgAlt, border: `1.5px solid ${wageType === "monthly" ? C.greenMid : "transparent"}`, color: wageType === "monthly" ? C.greenMid : C.ink }}>ប្រាក់ខែ</button>
              <button onClick={() => setWageType("hourly")} className="rounded-xl px-3 py-2 text-xs font-medium" style={{ background: wageType === "hourly" ? `color-mix(in srgb, ${C.greenMid} 12%, transparent)` : C.bgAlt, border: `1.5px solid ${wageType === "hourly" ? C.greenMid : "transparent"}`, color: wageType === "hourly" ? C.greenMid : C.ink }}>ប្រាក់ថ្ងៃ (តាមម៉ោង)</button>
            </div>
          </Field>
          {wageType === "hourly" && (
            <Field label="របៀបគិតប្រាក់ថ្ងៃ">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setDailyRateMode("hourly")} className="rounded-xl px-3 py-2 text-xs font-medium"
                  style={{ background: dailyRateMode === "hourly" ? `color-mix(in srgb, ${C.blue} 14%, transparent)` : C.bgAlt, border: `1.5px solid ${dailyRateMode === "hourly" ? C.blue : "transparent"}`, color: dailyRateMode === "hourly" ? C.blue : C.ink }}>
                  តាមម៉ោង
                </button>
                <button onClick={() => setDailyRateMode("daily")} className="rounded-xl px-3 py-2 text-xs font-medium"
                  style={{ background: dailyRateMode === "daily" ? `color-mix(in srgb, ${C.blue} 14%, transparent)` : C.bgAlt, border: `1.5px solid ${dailyRateMode === "daily" ? C.blue : "transparent"}`, color: dailyRateMode === "daily" ? C.blue : C.ink }}>
                  ថេរក្នុងមួយថ្ងៃ
                </button>
              </div>
              <div className="text-[10.5px] mt-1" style={{ color: C.inkSoft }}>
                {dailyRateMode === "hourly"
                  ? "គិត៖ ម៉ោងធ្វើការ × អត្រា/ម៉ោង — ត្រូវកត់ត្រាម៉ោងរាល់ថ្ងៃ"
                  : "ឈ្នួលអាចខុសគ្នារាល់ថ្ងៃ — បញ្ចូលចំនួនទឹកប្រាក់ជាក់ស្តែងនៅកាតប្រាក់ឈ្នួល រាល់ថ្ងៃម្តង"}
              </div>
            </Field>
          )}
          {!(wageType === "hourly" && dailyRateMode === "daily") && (
          <CurrencyInput
            label={wageType === "monthly" ? "ប្រាក់ខែ" : "អត្រាក្នុងមួយម៉ោង"}
            amount={wageRate}
            currency={wageCurrency}
            exchangeRate={exchangeRate}
            onAmountChange={setWageRate}
            onCurrencyChange={setWageCurrency}
            placeholder={wageType === "monthly" ? "ឧ. 1200000" : "ឧ. 5000"}
          />
          )}
          {wageType === "hourly" && dailyRateMode === "daily" && (
            <Field label="រូបិយប័ណ្ណនៃឈ្នួល">
              <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
                {(["KHR", "USD"] as const).map((c) => (
                  <button key={c} onClick={() => setWageCurrency(c)} className="flex-1 py-2 text-xs font-semibold"
                    style={{ background: wageCurrency === c ? C.green : C.bgAlt, color: wageCurrency === c ? "#fff" : C.inkSoft }}>
                    {c === "KHR" ? "៛ រៀល" : "$ ដុល្លារ"}
                  </button>
                ))}
              </div>
            </Field>
          )}
          {wageType === "monthly" && (
            <Field label="ថ្ងៃចូលធ្វើការ">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} style={inputStyle} />
              <div className="text-[10.5px] mt-1" style={{ color: C.inkSoft }}>
                បើចូលធ្វើការពាក់កណ្តាលខួប ប្រាក់ខែនឹងគណនាតាមសមាមាត្រថ្ងៃដែលបានធ្វើ
              </div>
            </Field>
          )}
        </>
      )}

      <Field label="ចម្រៀក/តំបន់ទទួលបន្ទុក">
        {allowedPlots && allowedPlots.length > 0 ? (
          <select value={plot} onChange={(e) => setPlot(e.target.value)} className={inputCls} style={inputStyle}>{allowedPlots.map((p) => <option key={p} value={p}>{p}</option>)}</select>
        ) : (<input value={plot} onChange={(e) => setPlot(e.target.value)} className={inputCls} style={inputStyle} />)}
      </Field>
      <Field label="ស្ថានភាព">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setStatus("active")} className="rounded-xl px-3 py-2 text-xs font-medium" style={{ background: status === "active" ? `color-mix(in srgb, ${C.greenMid} 12%, transparent)` : C.bgAlt, color: status === "active" ? C.greenMid : C.ink }}>កំពុងធ្វើការ</button>
          <button onClick={() => setStatus("inactive")} className="rounded-xl px-3 py-2 text-xs font-medium" style={{ background: status === "inactive" ? `color-mix(in srgb, ${C.red} 12%, transparent)` : C.bgAlt, color: status === "inactive" ? C.red : C.ink }}>ឈប់ធ្វើការ</button>
        </div>
      </Field>
      <DocumentPicker
        url={idDocUrl}
        name={idDocName}
        onChange={(u, n) => { setIdDocUrl(u); setIdDocName(n); }}
        label="ឯកសារសម្គាល់ខ្លួន (អត្តសញ្ញាណប័ណ្ណ, កិច្ចសន្យា)"
        folder="worker-docs"
      />
      <Field label="កំណត់ចំណាំ"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} style={inputStyle} /></Field>
      <PrimaryButton full onClick={submit} disabled={busy}>{busy ? "កំពុងរក្សាទុក..." : initial ? "រក្សាទុកការផ្លាស់ប្តូរ" : "បន្ថែមកម្មករ"}</PrimaryButton>
    </SheetModal>
  );
}
