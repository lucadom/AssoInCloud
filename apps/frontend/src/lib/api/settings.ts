import { authFetch } from "./auth-fetch";
import { logger } from "../logger";

export interface PecConfig {
  host: string;
  port: number;
  username: string;
  /** Always empty in GET responses; provide a value to set/change the password. */
  password: string;
  ssl: boolean;
  sslTrustAll: boolean;
  /** True when a password has been saved in the database. */
  passwordSet: boolean;
}

/** Fetches the current PEC configuration from the database. */
export async function fetchPecConfig(): Promise<PecConfig> {
  logger.info("Fetching PEC configuration");
  const res = await authFetch("/settings/pec");
  if (!res.ok) {
    logger.error("Failed to fetch PEC configuration", res.status);
    throw new Error("Errore nel caricamento della configurazione PEC");
  }
  return res.json();
}

/**
 * Saves PEC configuration. If `password` is empty, the existing password is preserved.
 * Returns the updated configuration.
 */
export async function savePecConfig(config: PecConfig): Promise<PecConfig> {
  logger.info("Saving PEC configuration", { host: config.host, port: config.port });
  const res = await authFetch("/settings/pec", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    logger.error("Failed to save PEC configuration", { status: res.status, error: body?.error });
    throw new Error(body?.error ?? "Errore nel salvataggio della configurazione PEC");
  }
  return res.json();
}
