/**
 * Application logger for the frontend.
 *
 * Conventions:
 *  - logger.info  — main operations (data fetching, mutations, imports)
 *  - logger.warn  — recoverable issues (missing config, business-rule rejections)
 *  - logger.error — unexpected failures caught in API calls
 *  - logger.debug — verbose detail useful only during development
 *
 * In production builds (NODE_ENV === "production") debug and info messages are
 * suppressed, while warn and error always appear.
 *
 * Keep logs up to date: add a new log entry for every new feature that performs
 * data fetching, mutation, or import/export. Remove logs that no longer match
 * the current behaviour.
 */

const isDev = process.env.NODE_ENV !== "production";

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (isDev) console.info(`[INFO] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    if (isDev) console.debug(`[DEBUG] ${message}`, ...args);
  },
};
