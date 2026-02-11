import type { Invoice, InvoiceFormData, ImportResult } from "@/types";
import { authFetch } from "./auth-fetch";
import { getToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

/** Fetch all invoices */
export async function fetchInvoices(): Promise<Invoice[]> {
  const res = await authFetch("/invoices");
  if (!res.ok) throw new Error("Errore nel caricamento delle fatture");
  return res.json();
}

/** Fetch a single invoice by ID */
export async function fetchInvoice(id: string): Promise<Invoice> {
  const res = await authFetch(`/invoices/${id}`);
  if (!res.ok) throw new Error("Fattura non trovata");
  return res.json();
}

/** Create a new invoice */
export async function createInvoice(data: InvoiceFormData): Promise<Invoice> {
  const res = await authFetch("/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Errore nella creazione della fattura");
  return res.json();
}

/** Update an existing invoice */
export async function updateInvoice(
  id: string,
  data: InvoiceFormData
): Promise<Invoice> {
  const res = await authFetch(`/invoices/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Errore nell'aggiornamento della fattura");
  return res.json();
}

/** Delete an invoice */
export async function deleteInvoice(id: string): Promise<void> {
  const res = await authFetch(`/invoices/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Errore nell'eliminazione della fattura");
}

/** Upload one or more CSV files of invoices */
export async function uploadCsv(files: File[]): Promise<ImportResult> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  const res = await authFetch("/invoices/upload/csv", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Errore nel caricamento del CSV");
  return res.json();
}

/** Upload one or more XML/P7M invoice files */
export async function uploadInvoiceFiles(files: File[]): Promise<ImportResult> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  const res = await authFetch("/invoices/upload/invoice", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Errore nel caricamento delle fatture");
  return res.json();
}

/** Get the URL for downloading/previewing an attachment (includes auth token) */
export function getAttachmentUrl(invoiceId: string, attachmentId: string): string {
  const token = getToken();
  const base = `${API_BASE}/invoices/${invoiceId}/attachments/${attachmentId}`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}
