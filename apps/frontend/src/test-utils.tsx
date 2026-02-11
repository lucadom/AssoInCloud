import React from "react";
import { MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import dayjs from "dayjs";
import "dayjs/locale/it";

dayjs.locale("it");

/**
 * Wrapper component that provides Mantine context for tests.
 */
export function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider>
      <DatesProvider settings={{ locale: "it" }}>
        {children}
      </DatesProvider>
    </MantineProvider>
  );
}
