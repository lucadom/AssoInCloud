import { getToken, clearToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

/**
 * Wrapper around fetch that automatically adds the Authorization header
 * with the stored bearer token. If a 401 response is received, the token
 * is cleared and the user is redirected to the login page.
 */
export async function authFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Sessione scaduta");
  }

  return res;
}
