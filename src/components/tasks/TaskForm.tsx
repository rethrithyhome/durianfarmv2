import { useState } from "react";
import type { Task, TaskPriority, Tree, UserProfile, Worker } from "@/types/domain";
import { SheetModal } from "@/components/ui/SheetModal";
import { Field, PrimaryButton, inputCls, inputStyle } from "@/components/ui/primitives";
import { CARE_TYPES } from "@/lib/constants";
import { C } from "@/lib/tokens";

const PRIORITIES: { key: TaskPriority; label: string; color: string }[] = [
  { key: "low", label: "ធម្មតា", color: "#5B6650" },
  { key: "normal", label: "សំខាន់", color: "#B9832C" },
  { key: "high", label: "បន្ទាន់", color: "#B54B3A" },
];

interface Props {
  initial?: Task;
  workers: Worker[];
  trees: Tree[];
  users: UserProfile[];
  plots: string[];
  onClose: () => void;
  onSubmit: (t: Partial<Task>) => Promise<void>;
}

export function TaskForm({ initial, workers, trees, users, plots, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [careType, setCareType] = useState(initial?.careType ?? "");
  const [plot, setPlot] = useState(initial?.plot ?? "");
  const [treeId, setTreeId] = useState(initial?.treeId ?? "");
  const [workerId, setWorkerId] = useState(initial?.workerId ?? "");
  const [assigneeId, setAssigneeId] = useState(initial?.assigneeId ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? "normal");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await onSubmit({
        ...(initial ?? {}),
        title: title.trim(), description: description.trim(),
        careType: (careType || null) as Task["careType"],
        plot: plot || null, treeId: treeId || null,
        workerId: workerId || null, assigneeId: assigneeId || null,
        dueDate: dueDate || null, priority,
      });
      onClose();
    } finally { setBusy(false); }
  };

  return (
    <SheetModal title={initial ? "កែសម្រួលការងារ" : "ចាត់តាំងការងារថ្មី"} onClose={onClose}>
      <Field label="ចំណងជើងការងារ *">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ឧ. បាញ់ថ្នាំចម្រៀក A" className={inputCls} style={inputStyle} />
      </Field>
      <Field label="ប្រភេទការងារ">
        <select value={careType} onChange={(e) => setCareType(e.target.value)} className={inputCls} style={inputStyle}>
          <option value="">មិនបញ្ជាក់</option>
          {CARE_TYPES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </Field>
      <Field label="កម្រិតអាទិភាព">
        <div className="grid grid-cols-3 gap-2">
          {PRIORITIES.map((p) => (
            <button key={p.key} onClick={() => setPriority(p.key)} className="rounded-xl px-3 py-2 text-xs font-medium"
              style={{ background: priority === p.key ? `color-mix(in srgb, ${p.color} 14%, transparent)` : C.bgAlt, border: `1.5px solid ${priority === p.key ? p.color : "transparent"}`, color: priority === p.key ? p.color : C.ink }}>
              {p.label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="ថ្ងៃត្រូវធ្វើ">
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} style={inputStyle} />
      </Field>
      <Field label="ចម្រៀក/តំបន់">
        <select value={plot} onChange={(e) => setPlot(e.target.value)} className={inputCls} style={inputStyle}>
          <option value="">មិនបញ្ជាក់</option>
          {plots.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </Field>
      <Field label="ដើមទុរេនជាក់លាក់ (ស្រេចចិត្ត)">
        <select value={treeId} onChange={(e) => setTreeId(e.target.value)} className={inputCls} style={inputStyle}>
          <option value="">មិនបញ្ជាក់</option>
          {trees.map((t) => <option key={t.id} value={t.id}>{t.code}</option>)}
        </select>
      </Field>
      <Field label="កម្មករទទួលបន្ទុក">
        <select value={workerId} onChange={(e) => setWorkerId(e.target.value)} className={inputCls} style={inputStyle}>
          <option value="">មិនបញ្ជាក់</option>
          {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </Field>
      <Field label="បង្ហាញដល់អ្នកប្រើប្រាស់">
        <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={inputCls} style={inputStyle}>
          <option value="">អ្នកទាំងអស់</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <div className="text-[10.5px] mt-1" style={{ color: C.inkSoft }}>ជ្រើសរើសបើចង់ឲ្យលេចឡើងក្នុង "ការងាររបស់ខ្ញុំ" សម្រាប់អ្នកណាម្នាក់ជាក់លាក់</div>
      </Field>
      <Field label="ការណែនាំបន្ថែម">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} style={inputStyle} />
      </Field>
      <PrimaryButton full onClick={submit} disabled={busy}>{busy ? "កំពុងរក្សាទុក..." : initial ? "រក្សាទុកការផ្លាស់ប្តូរ" : "ចាត់តាំងការងារ"}</PrimaryButton>
    </SheetModal>
  );
}
