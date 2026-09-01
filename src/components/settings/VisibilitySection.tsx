import { Eye, EyeOff } from "lucide-react";
import { useUpdateFarmSettings } from "@/hooks/useFarmSettings";
import { can, roleInfo, APP_TABS, VISIBILITY_ROLES } from "@/lib/permissions";
import { C, tint } from "@/lib/tokens";
import type { FarmSettings, Role, RoleVisibility } from "@/types/domain";

export function VisibilitySection({ farm }: { farm: FarmSettings }) {
  const updateFarmM = useUpdateFarmSettings();

  const toggle = (roleKey: Role, tabKey: keyof RoleVisibility) => {
    const roleVis = farm.visibility[roleKey] ?? {};
    const visible = roleVis[tabKey] !== false;
    updateFarmM.mutate({ visibility: { ...farm.visibility, [roleKey]: { ...roleVis, [tabKey]: !visible } } });
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="text-[11px] mb-3" style={{ color: C.inkSoft }}>
        ជ្រើសរើសផ្នែកដែលនីមួយៗតួនាទីអាចមើលឃើញនៅក្នុងកម្មវិធី។ ម្ចាស់ចម្ការមើលឃើញគ្រប់ផ្នែកជានិច្ច។
      </div>
      <div className="space-y-3.5">
        {VISIBILITY_ROLES.map((rk) => {
          const ri = roleInfo(rk); const RIcon = ri.icon;
          const roleVis = farm.visibility[rk] ?? {};
          const allowedTabs = APP_TABS.filter((t) => can(rk, t.need));
          return (
            <div key={rk}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <RIcon size={13} color={C.greenMid} />
                <span className="text-xs font-semibold" style={{ color: C.ink }}>{ri.label}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allowedTabs.map((t) => {
                  const visible = roleVis[t.key as keyof RoleVisibility] !== false;
                  return (
                    <button
                      key={t.key}
                      onClick={() => toggle(rk, t.key as keyof RoleVisibility)}
                      className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium"
                      style={{ background: visible ? tint(C.greenMid, 10) : C.bgAlt, color: visible ? C.greenMid : C.inkSoft }}
                    >
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
  );
}
