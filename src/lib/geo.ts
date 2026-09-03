export interface GeoPoint { lat: number; lng: number; accuracy: number }

/** Wraps navigator.geolocation in a promise with a sane timeout and
 * Khmer error messages, so callers don't need to touch the raw API. */
export function getCurrentLocation(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("ទូរស័ព្ទ/browser នេះមិនគាំទ្រ GPS ទេ"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) reject(new Error("សូមអនុញ្ញាតសិទ្ធិចូលទីតាំង (Location) ក្នុង browser"));
        else if (err.code === err.TIMEOUT) reject(new Error("ចាប់យកទីតាំងយូរពេក សូមព្យាយាមម្តងទៀត"));
        else reject(new Error("មិនអាចចាប់យកទីតាំងបានទេ"));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export function googleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
