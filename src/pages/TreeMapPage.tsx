import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTrees } from "@/hooks/useTrees";
import { healthInfo, HEALTH_LEVELS } from "@/lib/constants";
import { ensureLeafletIcons, coloredDivIcon } from "@/lib/leafletSetup";
import { C } from "@/lib/tokens";
import { EmptyState } from "@/components/ui/primitives";
import { MapPin } from "lucide-react";

export function TreeMapPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const enabled = !!profile?.farmId;
  const treesQ = useTrees(enabled);
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const trees = (treesQ.data ?? []).filter((t) => t.lat != null && t.lng != null);

  useEffect(() => {
    if (!ref.current || mapRef.current || trees.length === 0) return;
    ensureLeafletIcons();
    const map = L.map(ref.current).setView([trees[0].lat!, trees[0].lng!], 17);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);

    const markers: L.Marker[] = [];
    for (const t of trees) {
      const marker = L.marker([t.lat!, t.lng!], { icon: coloredDivIcon(healthInfo(t.health).color) }).addTo(map);
      marker.bindPopup(`<b>${t.code}</b><br/>${t.plot ?? ""}<br/>${healthInfo(t.health).label}`);
      marker.on("click", () => navigate(`/trees/${t.id}`));
      markers.push(marker);
    }
    if (markers.length > 1) {
      map.fitBounds(L.featureGroup(markers).getBounds().pad(0.15));
    }
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trees.length]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: C.bg }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ background: C.card, borderBottom: `1px solid ${C.line}` }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-medium" style={{ color: C.greenMid }}><ArrowLeft size={15} /> ត្រឡប់ក្រោយ</button>
        <div className="text-xs font-semibold" style={{ color: C.green }}>ផែនទីចម្ការ ({trees.length} ដើម)</div>
        <div style={{ width: 60 }} />
      </div>

      {trees.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <EmptyState icon={MapPin} title="មិនទាន់មានដើមណាមានទីតាំង GPS ទេ" hint="ចាប់យកទីតាំង GPS ពេលបន្ថែម ឬកែសម្រួលដើមទុរេន ដើម្បីឲ្យបង្ហាញនៅទីនេះ" />
        </div>
      ) : (
        <>
          <div ref={ref} className="flex-1" />
          <div className="flex items-center justify-center gap-3 px-4 py-2 flex-wrap" style={{ background: C.card, borderTop: `1px solid ${C.line}` }}>
            {HEALTH_LEVELS.map((h) => (
              <div key={h.key} className="flex items-center gap-1.5 text-[10.5px]" style={{ color: C.inkSoft }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: h.color }} /> {h.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
