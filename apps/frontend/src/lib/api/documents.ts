import type { Folder, FolderContents, DocumentFile, BulkMoveResult } from "@/types";
import { authFetch } from "./auth-fetch";
import { logger } from "../logger";

export async function listContents(path: string = ""): Promise<FolderContents> {
  logger.info("Listing folder contents", { path });
  const res = await authFetch(`/documents/browse?path=${encodeURIComponent(path)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to list folder contents", { status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore nel caricamento dei documenti");
  }
  return res.json();
}

export async function createFolder(path: string, name: string): Promise<Folder> {
  logger.info("Creating folder", { path, name });
  const res = await authFetch("/documents/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to create folder", { status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore nella creazione della cartella");
  }
  return res.json();
}

export async function renameFolder(path: string, name: string): Promise<Folder> {
  logger.info("Renaming folder", { path, name });
  const res = await authFetch("/documents/folders", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to rename folder", { status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore nel rinomino della cartella");
  }
  return res.json();
}

export async function moveFolder(path: string, targetPath: string): Promise<Folder> {
  logger.info("Moving folder", { path, targetPath });
  const res = await authFetch("/documents/folders/move", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, targetPath }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to move folder", { status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore nello spostamento della cartella");
  }
  return res.json();
}

export async function deleteFolder(path: string): Promise<void> {
  logger.info("Deleting folder", { path });
  const res = await authFetch(`/documents/folders?path=${encodeURIComponent(path)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to delete folder", { status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore nell'eliminazione della cartella");
  }
}

export async function downloadFolderZip(path: string): Promise<void> {
  logger.info("Downloading folder as ZIP", { path });
  const res = await authFetch(`/documents/folders/download?path=${encodeURIComponent(path)}`);
  if (!res.ok) {
    logger.error("Failed to download folder ZIP", { status: res.status });
    throw new Error("Errore nel download della cartella");
  }
  const blob = await res.blob();
  const folderName = path ? path.split("/").pop() : "documenti";
  triggerDownload(blob, `${folderName}.zip`);
}

export async function uploadFiles(path: string, files: File[]): Promise<DocumentFile[]> {
  logger.info("Uploading files", { path, count: files.length });
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  const res = await authFetch(`/documents/files?path=${encodeURIComponent(path)}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to upload files", { status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore nel caricamento dei file");
  }
  return res.json();
}

export async function downloadFile(path: string, filename: string): Promise<void> {
  logger.info("Downloading file", { path });
  const res = await authFetch(`/documents/files/download?path=${encodeURIComponent(path)}`);
  if (!res.ok) {
    logger.error("Failed to download file", { status: res.status });
    throw new Error("Errore nel download del file");
  }
  const blob = await res.blob();
  triggerDownload(blob, filename);
}

export async function renameFile(path: string, name: string): Promise<DocumentFile> {
  logger.info("Renaming file", { path, name });
  const res = await authFetch("/documents/files", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to rename file", { status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore nel rinomino del file");
  }
  return res.json();
}

export async function moveFile(path: string, targetPath: string): Promise<DocumentFile> {
  logger.info("Moving file", { path, targetPath });
  const res = await authFetch("/documents/files/move", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, targetPath }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to move file", { status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore nello spostamento del file");
  }
  return res.json();
}

export async function deleteFile(path: string): Promise<void> {
  logger.info("Deleting file", { path });
  const res = await authFetch(`/documents/files?path=${encodeURIComponent(path)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to delete file", { status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore nell'eliminazione del file");
  }
}

export async function bulkDeleteFiles(paths: string[]): Promise<void> {
  logger.info("Bulk deleting files", { count: paths.length });
  const res = await authFetch("/documents/files/bulk-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paths }),
  });
  if (!res.ok) {
    logger.error("Failed to bulk delete files", { status: res.status });
    throw new Error("Errore nell'eliminazione dei file selezionati");
  }
}

export async function bulkMoveFiles(paths: string[], targetPath: string): Promise<BulkMoveResult> {
  logger.info("Bulk moving files", { count: paths.length, targetPath });
  const res = await authFetch("/documents/files/bulk-move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paths, targetPath }),
  });
  if (!res.ok) {
    logger.error("Failed to bulk move files", { status: res.status });
    throw new Error("Errore nello spostamento dei file selezionati");
  }
  return res.json();
}

export async function bulkDownloadFiles(paths: string[]): Promise<void> {
  logger.info("Bulk downloading files", { count: paths.length });
  const res = await authFetch("/documents/files/bulk-download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paths }),
  });
  if (!res.ok) {
    logger.error("Failed to bulk download files", { status: res.status });
    throw new Error("Errore nel download dei file selezionati");
  }
  const blob = await res.blob();
  triggerDownload(blob, "download.zip");
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
