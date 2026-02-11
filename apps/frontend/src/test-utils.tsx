import React from "react";
import { MantineProvider } from "@mantine/core";

/**
 * Wrapper component that provides Mantine context for tests.
 */
export function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}
