import { Phone, Calendar, MapPin, Briefcase, FileText, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { SheetModal } from "@/components/ui/SheetModal";
import { Badge } from "@/components/ui/primitives";
import { GENDER_LABELS, genderColor } from "@/lib/constants";
import { fmtCurrency } from "@/lib/currency";
import { fmtDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { C, tint } from "@/lib/tokens";
import type { Role, Worker } from "@/types/domain";

export function WorkerDetailSheet({
  worker, role, onClose, onEdit, onDelete,
}: {
  worker: Worker;
  role: Role;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <SheetModal title="ព័ត៌មានកម្មករ" onClose={onClose}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: C.bgAlt }}>
          {worker.photo ? <img src={worker.photo} className="w-full h-full object-cover" alt="" /> : <div className="text-xl font-bold" style={{ color: C.greenMid }}>{worker.name.charAt(0)}</div>}
        </div>
        <div className="min-w-0">
          <div className="text-base font-bold flex items-center gap-1.5 flex-wrap" style={{ color: C.green }}>
            {worker.name}
            {worker.gender && <Badge label={GENDER_LABELS[worker.gender]} color={genderColor(worker.gender)} />}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge label={worker.wageType === "monthly" ? "ប្រាក់ខែ" : "ប្រាក់ថ្ងៃ"} color={worker.wageType === "monthly" ? C.greenMid : C.blue} />
            {worker.status === "inactive" && <Badge label="ឈប់ធ្វើការ" color={C.red} />}
          </div>
        </div>
      </div>

      <div className="space-y-2.5 mb-4">
        {worker.phone && (
          <div className="flex items-center gap-2.5 text-xs" style={{ color: C.ink }}><Phone size={14} color={C.inkSoft} /> {worker.phone}</div>
        )}
        {worker.birthDate && (
          <div className="flex items-center gap-2.5 text-xs" style={{ color: C.ink }}><Calendar size={14} color={C.inkSoft} /> កំណើត {fmtDate(worker.birthDate)}</div>
        )}
        {(worker.position || worker.specialty) && (
          <div className="flex items-center gap-2.5 text-xs" style={{ color: C.ink }}><Briefcase size={14} color={C.inkSoft} /> {worker.position}{worker.position && worker.specialty ? " · " : ""}{worker.specialty}</div>
        )}
        {worker.plot && (
          <div className="flex items-center gap-2.5 text-xs" style={{ color: C.ink }}><MapPin size={14} color={C.inkSoft} /> ចម្រៀក {worker.plot}</div>
        )}
        {worker.startDate && (
          <div className="flex items-center gap-2.5 text-xs" style={{ color: C.ink }}><Calendar size={14} color={C.inkSoft} /> ចូលធ្វើការ {fmtDate(worker.startDate)}</div>
        )}
        {can(role, "setWage") && worker.wageRate > 0 && (
          <div className="text-xs" style={{ color: C.greenMid }}>
            {fmtCurrency(worker.wageRate, worker.wageCurrency)}{worker.wageType === "monthly" ? "/ខែ" : worker.dailyRateMode === "daily" ? " (ប្រែប្រួលប្រចាំថ្ងៃ)" : "/ម៉ោង"}
          </div>
        )}
      </div>

      {worker.idDocUrl ? (
        <a href={worker.idDocUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl p-3 mb-4" style={{ background: tint(C.red, 8), border: `1px solid ${tint(C.red, 20)}` }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: tint(C.red, 15) }}><FileText size={17} color={C.red} /></div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: C.ink }}>{worker.idDocName ?? "ឯកសារសម្គាល់ខ្លួន"}</div>
            <div className="text-[10.5px] flex items-center gap-1" style={{ color: C.greenMid }}><ExternalLink size={10} /> ចុចដើម្បីបើកមើល</div>
          </div>
        </a>
      ) : (
        <div className="text-[11px] mb-4" style={{ color: C.inkSoft }}>មិនទាន់មានឯកសារភ្ជាប់ទេ</div>
      )}

      {worker.notes && (
        <div className="text-xs rounded-xl p-3 mb-4" style={{ background: C.bgAlt, color: C.ink }}>{worker.notes}</div>
      )}

      {can(role, "editWorker") && (
        <div className="flex gap-2">
          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold" style={{ background: C.bgAlt, color: C.green }}>
            <Pencil size={13} /> កែសម្រួល
          </button>
          {can(role, "deleteWorker") && (
            <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold" style={{ background: tint(C.red, 10), color: C.red }}>
              <Trash2 size={13} /> លុប
            </button>
          )}
        </div>
      )}
    </SheetModal>
  );
}
