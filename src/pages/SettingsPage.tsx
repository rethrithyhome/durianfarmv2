import { useId, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, UserPlus, Pencil, Trash2, Eye, EyeOff, LogOut, FileText, Printer } from "lucide-react";
import * as api from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { useFarmSettings, useUpdateFarmSettings } from "@/hooks/useFarmSettings";
import { useUsers, useCreateUser, useUpdateUser, useRemoveUser } from "@/hooks/useUsers";
import { useTrees } from "@/hooks/useTrees";
import { can, roleInfo, APP_TABS, VISIBILITY_ROLES, SCOPED_ROLES } from "@/lib/permissions";
import { compressImageFile } from "@/lib/image";
import { C, tint } from "@/lib/tokens";
import { Field, PrimaryButton, inputCls, inputStyle, Badge } from "@/components/ui/primitives";
import { SheetModal } from "@/components/ui/SheetModal";
import { DurianMark } from "@/components/ui/DurianMark";
import { ThemePicker } from "@/components/settings/ThemePicker";
import { UserForm } from "@/components/settings/UserForm";
import { PasswordCard } from "@/components/settings/PasswordCard";
import type { FarmSettings, Role, RoleVisibility, UserProfile } from "@/types/domain";

export function SettingsPage({ role, farm }: { role: Role; farm: FarmSettings }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const enabled = !!profile?.farmId;
  const updateFarmM = useUpdateFarmSettings();
  const usersQ = useUsers(enabled && can(role, "viewUsers"));
  const treesQ = useTrees(enabled);
  const createUserM = useCreateUser();
  const updateUserM = useUpdateUser();
  const removeUserM = useRemoveUser();

  const [name, setName] = useState(farm.farmName);
  const [ownerPin, setOwnerPin] = useState(farm.ownerPin);
  const [logoBusy, setLogoBusy] = useState(false);
  const logoInputId = useId();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetTyped, setResetTyped] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState("");
  const [confirmDelUser, setConfirmDelUser] = useState<UserProfile | null>(null);
  const [userModal, setUserModal] = useState<{ mode: "add" | "edit"; user?: UserProfile } | null>(null);

  const users = usersQ.data ?? [];
  const allPlots = useMemo(() => Array.from(new Set((treesQ.data ?? []).map((t) => t.plot).filter((p): p is string => !!p))).sort(), [treesQ.data]);

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setLogoBusy(true);
    try {
      const compressed = await compressImageFile(file, 300, 0.75);
      const url = await api.uploadPhoto(compressed, "logos");
      await updateFarmM.mutateAsync({ logo: url });
    } catch (err) { console.error(err); }
    finally { setLogoBusy(false); }
  };

  const toggleVisibility = (roleKey: Role, tabKey: keyof RoleVisibility) => {
    const roleVis = farm.visibility[roleKey] ?? {};
    const visible = roleVis[tabKey] !== false;
    updateFarmM.mutate({ visibility: { ...farm.visibility, [roleKey]: { ...roleVis, [tabKey]: !visible } } });
  };

  const resetAllData = async () => {
    if (resetTyped.trim() !== "លុប") { setResetError('សូមវាយពាក្យ "លុប" ដើម្បីបញ្ជាក់'); return; }
    setResetBusy(true); setResetError("");
    try {
      await api.resetFarmData();
      await queryClient.invalidateQueries();
      setConfirmReset(false); setResetTyped("");
    } catch (err) {
      setResetError(err instanceof Error ? err.message : String(err));
    } finally { setResetBusy(false); }
  };

  return (
    <div className="pt-1 pb-4 space-y-4">
      <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-sm font-semibold mb-3" style={{ color: C.green }}>ព័ត៌មានចម្ការ</div>
        {can(role, "settings") && (
          <div className="flex items-center gap-3 mb-4">
            {farm.logo ? <img src={farm.logo} alt="logo" className="w-14 h-14 rounded-2xl object-cover" style={{ border: `1px solid ${C.line}` }} /> : <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: C.bgAlt }}><DurianMark size={34} /></div>}
            <div className="flex-1">
              <div className="flex gap-2">
                <label htmlFor={logoInputId} className="rounded-xl px-3 py-1.5 text-[11px] font-semibold cursor-pointer flex items-center gap-1" style={{ background: C.bgAlt, color: C.green }}><ImagePlus size={12} /> {logoBusy ? "កំពុងផ្ទុក..." : "ប្តូរ Logo"}</label>
                {farm.logo && <button onClick={() => updateFarmM.mutate({ logo: null })} className="rounded-xl px-3 py-1.5 text-[11px] font-semibold" style={{ background: tint(C.red, 8), color: C.red }}>ប្រើលំនាំដើម</button>}
              </div>
              <input id={logoInputId} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} disabled={logoBusy} />
            </div>
          </div>
        )}
        <Field label="ឈ្មោះចម្ការ"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={inputStyle} disabled={!can(role, "settings")} /></Field>
        {can(role, "settings") && (
          <Field label="PIN ម្ចាស់ចម្ការ (ស្រេចចិត្ត)"><input type="password" inputMode="numeric" maxLength={6} value={ownerPin} onChange={(e) => setOwnerPin(e.target.value.replace(/\D/g, ""))} placeholder="ទុកទទេប្រសិនបើមិនត្រូវការ" className={inputCls} style={inputStyle} /></Field>
        )}
        {can(role, "settings") && <PrimaryButton onClick={() => updateFarmM.mutate({ farmName: name, ownerPin: ownerPin.trim() })}>រក្សាទុក</PrimaryButton>}
      </div>

      {can(role, "settings") && <ThemePicker current={farm.theme} onChange={(key) => updateFarmM.mutate({ theme: key })} />}

      {can(role, "viewReports") && (
        <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-sm font-semibold mb-3" style={{ color: C.green }}>របាយការណ៍ & បោះពុម្ព</div>
          <div className="space-y-2">
            <button onClick={() => navigate("/print-qr")} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold" style={{ background: C.bgAlt, color: C.green }}><Printer size={15} /> បោះពុម្ព QR Code ដើមទាំងអស់</button>
            <button onClick={() => navigate("/reports")} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold" style={{ background: C.bgAlt, color: C.green }}><FileText size={15} /> មើលរបាយការណ៍</button>
          </div>
        </div>
      )}

      {SCOPED_ROLES.includes(role) && profile && (
        <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-sm font-semibold mb-2" style={{ color: C.green }}>តំបន់ដែលអ្នកគ្រប់គ្រង</div>
          {profile.plots.length === 0 ? <div className="text-[11px]" style={{ color: C.inkSoft }}>មិនទាន់មានតំបន់កំណត់ទេ</div> : (
            <div className="flex flex-wrap gap-1.5">{profile.plots.map((p) => <span key={p} className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: tint(C.greenMid, 10), color: C.greenMid }}>{p}</span>)}</div>
          )}
        </div>
      )}

      {can(role, "viewUsers") && (
        <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold" style={{ color: C.green }}>អ្នកប្រើប្រាស់ប្រព័ន្ធ</div>
            {can(role, "manageUsers") && <button onClick={() => setUserModal({ mode: "add" })} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: C.green, color: "#fff" }}><UserPlus size={12} /> បន្ថែម</button>}
          </div>
          {users.length === 0 ? <div className="text-[11px]" style={{ color: C.inkSoft }}>មិនទាន់មានអ្នកប្រើប្រាស់ទេ</div> : (
            <div className="space-y-2">
              {users.map((u) => {
                const ri = roleInfo(u.role); const RIcon = ri.icon;
                return (
                  <div key={u.id} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: C.bgAlt }}>{u.photo ? <img src={u.photo} className="w-full h-full object-cover" alt="" /> : <RIcon size={14} color={C.greenMid} />}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate" style={{ color: C.ink }}>{u.name} {u.status === "inactive" && <Badge label="អសកម្ម" color={C.red} />}</div>
                      <div className="text-[10.5px] truncate" style={{ color: C.inkSoft }}>{ri.label}{u.phone ? ` · ${u.phone}` : ""}{u.plots.length > 0 ? ` · ${u.plots.join(", ")}` : ""}</div>
                    </div>
                    {can(role, "manageUsers") && <div className="flex items-center gap-2 shrink-0"><button onClick={() => setUserModal({ mode: "edit", user: u })}><Pencil size={13} color={C.inkSoft} /></button><button onClick={() => setConfirmDelUser(u)}><Trash2 size={13} color={C.red} /></button></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {can(role, "manageVisibility") && (
        <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-sm font-semibold mb-1" style={{ color: C.green }}>ការកំណត់ការបង្ហាញទិន្នន័យ តាមតួនាទី</div>
          <div className="text-[11px] mb-3" style={{ color: C.inkSoft }}>ជ្រើសរើសផ្នែកដែលនីមួយៗតួនាទីអាចមើលឃើញនៅក្នុងកម្មវិធី។ ម្ចាស់ចម្ការមើលឃើញគ្រប់ផ្នែកជានិច្ច។</div>
          <div className="space-y-3.5">
            {VISIBILITY_ROLES.map((rk) => {
              const ri = roleInfo(rk); const RIcon = ri.icon;
              const roleVis = farm.visibility[rk] ?? {};
              const allowedTabs = APP_TABS.filter((t) => can(rk, t.need));
              return (
                <div key={rk}>
                  <div className="flex items-center gap-1.5 mb-1.5"><RIcon size={13} color={C.greenMid} /><span className="text-xs font-semibold" style={{ color: C.ink }}>{ri.label}</span></div>
                  <div className="flex flex-wrap gap-1.5">
                    {allowedTabs.map((t) => {
                      const visible = roleVis[t.key as keyof RoleVisibility] !== false;
                      return (
                        <button key={t.key} onClick={() => toggleVisibility(rk, t.key as keyof RoleVisibility)} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium" style={{ background: visible ? tint(C.greenMid, 10) : C.bgAlt, color: visible ? C.greenMid : C.inkSoft }}>
                          {visible ? <Eye size={11} /> : <EyeOff size={11} />} {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {can(role, "resetData") && (
        <div className="rounded-2xl p-4" style={{ background: tint(C.red, 5), border: `1px solid ${tint(C.red, 20)}` }}>
          <div className="text-sm font-semibold mb-1" style={{ color: C.red }}>តំបន់គ្រោះថ្នាក់</div>
          <div className="text-[11px] mb-3" style={{ color: C.inkSoft }}>លុបទិន្នន័យប្រតិបត្តិការទាំងអស់ (កម្មករ, ដើម, ចំណាយ, ការលក់) — មិនប៉ះពាល់គណនីអ្នកប្រើប្រាស់ទេ</div>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="text-xs font-semibold" style={{ color: C.red }}>លុបទិន្នន័យទាំងអស់...</button>
          ) : (
            <div>
              <div className="text-[11px] mb-2" style={{ color: C.brown }}>វាយពាក្យ <b>លុប</b> ខាងក្រោម ដើម្បីបញ្ជាក់ — សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ</div>
              <input value={resetTyped} onChange={(e) => setResetTyped(e.target.value)} className={inputCls} style={{ ...inputStyle, marginBottom: 10 }} placeholder="លុប" />
              {resetError && <div className="text-[11px] mb-2" style={{ color: C.red }}>{resetError}</div>}
              <div className="flex gap-2">
                <button onClick={() => { setConfirmReset(false); setResetTyped(""); setResetError(""); }} className="flex-1 rounded-xl py-2 text-xs font-semibold" style={{ background: C.bgAlt, color: C.ink }}>បោះបង់</button>
                <button onClick={resetAllData} disabled={resetBusy} className="flex-1 rounded-xl py-2 text-xs font-semibold disabled:opacity-60" style={{ background: C.red, color: "#fff" }}>{resetBusy ? "កំពុងលុប..." : "បញ្ជាក់ការលុប"}</button>
              </div>
            </div>
          )}
        </div>
      )}

      <PasswordCard />

      <button onClick={() => api.signOut()} className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold" style={{ background: C.bgAlt, color: C.red }}><LogOut size={14} /> ចាកចេញ</button>

      {confirmDelUser && (
        <SheetModal title="លុបអ្នកប្រើប្រាស់?" onClose={() => setConfirmDelUser(null)}>
          <p className="text-xs mb-4" style={{ color: C.inkSoft }}>លុប &quot;{confirmDelUser.name}&quot; ចេញពីប្រព័ន្ធ?</p>
          <div className="flex gap-2"><button onClick={() => setConfirmDelUser(null)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{ background: C.bgAlt, color: C.ink }}>បោះបង់</button><PrimaryButton danger full onClick={() => { removeUserM.mutate(confirmDelUser.id); setConfirmDelUser(null); }}>លុប</PrimaryButton></div>
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
