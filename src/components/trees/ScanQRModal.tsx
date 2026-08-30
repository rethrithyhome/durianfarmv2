import { useCallback, useEffect, useState } from "react";
import { QrCode, Camera, ImageUp, Keyboard, X } from "lucide-react";
import { SheetModal } from "@/components/ui/SheetModal";
import { Field, inputCls, inputStyle } from "@/components/ui/primitives";
import { decodeQrFromFile } from "@/lib/qr";
import { useLiveQrScanner } from "@/hooks/useLiveQrScanner";
import { C, tint } from "@/lib/tokens";
import type { Tree } from "@/types/domain";

interface Props {
  trees: Tree[];
  onClose: () => void;
  onFound: (treeId: string) => void;
}

type Mode = "camera" | "upload" | "manual";

export function ScanQRModal({ trees, onClose, onFound }: Props) {
  const [mode, setMode] = useState<Mode>("camera");
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const resolveTree = useCallback((text: string): Tree | undefined => {
    const byCode = trees.find((t) => t.code.trim().toLowerCase() === text.trim().toLowerCase());
    if (byCode) return byCode;
    try {
      const parsed = JSON.parse(text) as { treeId?: string; code?: string };
      if (parsed.treeId) return trees.find((t) => t.id === parsed.treeId);
      if (parsed.code) return trees.find((t) => t.code.trim().toLowerCase() === parsed.code!.trim().toLowerCase());
    } catch {
      // not JSON — plain-code match above already covers it
    }
    return undefined;
  }, [trees]);

  const handleDecoded = useCallback((text: string) => {
    const tree = resolveTree(text);
    if (!tree) { setError("កូដ QR នេះមិនត្រូវនឹងដើមទុរេនណាមួយក្នុងប្រព័ន្ធទេ — សូមសាកម្តងទៀត"); return; }
    onFound(tree.id);
  }, [resolveTree, onFound]);

  const { videoRef, error: camError, ready } = useLiveQrScanner({ active: mode === "camera", onDecoded: handleDecoded });

  // If the camera can't be used (no permission, no device, desktop with
  // no webcam, etc.) fall back to the upload flow automatically.
  useEffect(() => { if (camError) setMode("upload"); }, [camError]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadBusy(true); setError("");
    try {
      const { text } = await decodeQrFromFile(file, setUploadStatus);
      const tree = resolveTree(text);
      if (!tree) { setError("កូដ QR នេះមិនត្រូវនឹងដើមទុរេនណាមួយក្នុងប្រព័ន្ធទេ"); return; }
      onFound(tree.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "មិនអាចស្កេនបានទេ សូមព្យាយាមម្តងទៀត");
    } finally { setUploadBusy(false); setUploadStatus(""); }
  };

  const submitManual = () => {
    if (!manualCode.trim()) return;
    const tree = trees.find((t) => t.code.trim().toLowerCase() === manualCode.trim().toLowerCase());
    if (!tree) { setError("រកមិនឃើញដើមទុរេនដែលមានលេខកូដនេះទេ"); return; }
    onFound(tree.id);
  };

  return (
    <SheetModal title="ស្កេនកូដ QR" onClose={onClose}>
      {mode === "camera" && (
        <div className="mb-4">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden" style={{ background: "#000" }}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-[11px] text-white/80">កំពុងបើកកាមេរ៉ា...</div>
              </div>
            )}
            {ready && (
              <>
                <div className="absolute inset-8 rounded-2xl" style={{ border: "3px solid rgba(255,255,255,0.85)", boxShadow: "0 0 0 2000px rgba(0,0,0,0.35)" }} />
                <div className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-white/90 font-medium">ដាក់កូដ QR ឲ្យស្ថិតក្នុងស៊ុម — នឹងស្គាល់ដោយស្វ័យប្រវត្តិ</div>
              </>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3">
            <button onClick={() => setMode("upload")} className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: C.greenMid }}><ImageUp size={13} /> ផ្ទុករូបភាពជំនួស</button>
            <button onClick={() => setMode("manual")} className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: C.greenMid }}><Keyboard size={13} /> វាយបញ្ចូលដោយដៃ</button>
          </div>
        </div>
      )}

      {mode === "upload" && (
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: C.bgAlt }}><QrCode size={28} color={C.goldDeep} /></div>
          <label className="w-full">
            <div className="w-full rounded-xl px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer" style={{ background: C.green, color: "#fff", opacity: uploadBusy ? 0.7 : 1 }}>
              <Camera size={16} /> {uploadBusy ? (uploadStatus || "កំពុងស្កេន...") : "ថតរូប ឬជ្រើសរូបកូដ QR"}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploadBusy} />
          </label>
          <div className="flex items-center justify-center gap-4 mt-3">
            <button onClick={() => { setError(""); setMode("camera"); }} className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: C.greenMid }}><Camera size={13} /> ប្រើកាមេរ៉ាផ្ទាល់វិញ</button>
            <button onClick={() => setMode("manual")} className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: C.greenMid }}><Keyboard size={13} /> វាយបញ្ចូលដោយដៃ</button>
          </div>
        </div>
      )}

      {mode === "manual" && (
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold" style={{ color: C.ink }}>វាយបញ្ចូលលេខកូដដើមដោយដៃ</div>
          <button onClick={() => setMode("camera")} className="p-1 rounded-full" style={{ background: C.bgAlt }}><X size={13} color={C.inkSoft} /></button>
        </div>
      )}

      {error && <div className="rounded-xl px-3 py-2.5 text-[11px] mb-4" style={{ background: tint(C.red, 10), color: C.red }}>{error}</div>}

      {mode !== "camera" && mode !== "manual" && (
        <>
          <div className="flex items-center gap-2 mb-4"><div className="flex-1 h-px" style={{ background: C.line }} /><span className="text-[10.5px]" style={{ color: C.inkSoft }}>ឬ</span><div className="flex-1 h-px" style={{ background: C.line }} /></div>
        </>
      )}
      {mode !== "camera" && (
        <Field label="វាយបញ្ចូលលេខកូដដើមដោយដៃ">
          <div className="flex gap-2">
            <input value={manualCode} onChange={(e) => setManualCode(e.target.value)} className={`${inputCls} flex-1`} style={inputStyle} />
            <button onClick={submitManual} className="rounded-xl px-4 text-xs font-semibold" style={{ background: C.bgAlt, color: C.green }}>ស្វែងរក</button>
          </div>
        </Field>
      )}
    </SheetModal>
  );
}
