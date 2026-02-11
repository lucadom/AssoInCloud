"use client";

import dayjs from "dayjs";
import "dayjs/locale/it";

dayjs.locale("it");

/**
 * Client-side component that sets dayjs locale globally to Italian.
 * Must be rendered in the component tree before any date pickers.
 */
export function DatesLocaleProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
