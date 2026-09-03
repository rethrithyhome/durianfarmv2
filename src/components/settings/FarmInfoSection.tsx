import { useId, useState } from "react";
import { ImagePlus } from "lucide-react";
import * as api from "@/api";
import { useUpdateFarmSettings } from "@/hooks/useFarmSettings";
import { useToast } from "@/components/ui/Toast";
import { compressImageFile } from "@/lib/image";
import { can } from "@/lib/permissions";
import { C, tint } from "@/lib/tokens";
import { Field, PrimaryButton, inputCls, inputStyle } from "@/components/ui/primitives";
import { DurianMark } from "@/components/ui/DurianMark";
import type { FarmSettings, Role } from "@/types/domain";
import { errorMessage } from "@/lib/errors";

export function FarmInfoSection({ role, farm }: { role: Role; farm: FarmSettings }) {
  const toast = useToast();
  const updateFarmM = useUpdateFarmSettings();
  const [name, setName] = useState(farm.farmName);
  const [ownerPin, setOwnerPin] = useState(farm.ownerPin);
  const [logoBusy, setLogoBusy] = useState(false);
  const logoInputId = useId();
  const editable = can(role, "settings");

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setLogoBusy(true);
    try {
      const compressed = await compressImageFile(file, 300, 0.75);
      const url = await api.uploadPhoto(compressed, "logos");
      await updateFarmM.mutateAsync({ logo: url });
    } catch (err) {
      toast.error("ផ្ទុក Logo មិនបានជោគជ័យ៖ " + (errorMessage(err)));
    } finally { setLogoBusy(false); }
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      {editable && (
        <div className="flex items-center gap-3 mb-4">
          {farm.logo
            ? <img src={farm.logo} alt="logo" className="w-14 h-14 rounded-2xl object-cover" style={{ border: `1px solid ${C.line}` }} />
            : <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: C.bgAlt }}><DurianMark size={44} /></div>}
          <div className="flex-1">
            <div className="flex gap-2">
              <label htmlFor={logoInputId} className="rounded-xl px-3 py-1.5 text-[11px] font-semibold cursor-pointer flex items-center gap-1" style={{ background: C.bgAlt, color: C.green }}>
                <ImagePlus size={12} /> {logoBusy ? "កំពុងផ្ទុក..." : "ប្តូរ Logo"}
              </label>
              {farm.logo && <button onClick={() => updateFarmM.mutate({ logo: null })} className="rounded-xl px-3 py-1.5 text-[11px] font-semibold" style={{ background: tint(C.red, 8), color: C.red }}>ប្រើលំនាំដើម</button>}
            </div>
            <input id={logoInputId} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} disabled={logoBusy} />
          </div>
        </div>
      )}
      <Field label="ឈ្មោះចម្ការ">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={inputStyle} disabled={!editable} />
      </Field>
      {editable && (
        <Field label="PIN ម្ចាស់ចម្ការ (ស្រេចចិត្ត)">
          <input type="password" inputMode="numeric" maxLength={6} value={ownerPin} onChange={(e) => setOwnerPin(e.target.value.replace(/\D/g, ""))} placeholder="ទុកទទេប្រសិនបើមិនត្រូវការ" className={inputCls} style={inputStyle} />
        </Field>
      )}
      {editable && <PrimaryButton onClick={() => updateFarmM.mutate({ farmName: name, ownerPin: ownerPin.trim() })}>រក្សាទុក</PrimaryButton>}
    </div>
  );
}
