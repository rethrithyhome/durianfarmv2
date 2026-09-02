import { useId, useState } from "react";
import { FileText, Upload, X, ExternalLink } from "lucide-react";
import { C, tint } from "@/lib/tokens";
import { Field } from "./primitives";
import { uploadPhoto } from "@/api";

interface Props {
  url: string | null;
  name: string | null;
  onChange: (url: string | null, name: string | null) => void;
  label?: string;
  folder?: string;
}

const MAX_MB = 10;

/** Uploads a supporting document (ID card, contract) as PDF or image.
 * Unlike PhotoPicker this doesn't compress or re-encode — a scanned
 * document must stay exactly as provided to remain legible/valid. */
export function DocumentPicker({ url, name, onChange, label = "ឯកសារ", folder = "documents" }: Props) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`ឯកសារធំពេក — អតិបរមា ${MAX_MB}MB`);
      return;
    }
    setBusy(true); setError("");
    try {
      const uploaded = await uploadPhoto(file, folder);
      onChange(uploaded, file.name);
    } catch (err) {
      console.error(err);
      setError("ផ្ទុកឯកសារមិនបានជោគជ័យ សូមព្យាយាមម្តងទៀត");
    } finally { setBusy(false); }
  };

  return (
    <Field label={label}>
      {url ? (
        <div className="flex items-center gap-2.5 rounded-xl p-3" style={{ background: C.bgAlt, border: `1px solid ${C.line}` }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: tint(C.red, 12) }}>
            <FileText size={17} color={C.red} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: C.ink }}>{name ?? "ឯកសារ"}</div>
            <a href={url} target="_blank" rel="noreferrer" className="text-[10.5px] inline-flex items-center gap-1" style={{ color: C.greenMid }}>
              <ExternalLink size={10} /> បើកមើល
            </a>
          </div>
          <label htmlFor={inputId} className="text-[10.5px] font-semibold cursor-pointer px-2 py-1 rounded-lg shrink-0" style={{ background: C.card, color: C.green }}>ប្តូរ</label>
          <button onClick={() => onChange(null, null)} className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: C.card }}>
            <X size={13} color={C.red} />
          </button>
        </div>
      ) : (
        <label htmlFor={inputId} className="w-full h-20 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer" style={{ background: C.bgAlt, border: `1.5px dashed ${C.line}` }}>
          <Upload size={18} color={C.goldDeep} />
          <span className="text-[11px] font-medium" style={{ color: C.inkSoft }}>
            {busy ? "កំពុងផ្ទុក..." : "ចុចដើម្បីផ្ទុក PDF ឬរូបភាព"}
          </span>
        </label>
      )}
      <input id={inputId} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFile} disabled={busy} />
      {error && <div className="text-[10.5px] mt-1.5" style={{ color: C.red }}>{error}</div>}
    </Field>
  );
}
