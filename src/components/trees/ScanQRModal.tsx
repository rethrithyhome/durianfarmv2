import { useState } from "react";
import { QrCode, Camera } from "lucide-react";
import { SheetModal } from "@/components/ui/SheetModal";
import { Field, inputCls, inputStyle } from "@/components/ui/primitives";
import { decodeQrFromFile, extractTreeLookup } from "@/lib/qr";
import { C, tint } from "@/lib/tokens";
import type { Tree } from "@/types/domain";

interface Props {
  trees: Tree[];
  onClose: () => void;
  onFound: (treeId: string) => void;
}

export function ScanQRModal({ trees, onClose, onFound }: Props) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");

  const resolveTree = (text: string): Tree | undefined => {
    const { treeId, code } = extractTreeLookup(text);
    if (treeId) {
      const byId = trees.find((t) => t.id === treeId);
      if (byId) return byId;
    }
    if (code) return trees.find((t) => t.code.trim().toLowerCase() === code.trim().toLowerCase());
    return undefined;
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true); setError("");
    try {
      const { text } = await decodeQrFromFile(file, setStatus);
      const tree = resolveTree(text);
      if (!tree) { setError("កូដ QR នេះមិនត្រូវនឹងដើមទុរេនណាមួយក្នុងប្រព័ន្ធទេ"); return; }
      onFound(tree.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "មិនអាចស្កេនបានទេ សូមព្យាយាមម្តងទៀត");
    } finally { setBusy(false); setStatus(""); }
  };

  const submitManual = () => {
    if (!manualCode.trim()) return;
    const tree = trees.find((t) => t.code.trim().toLowerCase() === manualCode.trim().toLowerCase());
    if (!tree) { setError("រកមិនឃើញដើមទុរេនដែលមានលេខកូដនេះទេ"); return; }
    onFound(tree.id);
  };

  return (
    <SheetModal title="ស្កេនកូដ QR" onClose={onClose}>
      <div className="rounded-xl p-3 text-[11px] mb-4" style={{ background: tint(C.blue, 10), color: C.brown }}>
        គន្លឹះ៖ QR ដែលបិទលើដើមឈើ អាចស្កេនដោយកាមេរ៉ាធម្មតារបស់ទូរស័ព្ទ (មិនចាំបាច់បើក app នេះជាមុនទេ) — នឹងបើកទំព័រដើមនោះដោយផ្ទាល់។ ប្រើផ្នែកនេះសម្រាប់ស្កេនរហ័សពេលកំពុងប្រើ app ស្រាប់។
      </div>
      <div className="flex flex-col items-center text-center mb-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: C.bgAlt }}><QrCode size={28} color={C.goldDeep} /></div>
        <label className="w-full">
          <div className="w-full rounded-xl px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer" style={{ background: C.green, color: "#fff", opacity: busy ? 0.7 : 1 }}>
            <Camera size={16} /> {busy ? (status || "កំពុងស្កេន...") : "ថតរូប ឬជ្រើសរូបកូដ QR"}
          </div>
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} disabled={busy} />
        </label>
      </div>
      {error && <div className="rounded-xl px-3 py-2.5 text-[11px] mb-4" style={{ background: tint(C.red, 10), color: C.red }}>{error}</div>}
      <div className="flex items-center gap-2 mb-4"><div className="flex-1 h-px" style={{ background: C.line }} /><span className="text-[10.5px]" style={{ color: C.inkSoft }}>ឬ</span><div className="flex-1 h-px" style={{ background: C.line }} /></div>
      <Field label="វាយបញ្ចូលលេខកូដដើមដោយដៃ">
        <div className="flex gap-2">
          <input value={manualCode} onChange={(e) => setManualCode(e.target.value)} className={`${inputCls} flex-1`} style={inputStyle} />
          <button onClick={submitManual} className="rounded-xl px-4 text-xs font-semibold" style={{ background: C.bgAlt, color: C.green }}>ស្វែងរក</button>
        </div>
      </Field>
    </SheetModal>
  );
}
