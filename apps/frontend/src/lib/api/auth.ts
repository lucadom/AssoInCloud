const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

const TOKEN_KEY = "assoincloud_token";

/** Store the auth token in localStorage */
export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
    // Also set a cookie so the Next.js middleware can read it
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
  }
}

/** Retrieve the stored auth token */
export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

/** Remove the auth token (logout) */
export function clearToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
  }
}

/** Check whether auth is enabled on the backend */
export async function fetchAuthStatus(): Promise<{ authEnabled: boolean }> {
  const res = await fetch(`${API_BASE}/auth/status`);
  if (!res.ok) throw new Error("Errore nel controllo dello stato di autenticazione");
  return res.json();
}

/** Submit password and receive a token */
export async function login(password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (res.status === 401) {
    throw new Error("Password non valida");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Errore durante il login");
  }
  const data = await res.json();
  setToken(data.token);
  return data.token;
}

/** Logout: invalidate token on backend and clear local storage */
export async function logout(): Promise<void> {
  const token = getToken();
  if (token) {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => {});
  }
  clearToken();
}
