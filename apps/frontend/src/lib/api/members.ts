import type { Member, MemberFormData, ImportResult } from "@/types";
import { authFetch } from "./auth-fetch";

/** Fetch all members */
export async function fetchMembers(): Promise<Member[]> {
  const res = await authFetch("/members");
  if (!res.ok) throw new Error("Errore nel caricamento dei soci");
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
  const res = await authFetch("/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Errore nella creazione del socio");
  }
  return res.json();
}

/** Update an existing member */
export async function updateMember(
  id: string,
  data: MemberFormData
): Promise<Member> {
  const res = await authFetch(`/members/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Errore nell'aggiornamento del socio");
  }
  return res.json();
}

/** Delete a member */
export async function deleteMember(id: string): Promise<void> {
  const res = await authFetch(`/members/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Errore nell'eliminazione del socio");
  }
}

/** Upload a CSV file with members to import/update */
export async function uploadMembersCsv(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await authFetch("/members/import-csv", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Errore nell'importazione del CSV");
  }

  return res.json();
}

/** Export members as XLSX */
export async function exportMembersXlsx(): Promise<Blob> {
  const res = await authFetch("/members/export-xlsx", {
    method: "GET",
    headers: {
      Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Errore nell'esportazione dei soci");
  }

  return res.blob();
}
