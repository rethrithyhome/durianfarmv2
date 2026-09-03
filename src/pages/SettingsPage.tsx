import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Palette, Coins, Users as UsersIcon, Eye, FileText, Printer, History,
  KeyRound, AlertTriangle, LogOut, ChevronRight, ArrowLeft, Map, Bell,
  type LucideIcon,
} from "lucide-react";
import * as api from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateFarmSettings } from "@/hooks/useFarmSettings";
import { can, SCOPED_ROLES } from "@/lib/permissions";
import { C, tint } from "@/lib/tokens";
import { FarmInfoSection } from "@/components/settings/FarmInfoSection";
import { CurrencySection } from "@/components/settings/CurrencySection";
import { UsersSection } from "@/components/settings/UsersSection";
import { VisibilitySection } from "@/components/settings/VisibilitySection";
import { DangerSection } from "@/components/settings/DangerSection";
import { ThemePicker } from "@/components/settings/ThemePicker";
import { DarkModeToggle } from "@/components/settings/DarkModeToggle";
import { PasswordCard } from "@/components/settings/PasswordCard";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { ReportsHub } from "@/components/settings/ReportsHub";
import type { FarmSettings, Role } from "@/types/domain";
import { useConfirm } from "@/components/ui/ConfirmDialog";

type SectionKey = "farm" | "theme" | "currency" | "users" | "visibility" | "plots" | "password" | "notifications" | "reports" | "danger";

interface SectionDef {
  key: SectionKey;
  label: string;
  desc: string;
  icon: LucideIcon;
  show: boolean;
  tone?: string;
}

export function SettingsPage({ role, farm }: { role: Role; farm: FarmSettings }) {
  const confirm = useConfirm();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const updateFarmM = useUpdateFarmSettings();
  const [open, setOpen] = useState<SectionKey | null>(null);

  const allSections: SectionDef[] = [
    { key: "farm", label: "ព័ត៌មានចម្ការ", desc: "ឈ្មោះ, Logo, PIN", icon: Building2, show: true },
    { key: "theme", label: "ពណ៌ Interface", desc: "ជ្រើសរើសរចនាបថពណ៌", icon: Palette, show: can(role, "settings") },
    { key: "currency", label: "រូបិយប័ណ្ណ & ខួបប្រាក់ឈ្នួល", desc: "អត្រាប្តូរប្រាក់, ថ្ងៃចាប់ផ្តើមខួប", icon: Coins, show: can(role, "settings") },
    { key: "users", label: "អ្នកប្រើប្រាស់ប្រព័ន្ធ", desc: "បន្ថែម និងកំណត់តួនាទី", icon: UsersIcon, show: can(role, "viewUsers") },
    { key: "visibility", label: "ការបង្ហាញតាមតួនាទី", desc: "កំណត់អ្វីដែលនីមួយៗឃើញ", icon: Eye, show: can(role, "manageVisibility") },
    { key: "plots", label: "តំបន់ដែលអ្នកគ្រប់គ្រង", desc: "ចម្រៀកដែលបានចាត់តាំង", icon: Map, show: SCOPED_ROLES.includes(role) },
    { key: "password", label: "ពាក្យសម្ងាត់របស់ខ្ញុំ", desc: "ប្តូរដោយខ្លួនឯង", icon: KeyRound, show: true },
    { key: "notifications", label: "ការជូនដំណឹង", desc: "ជូនដំណឹងការងារថ្មីៗ", icon: Bell, show: true },
    { key: "reports", label: "របាយការណ៍ទាំងអស់", desc: "ព្រីន, CSV, ប្រវត្តិកែប្រែ", icon: FileText, show: can(role, "viewReports") || can(role, "viewUsers") },
    { key: "danger", label: "តំបន់គ្រោះថ្នាក់", desc: "លុបទិន្នន័យទាំងអស់", icon: AlertTriangle, show: can(role, "resetData"), tone: C.red },
  ];
  const sections = allSections.filter((s) => s.show);

  const current = sections.find((s) => s.key === open);

  // Detail view — one section at a time, so the settings screen isn't a
  // single long wall of unrelated controls.
  if (current) {
    return (
      <div className="pt-1 pb-4">
        <button onClick={() => setOpen(null)} className="flex items-center gap-1 text-xs font-medium mb-3" style={{ color: C.greenMid }}>
          <ArrowLeft size={15} /> ត្រឡប់ទៅកំណត់
        </button>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint(current.tone ?? C.green, 12) }}>
            <current.icon size={17} color={current.tone ?? C.green} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: current.tone ?? C.green }}>{current.label}</div>
            <div className="text-[11px]" style={{ color: C.inkSoft }}>{current.desc}</div>
          </div>
        </div>

        {open === "farm" && <FarmInfoSection role={role} farm={farm} />}
        {open === "theme" && <><DarkModeToggle /><ThemePicker current={farm.theme} onChange={(key) => updateFarmM.mutate({ theme: key })} /></>}
        {open === "currency" && <CurrencySection farm={farm} />}
        {open === "users" && <UsersSection role={role} />}
        {open === "visibility" && <VisibilitySection farm={farm} />}
        {open === "password" && <PasswordCard />}
        {open === "notifications" && <NotificationSettings />}
        {open === "reports" && <ReportsHub role={role} />}
        {open === "danger" && <DangerSection />}
        {open === "plots" && profile && (
          <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            {profile.plots.length === 0 ? (
              <div className="text-[11px]" style={{ color: C.inkSoft }}>មិនទាន់មានតំបន់កំណត់ទេ</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {profile.plots.map((p) => (
                  <span key={p} className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: tint(C.greenMid, 10), color: C.greenMid }}>{p}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Menu view
  return (
    <div className="pt-1 pb-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {sections.map((s) => {
          const Icon = s.icon;
          const tone = s.tone ?? C.green;
          return (
            <button
              key={s.key}
              onClick={() => setOpen(s.key)}
              className="flex items-center gap-3 rounded-2xl p-3.5 text-left"
              style={{ background: C.card, border: `1px solid ${s.tone ? tint(C.red, 20) : C.line}` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint(tone, 12) }}>
                <Icon size={18} color={tone} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: tone }}>{s.label}</div>
                <div className="text-[11px] truncate" style={{ color: C.inkSoft }}>{s.desc}</div>
              </div>
              <ChevronRight size={16} color={C.inkSoft} />
            </button>
          );
        })}
      </div>

      <button onClick={async () => { if (await confirm({ title: "ចាកចេញពីគណនី?", message: "អ្នកនឹងត្រូវបញ្ចូល email និងពាក្យសម្ងាត់ម្តងទៀត ដើម្បីចូលប្រើប្រព័ន្ធ។", confirmLabel: "ចាកចេញ", danger: true })) api.signOut(); }} className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold" style={{ background: C.bgAlt, color: C.red }}>
        <LogOut size={14} /> ចាកចេញ
      </button>
    </div>
  );
}
