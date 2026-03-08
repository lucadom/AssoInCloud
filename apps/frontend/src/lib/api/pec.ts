import type { Invoice, PecFolder, PecMessage, PecMessageSummary } from "@/types";
import { getToken } from "./auth";
import { authFetch } from "./auth-fetch";
import { logger } from "../logger";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

export type PecNotConfiguredError = Error & { notConfigured: true };

function isPecNotConfiguredError(err: unknown): err is PecNotConfiguredError {
  return err instanceof Error && (err as PecNotConfiguredError).notConfigured === true;
}

export { isPecNotConfiguredError };

/** Fetch all available IMAP folders for the configured PEC account. */
export async function fetchPecFolders(): Promise<PecFolder[]> {
  logger.info("Fetching PEC folders");
  const res = await authFetch("/pec/folders");
  if (res.status === 404) {
    logger.warn("PEC access not configured");
    const body = await res.json().catch(() => null);
    const err = new Error(
      body?.error ?? "Accesso alla casella PEC non configurato"
    ) as PecNotConfiguredError;
    err.notConfigured = true;
    throw err;
  }
  if (!res.ok) {
    logger.error("Failed to fetch PEC folders", res.status);
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
  logger.info("Fetching PEC messages", { folder, page, size });
  const params = new URLSearchParams({
    folder,
    page: String(page),
    size: String(size),
  });
  const res = await authFetch(`/pec/messages?${params}`);
  if (!res.ok) {
    logger.error("Failed to fetch PEC messages", { folder, status: res.status });
    throw new Error("Errore nel caricamento dei messaggi");
  }
  return res.json();
}

/** Search messages in a folder by subject, sender, or body text. */
export async function searchPecMessages(
  folder: string,
  query: string
): Promise<PecMessageSummary[]> {
  logger.info("Searching PEC messages", { folder, query });
  const params = new URLSearchParams({ folder, query });
  const res = await authFetch(`/pec/messages/search?${params}`);
  if (!res.ok) {
    logger.error("Failed to search PEC messages", { folder, status: res.status });
    throw new Error("Errore nella ricerca dei messaggi");
  }
  return res.json();
}

/** Fetch the full content of a single message. Pass envelope=true to view the raw PEC transport envelope instead of the extracted inner message. */
export async function fetchPecMessage(
  folder: string,
  uid: number,
  envelope = false
): Promise<PecMessage> {
  logger.info("Fetching PEC message", { folder, uid });
  const params = new URLSearchParams({ folder });
  if (envelope) params.set("envelope", "true");
  const res = await authFetch(`/pec/messages/${uid}?${params}`);
  if (!res.ok) {
    logger.error("Failed to fetch PEC message", { folder, uid, status: res.status });
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
  logger.info("Setting PEC message read status", { folder, uid, read });
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
    logger.error("Failed to set PEC message read status", { folder, uid, status: res.status });
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
  partIndex: number,
  envelope = false
): string {
  const token = getToken();
  const params = new URLSearchParams({ folder });
  if (token) params.set("token", token);
  if (envelope) params.set("envelope", "true");
  return `${API_BASE}/pec/attachments/${uid}/${partIndex}?${params}`;
}

/** Same as getPecAttachmentUrl but sets inline=true so the browser displays instead of downloading. */
export function getPecAttachmentPreviewUrl(
  folder: string,
  uid: number,
  partIndex: number,
  envelope = false
): string {
  const token = getToken();
  const params = new URLSearchParams({ folder, inline: "true" });
  if (token) params.set("token", token);
  if (envelope) params.set("envelope", "true");
  return `${API_BASE}/pec/attachments/${uid}/${partIndex}?${params}`;
}

/** Parse a PEC attachment (XML or P7M) as a FatturaPA invoice preview (not saved to DB). */
export async function fetchPecAttachmentAsInvoice(
  folder: string,
  uid: number,
  partIndex: number,
  envelope = false
): Promise<Invoice> {
  const params = new URLSearchParams({ folder });
  if (envelope) params.set("envelope", "true");
  const res = await authFetch(`/pec/attachments/${uid}/${partIndex}/preview-as-invoice?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Impossibile analizzare il file come fattura");
  }
  return res.json();
}

/** Import a PEC attachment (P7M) as a fattura, saving it to the database. */
export async function importPecAttachmentAsInvoice(
  folder: string,
  uid: number,
  partIndex: number,
  envelope = false
): Promise<{ imported: number; updated: number; skipped: number }> {
  logger.info("Importing PEC attachment as invoice", { folder, uid, partIndex });
  const params = new URLSearchParams({ folder });
  if (envelope) params.set("envelope", "true");
  const res = await authFetch(
    `/pec/attachments/${uid}/${partIndex}/import-as-invoice?${params}`,
    { method: "POST" }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Impossibile importare la fattura");
  }
  return res.json();
}
