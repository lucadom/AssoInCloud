import type { PriceListItem } from "@/types";
import { authFetch } from "./auth-fetch";
import { logger } from "../logger";

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
  logger.info("Fetching price list", { supplierId, from, to });
  const res = await authFetch(url);
  if (!res.ok) {
    logger.error("Failed to fetch price list", { status: res.status });
    throw new Error("Errore nel caricamento del listino");
  }
  return res.json();
}

/** Export price list as Excel (.xlsx) for a supplier, optionally filtered by date range */
export async function exportPriceListXlsx(
  supplierId: string,
  from?: string,
  to?: string
): Promise<void> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const url = `/price-lists/supplier/${encodeURIComponent(supplierId)}/export-xlsx${qs ? `?${qs}` : ""}`;
  logger.info("Exporting price list as XLSX", { supplierId, from, to });
  const res = await authFetch(url);
  if (!res.ok) {
    logger.error("Failed to export price list XLSX", { status: res.status });
    throw new Error("Errore nell'esportazione del listino in Excel");
  }
  const blob = await res.blob();
  triggerDownload(blob, buildFilename(supplierId, "xlsx"));
}

/** Export price list as PDF for a supplier, optionally filtered by date range */
export async function exportPriceListPdf(
  supplierId: string,
  from?: string,
  to?: string
): Promise<void> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const url = `/price-lists/supplier/${encodeURIComponent(supplierId)}/export-pdf${qs ? `?${qs}` : ""}`;
  logger.info("Exporting price list as PDF", { supplierId, from, to });
  const res = await authFetch(url);
  if (!res.ok) {
    logger.error("Failed to export price list PDF", { status: res.status });
    throw new Error("Errore nell'esportazione del listino in PDF");
  }
  const blob = await res.blob();
  triggerDownload(blob, buildFilename(supplierId, "pdf"));
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildFilename(supplierId: string, ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `listino_${supplierId}_${date}.${ext}`;
}
