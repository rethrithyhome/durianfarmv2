import { NavLink } from "react-router-dom";
import { LogOut, WifiOff } from "lucide-react";
import { C, tint } from "@/lib/tokens";
import { DurianMark } from "@/components/ui/DurianMark";
import { getVisibleTabs, roleInfo } from "@/lib/permissions";
import * as api from "@/api";
import type { FarmSettings, Role, UserProfile } from "@/types/domain";

interface Props {
  role: Role;
  visibility: FarmSettings["visibility"];
  farm: FarmSettings;
  profile: UserProfile;
  online: boolean;
  pending: number;
}

export function Sidebar({ role, visibility, farm, profile, online, pending }: Props) {
  const tabs = getVisibleTabs(role, visibility);
  const ri = roleInfo(role);

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 h-screen sticky top-0" style={{ background: C.card, borderRight: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-2.5 px-5 py-5">
        {farm.logo ? <img src={farm.logo} alt="logo" className="w-9 h-9 rounded-full object-cover" style={{ border: `1px solid ${C.line}` }} /> : <DurianMark size={36} />}
        <div className="min-w-0">
          <div className="font-extrabold text-sm leading-tight truncate" style={{ color: C.green }}>{farm.farmName}</div>
          <div className="text-[10.5px]" style={{ color: C.inkSoft }}>ប្រព័ន្ធគ្រប់គ្រងចំការ</div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const path = t.key === "home" ? "/" : `/${t.key}`;
          return (
            <NavLink
              key={t.key}
              to={path}
              end={t.key === "home"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "" : "hover:opacity-80"}`
              }
              style={({ isActive }) => ({
                background: isActive ? `linear-gradient(135deg, ${C.green}, ${C.greenMid})` : "transparent",
                color: isActive ? "#fff" : C.ink,
              })}
            >
              <Icon size={17} />
              {t.label}
            </NavLink>
          );
        })}
      </nav>

      {!online && (
        <div className="mx-3 mb-2 rounded-xl px-3 py-2 flex items-center gap-1.5 text-[11px] font-medium" style={{ background: tint(C.goldDeep, 14), color: C.goldDeep }}>
          <WifiOff size={12} /> គ្មានអ៊ីនធឺណិត{pending > 0 ? ` · ${pending} កំពុងរង់ចាំ` : ""}
        </div>
      )}
      {online && pending > 0 && (
        <div className="mx-3 mb-2 rounded-xl px-3 py-2 text-[11px] font-medium" style={{ background: tint(C.greenMid, 14), color: C.greenMid }}>
          កំពុងបញ្ជូនទិន្នន័យ {pending}...
        </div>
      )}

      <div className="px-3 pb-4 pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: C.bgAlt }}>
            {profile.photo ? <img src={profile.photo} className="w-full h-full object-cover" alt="" /> : <ri.icon size={15} color={C.greenMid} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold truncate" style={{ color: C.ink }}>{profile.name}</div>
            <div className="text-[10.5px] truncate" style={{ color: C.inkSoft }}>{ri.label}</div>
          </div>
          <button onClick={() => api.signOut()} className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: C.bgAlt }} title="ចាកចេញ">
            <LogOut size={13} color={C.red} />
          </button>
        </div>
      </div>
    </aside>
  );
}
