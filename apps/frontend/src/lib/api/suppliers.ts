import type { Supplier, SupplierFormData } from "@/types";
import { authFetch } from "./auth-fetch";
import { logger } from "../logger";

/** Fetch all suppliers */
export async function fetchSuppliers(): Promise<Supplier[]> {
  logger.info("Fetching all suppliers");
  const res = await authFetch("/suppliers");
  if (!res.ok) {
    logger.error("Failed to fetch suppliers", res.status);
    throw new Error("Errore nel caricamento dei fornitori");
  }
  return res.json();
}

/** Create a new supplier */
export async function createSupplier(data: SupplierFormData): Promise<Supplier> {
  logger.info("Creating supplier", { name: data.name, vatNumber: data.vatNumber });
  const res = await authFetch("/suppliers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to create supplier", { status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore nella creazione del fornitore");
  }
  return res.json();
}

/** Update an existing supplier */
export async function updateSupplier(
  id: string,
  data: SupplierFormData
): Promise<Supplier> {
  logger.info("Updating supplier", { id });
  const res = await authFetch(`/suppliers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to update supplier", { id, status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore nell'aggiornamento del fornitore");
  }
  return res.json();
}

/** Delete a supplier (fails with 409 if it has invoices) */
export async function deleteSupplier(id: string): Promise<void> {
  logger.info("Deleting supplier", { id });
  const res = await authFetch(`/suppliers/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to delete supplier", { id, status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore nell'eliminazione del fornitore");
  }
}
