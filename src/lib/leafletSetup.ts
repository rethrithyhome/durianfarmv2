import L from "leaflet";

// Leaflet's default marker icon references image paths that don't
// survive bundling. Point them at the CDN copy instead — a one-time
// fix applied wherever a Leaflet map is first created.
let fixed = false;
export function ensureLeafletIcons() {
  if (fixed) return;
  fixed = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

/** A colored circular marker (used to show tree health at a glance on
 * the farm map) instead of the default pin. */
export function coloredDivIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}
