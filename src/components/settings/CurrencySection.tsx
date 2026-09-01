import { useState } from "react";
import { useUpdateFarmSettings } from "@/hooks/useFarmSettings";
import { C } from "@/lib/tokens";
import { Field, PrimaryButton, inputCls, inputStyle } from "@/components/ui/primitives";
import type { FarmSettings } from "@/types/domain";

export function CurrencySection({ farm }: { farm: FarmSettings }) {
  const updateFarmM = useUpdateFarmSettings();
  const [rate, setRate] = useState(farm.exchangeRate.toString());
  const [cycleDay, setCycleDay] = useState(farm.payrollCycleStartDay.toString());

  return (
    <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="text-[11px] mb-3" style={{ color: C.inkSoft }}>របាយការណ៍ទាំងអស់គិតជាប្រាក់រៀល (៛) ជាគោល</div>
      <Field label="អត្រាប្តូរប្រាក់ ($1 = ៛?)">
        <input type="number" min="1" step="1" value={rate} onChange={(e) => setRate(e.target.value)} className={inputCls} style={inputStyle} placeholder="4100" />
      </Field>
      <Field label="ថ្ងៃចាប់ផ្តើមខួបប្រាក់ឈ្នួល (1–28)">
        <input type="number" min="1" max="28" step="1" value={cycleDay} onChange={(e) => setCycleDay(e.target.value)} className={inputCls} style={inputStyle} placeholder="1" />
        <div className="text-[10.5px] mt-1" style={{ color: C.inkSoft }}>ឧ. ដាក់ 15 → ខួបគឺ ១៥ ដល់ ១៤ ខែបន្ទាប់។ ដាក់ 1 → ដើមខែដល់ចុងខែ</div>
      </Field>
      <PrimaryButton onClick={() => updateFarmM.mutate({ exchangeRate: Number(rate) || 4100, payrollCycleStartDay: Math.min(Math.max(Number(cycleDay) || 1, 1), 28) })}>រក្សាទុក</PrimaryButton>
    </div>
  );
}
