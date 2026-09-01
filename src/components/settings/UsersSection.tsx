import { useMemo, useState } from "react";
import { UserPlus, Pencil, Trash2 } from "lucide-react";
import { useUsers, useCreateUser, useUpdateUser, useRemoveUser } from "@/hooks/useUsers";
import { useTrees } from "@/hooks/useTrees";
import { useAuth } from "@/contexts/AuthContext";
import { can, roleInfo } from "@/lib/permissions";
import { C } from "@/lib/tokens";
import { Badge, PrimaryButton } from "@/components/ui/primitives";
import { SheetModal } from "@/components/ui/SheetModal";
import { UserForm } from "@/components/settings/UserForm";
import type { Role, UserProfile } from "@/types/domain";

export function UsersSection({ role }: { role: Role }) {
  const { profile } = useAuth();
  const enabled = !!profile?.farmId;
  const usersQ = useUsers(enabled && can(role, "viewUsers"));
  const treesQ = useTrees(enabled);
  const createUserM = useCreateUser();
  const updateUserM = useUpdateUser();
  const removeUserM = useRemoveUser();

  const [confirmDelUser, setConfirmDelUser] = useState<UserProfile | null>(null);
  const [userModal, setUserModal] = useState<{ mode: "add" | "edit"; user?: UserProfile } | null>(null);

  const users = usersQ.data ?? [];
  const allPlots = useMemo(
    () => Array.from(new Set((treesQ.data ?? []).map((t) => t.plot).filter((p): p is string => !!p))).sort(),
    [treesQ.data]
  );

  return (
    <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      {can(role, "manageUsers") && (
        <button onClick={() => setUserModal({ mode: "add" })} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold mb-3" style={{ background: C.green, color: "#fff" }}>
          <UserPlus size={12} /> បន្ថែមអ្នកប្រើប្រាស់
        </button>
      )}
      {users.length === 0 ? (
        <div className="text-[11px]" style={{ color: C.inkSoft }}>មិនទាន់មានអ្នកប្រើប្រាស់ទេ</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const ri = roleInfo(u.role); const RIcon = ri.icon;
            return (
              <div key={u.id} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: C.bgAlt }}>
                  {u.photo ? <img src={u.photo} className="w-full h-full object-cover" alt="" /> : <RIcon size={14} color={C.greenMid} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: C.ink }}>
                    {u.name} {u.status === "inactive" && <Badge label="អសកម្ម" color={C.red} />}
                  </div>
                  <div className="text-[10.5px] truncate" style={{ color: C.inkSoft }}>
                    {ri.label}{u.phone ? ` · ${u.phone}` : ""}{u.plots.length > 0 ? ` · ${u.plots.join(", ")}` : ""}
                  </div>
                </div>
                {can(role, "manageUsers") && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setUserModal({ mode: "edit", user: u })}><Pencil size={13} color={C.inkSoft} /></button>
                    <button onClick={() => setConfirmDelUser(u)}><Trash2 size={13} color={C.red} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {confirmDelUser && (
        <SheetModal title="លុបអ្នកប្រើប្រាស់?" onClose={() => setConfirmDelUser(null)}>
          <p className="text-xs mb-4" style={{ color: C.inkSoft }}>លុប &quot;{confirmDelUser.name}&quot; ចេញពីប្រព័ន្ធ?</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelUser(null)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{ background: C.bgAlt, color: C.ink }}>បោះបង់</button>
            <PrimaryButton danger full onClick={() => { removeUserM.mutate(confirmDelUser.id); setConfirmDelUser(null); }}>លុប</PrimaryButton>
          </div>
        </SheetModal>
      )}
      {userModal && (
        <UserForm
          initial={userModal.user}
          allPlots={allPlots}
          onClose={() => setUserModal(null)}
          onCreate={(input) => createUserM.mutateAsync(input)}
          onUpdate={(input) => updateUserM.mutateAsync(input)}
        />
      )}
    </div>
  );
}
