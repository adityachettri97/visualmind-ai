// In production, use the site's origin so the Netlify API proxy keeps auth cookies first-party.
// In local development, use the backend directly (or a configured VITE_API_URL).
export const API_BASE_URL: string = import.meta.env.PROD ? "" : (import.meta.env.VITE_API_URL ?? "http://localhost:5000");
