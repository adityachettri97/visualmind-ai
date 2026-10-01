import { Capacitor } from "@capacitor/core";

// In production, use the site's origin so the Netlify API proxy keeps auth cookies first-party.
// Native builds use the backend URL because their web assets are served from a local WebView origin.
// In local development, use the backend directly (or a configured VITE_API_URL).
export const API_BASE_URL: string = Capacitor.isNativePlatform()
  ? (import.meta.env.VITE_NATIVE_API_URL ?? "https://visualmind-ai-backend.onrender.com")
  : import.meta.env.PROD
    ? ""
    : (import.meta.env.VITE_API_URL ?? "http://localhost:5000");
