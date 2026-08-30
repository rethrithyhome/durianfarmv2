import { useId, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { C } from "@/lib/tokens";
import { Field } from "./primitives";
import { compressImageFile } from "@/lib/image";
import { uploadPhoto } from "@/api";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  maxDim?: number;
  quality?: number;
  folder?: string;
}

export function PhotoPicker({ value, onChange, label = "រូបភាព", maxDim = 640, quality = 0.6, folder = "misc" }: Props) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true); setError("");
    try {
      const compressed = await compressImageFile(file, maxDim, quality);
      const url = await uploadPhoto(compressed, folder);
      onChange(url);
    } catch (err) {
      console.error(err);
      setError("ផ្ទុករូបភាពមិនបានជោគជ័យ សូមព្យាយាមម្តងទៀត");
    } finally { setBusy(false); }
  };

  return (
    <Field label={label}>
      {value ? (
        <div className="relative w-full h-36 rounded-xl overflow-hidden">
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <button onClick={() => onChange(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}><X size={14} color="#fff" /></button>
          <label htmlFor={inputId} className="absolute bottom-2 right-2 rounded-full px-2.5 py-1 text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer" style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}><ImagePlus size={12} /> ប្តូរ</label>
        </div>
      ) : (
        <label htmlFor={inputId} className="w-full h-28 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer" style={{ background: C.bgAlt, border: `1.5px dashed ${C.line}` }}>
          <ImagePlus size={20} color={C.goldDeep} />
          <span className="text-[11px] font-medium" style={{ color: C.inkSoft }}>{busy ? "កំពុងផ្ទុករូបភាព..." : "ចុចដើម្បីបន្ថែមរូបភាព"}</span>
        </label>
      )}
      <input id={inputId} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={busy} />
      {error && <div className="text-[10.5px] mt-1.5" style={{ color: C.red }}>{error}</div>}
    </Field>
  );
}
