import type { DateValue } from "@mantine/dates";

/**
 * Converts a Mantine DatePickerInput value (Date | string | null | undefined)
 * to a YYYY-MM-DD string for API payloads.
 *
 * Mantine 8 DatePickerInput may return either a native Date object or a
 * YYYY-MM-DD string (DateStringValue), so both cases must be handled.
 */
export function toDateString(value: DateValue | undefined): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value.split("T")[0];
  return value.toISOString().split("T")[0];
}
