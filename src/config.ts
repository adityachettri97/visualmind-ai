// Vite only exposes env vars prefixed VITE_ to client code, and it's undefined (not just falsy)
// when the var isn't set, e.g. in local dev — hence the fallback to the local backend.
export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
