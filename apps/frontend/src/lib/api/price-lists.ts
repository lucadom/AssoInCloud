import type { PriceListItem } from "@/types";
import { authFetch } from "./auth-fetch";

/** Fetch price list for a supplier, optionally filtered by date range */
export async function fetchPriceList(
  supplierId: string,
  from?: string,
  to?: string
): Promise<PriceListItem[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const url = `/price-lists/supplier/${encodeURIComponent(supplierId)}${qs ? `?${qs}` : ""}`;
  const res = await authFetch(url);
  if (!res.ok) throw new Error("Errore nel caricamento del listino");
  return res.json();
}
