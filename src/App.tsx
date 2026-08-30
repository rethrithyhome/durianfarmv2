import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useFarmSettings } from "@/hooks/useFarmSettings";
import { useOnlineSync } from "@/hooks/useOnlineSync";
import { LoginPage } from "@/pages/LoginPage";
import { PendingApprovalPage } from "@/pages/PendingApprovalPage";
import { HomePage } from "@/pages/HomePage";
import { WorkersPage } from "@/pages/WorkersPage";
import { TreesPage } from "@/pages/TreesPage";
import { TreeDetailPage } from "@/pages/TreeDetailPage";
import { ExpensesPage } from "@/pages/ExpensesPage";
import { SalesPage } from "@/pages/SalesPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { PrintQRPage } from "@/pages/PrintQRPage";
import { ReportPage } from "@/pages/ReportPage";
import { DurianMark } from "@/components/ui/DurianMark";
import { Sidebar } from "@/components/layout/Sidebar";
import { C } from "@/lib/tokens";
import { APP_TABS, getVisibleTabs, roleInfo } from "@/lib/permissions";
import { LogOut, WifiOff } from "lucide-react";
import * as api from "@/api";
import type { FarmSettings, Role, TabKey } from "@/types/domain";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
      <div className="flex flex-col items-center gap-3">
        <DurianMark size={52} />
        <div className="text-sm" style={{ color: C.inkSoft }}>កំពុងផ្ទុកទិន្នន័យ...</div>
      </div>
    </div>
  );
}

function currentTabKey(pathname: string): TabKey {
  return (pathname.split("/")[1] || "home") as TabKey;
}

function BottomNav({ role, visibility }: { role: Role; visibility: FarmSettings["visibility"] }) {
  const tabs = getVisibleTabs(role, visibility);
  const location = useLocation();
  const navigate = useNavigate();
  const currentTab = currentTabKey(location.pathname);
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center no-print lg:hidden">
      <div className="w-full max-w-md px-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center justify-between rounded-2xl px-1 py-1.5" style={{ background: `linear-gradient(135deg, ${C.green}, ${C.greenMid})`, boxShadow: "0 6px 24px rgba(0,0,0,0.22)" }}>
          {tabs.map((it) => {
            const Icon = it.icon;
            const activeItem = currentTab === it.key || (it.key === "home" && location.pathname === "/");
            const path = it.key === "home" ? "/" : `/${it.key}`;
            return (
              <button key={it.key} onClick={() => navigate(path)} className="relative flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl" style={{ background: activeItem ? "rgba(255,255,255,0.14)" : "transparent" }}>
                {activeItem && <span className="absolute -top-0.5 w-6 h-0.5 rounded-full" style={{ background: C.gold }} />}
                <Icon size={17} color={activeItem ? C.gold : "#C9D2C4"} />
                <span className="text-[9px] font-medium" style={{ color: activeItem ? "#fff" : "#B7C2B1" }}>{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MobileHeader({ farm, role, profile, online, pending }: { farm: FarmSettings; role: Role; profile: NonNullable<ReturnType<typeof useAuth>["profile"]>; online: boolean; pending: number }) {
  return (
    <div className="sticky top-0 z-30 px-4 pt-4 pb-3 no-print lg:hidden" style={{ background: C.bg }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {farm.logo ? <img src={farm.logo} alt="logo" className="w-[34px] h-[34px] rounded-full object-cover" style={{ border: `1px solid ${C.line}` }} /> : <DurianMark size={34} />}
          <div>
            <div className="font-extrabold text-[15px] leading-tight" style={{ color: C.green }}>{farm.farmName}</div>
            <div className="text-[11px] flex items-center gap-1.5" style={{ color: C.inkSoft }}>
              {roleInfo(role).label} · {profile.name}
              {!online && (
                <span className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold" style={{ background: `color-mix(in srgb, ${C.goldDeep} 14%, transparent)`, color: C.goldDeep }}>
                  <WifiOff size={9} /> គ្មានអ៊ីនធឺណិត{pending > 0 ? ` · ${pending}` : ""}
                </span>
              )}
              {online && pending > 0 && (
                <span className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold" style={{ background: `color-mix(in srgb, ${C.greenMid} 14%, transparent)`, color: C.greenMid }}>
                  កំពុងបញ្ជូន {pending}...
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => api.signOut()} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.bgAlt }}><LogOut size={15} color={C.red} /></button>
      </div>
    </div>
  );
}

function DesktopTopBar() {
  const location = useLocation();
  const tab = APP_TABS.find((t) => t.key === currentTabKey(location.pathname));
  const isTreeDetail = /^\/trees\/[^/]+$/.test(location.pathname);
  const title = isTreeDetail ? "ព័ត៌មានលម្អិតដើមទុរេន" : tab?.label ?? "ទំព័រដើម";
  return (
    <div className="hidden lg:flex items-center justify-between px-8 py-5 no-print" style={{ borderBottom: `1px solid ${C.line}` }}>
      <h1 className="text-lg" style={{ color: C.green, fontWeight: 800, letterSpacing: "-0.02em" }}>{title}</h1>
    </div>
  );
}

function AuthedShell() {
  const { profile } = useAuth();
  const farmQuery = useFarmSettings(true);
  const { online, pending } = useOnlineSync();
  const location = useLocation();

  if (farmQuery.isLoading || !farmQuery.data || !profile) return <LoadingScreen />;
  const farm = farmQuery.data;
  const role = profile.role;

  return (
    <ThemeProvider theme={farm.theme}>
      <div className="min-h-screen flex" style={{ background: C.bg }}>
        <Sidebar role={role} visibility={farm.visibility} farm={farm} profile={profile} online={online} pending={pending} />

        <div className="flex-1 min-w-0 flex flex-col">
          <MobileHeader farm={farm} role={role} profile={profile} online={online} pending={pending} />
          <DesktopTopBar />

          <main className="flex-1 px-4 lg:px-8 py-1 lg:py-6 pb-24 lg:pb-10 rise" key={location.pathname}>
            <div className="max-w-6xl mx-auto">
              <Routes>
                <Route path="/" element={<HomePage role={role} />} />
                <Route path="/workers" element={<WorkersPage role={role} />} />
                <Route path="/trees" element={<TreesPage role={role} scopedPlots={profile.plots} />} />
                <Route path="/trees/:id" element={<TreeDetailPage role={role} scopedPlots={profile.plots} />} />
                <Route path="/expenses" element={<ExpensesPage role={role} />} />
                <Route path="/sales" element={<SalesPage role={role} />} />
                <Route path="/settings" element={<SettingsPage role={role} farm={farm} />} />
                <Route path="/print-qr" element={<PrintQRPage />} />
                <Route path="/reports" element={<ReportPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>

        <BottomNav role={role} visibility={farm.visibility} />
      </div>
    </ThemeProvider>
  );
}

export default function App() {
  const { loading, session, profile } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <LoginPage />;
  if (profile && !profile.farmId) return <PendingApprovalPage />;

  return (
    <BrowserRouter>
      <AuthedShell />
    </BrowserRouter>
  );
}
