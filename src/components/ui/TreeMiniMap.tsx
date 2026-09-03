import { useEffect, useRef } from "react";
import L from "leaflet";
import { ensureLeafletIcons } from "@/lib/leafletSetup";

export function TreeMiniMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    ensureLeafletIcons();
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: false, attributionControl: false }).setView([lat, lng], 18);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    L.marker([lat, lng]).addTo(map).bindPopup(label);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  return <div ref={ref} className="w-full h-40 rounded-xl overflow-hidden" style={{ background: "#eee" }} />;
}
