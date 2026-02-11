import type { ProductSearchResult } from "@/types";
import { authFetch } from "./auth-fetch";

/** Search products (invoice line items) by description */
export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  const res = await authFetch(
    `/products/search?q=${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error("Errore nella ricerca dei prodotti");
  return res.json();
}
