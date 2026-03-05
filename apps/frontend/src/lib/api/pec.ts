import type { PecFolder, PecMessage, PecMessageSummary } from "@/types";
import { getToken } from "./auth";
import { authFetch } from "./auth-fetch";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

export type PecNotConfiguredError = Error & { notConfigured: true };

function isPecNotConfiguredError(err: unknown): err is PecNotConfiguredError {
  return err instanceof Error && (err as PecNotConfiguredError).notConfigured === true;
}

export { isPecNotConfiguredError };

/** Fetch all available IMAP folders for the configured PEC account. */
export async function fetchPecFolders(): Promise<PecFolder[]> {
  const res = await authFetch("/pec/folders");
  if (res.status === 404) {
    const body = await res.json().catch(() => null);
    const err = new Error(
      body?.error ?? "Accesso alla casella PEC non configurato"
    ) as PecNotConfiguredError;
    err.notConfigured = true;
    throw err;
  }
  if (!res.ok) {
    throw new Error("Errore nel caricamento delle cartelle PEC");
  }
  return res.json();
}

/** Fetch a page of message summaries for the given folder. */
export async function fetchPecMessages(
  folder: string,
  page = 0,
  size = 25
): Promise<PecMessageSummary[]> {
  const params = new URLSearchParams({
    folder,
    page: String(page),
    size: String(size),
  });
  const res = await authFetch(`/pec/messages?${params}`);
  if (!res.ok) {
    throw new Error("Errore nel caricamento dei messaggi");
  }
  return res.json();
}

/** Fetch the full content of a single message (marks it as read on the server). */
export async function fetchPecMessage(
  folder: string,
  uid: number
): Promise<PecMessage> {
  const res = await authFetch(
    `/pec/messages/${uid}?folder=${encodeURIComponent(folder)}`
  );
  if (!res.ok) {
    throw new Error("Errore nel caricamento del messaggio");
  }
  return res.json();
}

/** Set or clear the read (\Seen) flag on a message. */
export async function setPecReadStatus(
  folder: string,
  uid: number,
  read: boolean
): Promise<void> {
  const res = await authFetch(
    `/pec/messages/${uid}?folder=${encodeURIComponent(folder)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read }),
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Errore nell'aggiornamento dello stato");
  }
}

/**
 * Build a direct download URL for an attachment.
 * Uses the ?token= query parameter so the browser can follow the link
 * without a custom fetch (enabling native file download).
 */
export function getPecAttachmentUrl(
  folder: string,
  uid: number,
  partIndex: number
): string {
  const token = getToken();
  const params = new URLSearchParams({ folder });
  if (token) {
    params.set("token", token);
  }
  return `${API_BASE}/pec/attachments/${uid}/${partIndex}?${params}`;
}
