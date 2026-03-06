import { authFetch } from "./auth-fetch";
import { logger } from "../logger";

export interface BackupVersion {
  version: string;
}

/** Returns the current database version based on applied Flyway migrations. */
export async function fetchCurrentVersion(): Promise<BackupVersion> {
  logger.info("Fetching database version");
  const res = await authFetch("/backup/version");
  if (!res.ok) {
    logger.error("Failed to fetch database version", res.status);
    throw new Error("Errore nel recupero della versione del database");
  }
  return res.json();
}

/**
 * Inspects a backup file and returns its Flyway schema version
 * without performing a restore.
 */
export async function inspectBackupFile(file: File): Promise<BackupVersion> {
  logger.info("Inspecting backup file", { filename: file.name });
  const formData = new FormData();
  formData.append("file", file);

  const res = await authFetch("/backup/inspect", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to inspect backup file", { filename: file.name, status: res.status });
    throw new Error(body?.error ?? "Il file non è un database SQLite valido");
  }
  return res.json();
}

/** Downloads the current database as a binary SQLite file. */
export async function downloadBackup(): Promise<void> {
  logger.info("Downloading database backup");
  const res = await authFetch("/backup");
  if (!res.ok) {
    logger.error("Failed to download backup", res.status);
    throw new Error("Errore nel download del backup");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const contentDisposition = res.headers.get("Content-Disposition") ?? "";
  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
  const filename = filenameMatch?.[1] ?? "assoincloud_backup.db";

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Restores the database from an uploaded backup file. */
export async function restoreBackup(file: File): Promise<void> {
  logger.info("Restoring database from backup", { filename: file.name });
  const formData = new FormData();
  formData.append("file", file);

  const res = await authFetch("/backup/restore", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Errore durante il ripristino del database");
  }
}
