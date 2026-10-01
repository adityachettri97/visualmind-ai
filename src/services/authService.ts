import { API_BASE_URL } from "../config";

const API_BASE = `${API_BASE_URL}/api/auth`;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  region: string;
  lastLoginCountry?: string | null;
  lastLoginAt?: string | null;
}

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error(`Can't reach the backend at ${API_BASE}. Is the server running? (cd server && npm start)`);
  }

  if (!response.ok) {
    const errorBody: { error?: string } | null = await response.json().catch(() => null);

    throw new Error(errorBody?.error ?? `Request failed (HTTP ${response.status}).`);
  }

  return response.json();
}

export async function signup(email: string, password: string, region: string, name?: string): Promise<AuthUser> {
  const result = await authFetch<{ user: AuthUser }>("/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name, region }),
  });

  return result.user;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const result = await authFetch<{ user: AuthUser }>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return result.user;
}

export async function logout(): Promise<void> {
  await authFetch("/logout", { method: "POST" });
}

export async function deleteAccount(currentPassword: string, confirmation: string): Promise<void> {
  await authFetch("/account", {
    method: "DELETE",
    body: JSON.stringify({ currentPassword, confirmation }),
  });
}

/** Returns the signed-in user from the session cookie, or null if not signed in / cookie expired. */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const result = await authFetch<{ user: AuthUser }>("/me", { signal: AbortSignal.timeout(60_000) });

    return result.user;
  } catch {
    return null;
  }
}

/**
 * Requests a password reset. There's no email service wired up yet, so — dev-mode only — the
 * backend hands the reset token straight back in the response instead of emailing it; the return
 * value is undefined once real email delivery replaces this.
 */
export async function forgotPassword(email: string): Promise<{ resetToken?: string }> {
  return authFetch<{ resetToken?: string }>("/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string): Promise<AuthUser> {
  const result = await authFetch<{ user: AuthUser }>("/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });

  return result.user;
}
