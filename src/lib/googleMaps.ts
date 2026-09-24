// Loads the official Google Maps JavaScript SDK via a plain <script> tag —
// no third-party map wrapper library, just Google's own SDK, matching the
// same GOOGLE_PLACES_API_KEY the backend already uses for Places lookups.

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

let loadPromise: Promise<typeof google> | null = null;

export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only load in a browser'));
  }
  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not set'));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async`;
    script.async = true;
    script.onload = () => {
      if (window.google?.maps) resolve(window.google);
      else reject(new Error('Google Maps script loaded but window.google.maps is missing'));
    };
    script.onerror = () => reject(new Error('Failed to load the Google Maps script'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
