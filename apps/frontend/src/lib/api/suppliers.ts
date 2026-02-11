import type { Supplier, SupplierFormData } from "@/types";
import { authFetch } from "./auth-fetch";

/** Fetch all suppliers */
export async function fetchSuppliers(): Promise<Supplier[]> {
  const res = await authFetch("/suppliers");
  if (!res.ok) throw new Error("Errore nel caricamento dei fornitori");
  return res.json();
}

/** Create a new supplier */
export async function createSupplier(data: SupplierFormData): Promise<Supplier> {
  const res = await authFetch("/suppliers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Errore nella creazione del fornitore");
  }
  return res.json();
}

/** Update an existing supplier */
export async function updateSupplier(
  id: string,
  data: SupplierFormData
): Promise<Supplier> {
  const res = await authFetch(`/suppliers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Errore nell'aggiornamento del fornitore");
  }
  return res.json();
}

/** Delete a supplier (fails with 409 if it has invoices) */
export async function deleteSupplier(id: string): Promise<void> {
  const res = await authFetch(`/suppliers/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Errore nell'eliminazione del fornitore");
  }
}
