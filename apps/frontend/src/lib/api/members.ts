import type { Member, MemberFormData, ImportResult } from "@/types";
import { authFetch } from "./auth-fetch";
import { logger } from "../logger";

/** Fetch all members */
export async function fetchMembers(): Promise<Member[]> {
  logger.info("Fetching all members");
  const res = await authFetch("/members");
  if (!res.ok) {
    logger.error("Failed to fetch members", res.status);
    throw new Error("Errore nel caricamento dei soci");
  }
  return res.json();
}

/** Fetch active members (current year) */
export async function fetchActiveMembers(): Promise<Member[]> {
  logger.info("Fetching active members");
  const res = await authFetch("/members/active");
  if (!res.ok) {
    logger.error("Failed to fetch active members", res.status);
    throw new Error("Errore nel caricamento dei soci attivi");
  }
  return res.json();
}

/**  Get a single member by ID */
export async function fetchMember(id: string): Promise<Member> {
  const res = await authFetch(`/members/${id}`);
  if (!res.ok) throw new Error("Socio non trovato");
  return res.json();
}

/** Create a new member */
export async function createMember(data: MemberFormData): Promise<Member> {
  logger.info("Creating member", { fiscalCode: data.fiscalCode });
  const res = await authFetch("/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to create member", { status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore nella creazione del socio");
  }
  return res.json();
}

/** Update an existing member */
export async function updateMember(
  id: string,
  data: MemberFormData
): Promise<Member> {
  logger.info("Updating member", { id });
  const res = await authFetch(`/members/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to update member", { id, status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore nell'aggiornamento del socio");
  }
  return res.json();
}

/** Delete a member */
export async function deleteMember(id: string): Promise<void> {
  logger.info("Deleting member", { id });
  const res = await authFetch(`/members/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to delete member", { id, status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore nell'eliminazione del socio");
  }
}

/** Renew membership for a member for the current year */
export async function renewMembership(id: string): Promise<Member> {
  logger.info("Renewing membership for member", { id });
  const res = await authFetch(`/members/${id}/renew`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to renew membership", { id, status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore durante il rinnovo dell'iscrizione");
  }
  return res.json();
}

/** Upload a CSV file with members to import/update */
export async function uploadMembersCsv(file: File): Promise<ImportResult> {
  logger.info("Uploading members CSV", { filename: file.name });
  const formData = new FormData();
  formData.append("file", file);

  const res = await authFetch("/members/import-csv", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to upload members CSV", { status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore nell'importazione del CSV");
  }

  return res.json();
}

/** Export members as XLSX */
export async function exportMembersXlsx(): Promise<Blob> {
  logger.info("Exporting members as XLSX");
  const res = await authFetch("/members/export-xlsx", {
    method: "GET",
    headers: {
      Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to export members XLSX", { status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore nell'esportazione dei soci");
  }

  return res.blob();
}

/** Export active members as XLSX */
export async function exportActiveMembersXlsx(): Promise<Blob> {
  logger.info("Exporting active members as XLSX");
  const res = await authFetch("/members/export-xlsx-active", {
    method: "GET",
    headers: {
      Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to export active members XLSX", { status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore nell'esportazione dei soci attivi");
  }

  return res.blob();
}
