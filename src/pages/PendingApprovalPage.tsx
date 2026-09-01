import * as api from "@/api";
import { C } from "@/lib/tokens";
import { DurianMark } from "@/components/ui/DurianMark";
import { useConfirm } from "@/components/ui/ConfirmDialog";

export function PendingApprovalPage() {
  const confirm = useConfirm();
  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-center" style={{ background: C.bg }}>
      <div>
        <div className="flex justify-center mb-3"><DurianMark size={56} /></div>
        <div className="text-sm font-semibold" style={{ color: C.green }}>គណនីរបស់អ្នកកំពុងរង់ចាំការអនុម័ត</div>
        <div className="text-xs mt-1" style={{ color: C.inkSoft }}>សូមទាក់ទងម្ចាស់ចម្ការ ដើម្បីកំណត់តួនាទី និងចាត់តាំងអ្នកចូលប្រើប្រព័ន្ធ</div>
        <button onClick={async () => { if (await confirm({ title: "ចាកចេញពីគណនី?", message: "អ្នកនឹងត្រូវបញ្ចូល email និងពាក្យសម្ងាត់ម្តងទៀត ដើម្បីចូលប្រើប្រព័ន្ធ។", confirmLabel: "ចាកចេញ", danger: true })) api.signOut(); }} className="mt-4 text-xs font-semibold" style={{ color: C.red }}>ចាកចេញ</button>
      </div>
    </div>
  );
}
