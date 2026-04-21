import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DocumentsPage } from "../documents-page";
import { MantineProvider } from "@mantine/core";

vi.mock("@/lib/api/documents", () => ({
  listContents: vi.fn().mockResolvedValue({ folders: [], files: [] }),
  createFolder: vi.fn().mockResolvedValue({ path: "Test", name: "Test", lastModified: "" }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe("DocumentsPage", () => {
  it("renders page title", () => {
    render(<DocumentsPage />, { wrapper });
    expect(screen.getAllByText("Documenti").length).toBeGreaterThan(0);
  });

  it("calls listContents on mount", async () => {
    const { listContents } = await import("@/lib/api/documents");
    render(<DocumentsPage />, { wrapper });
    await waitFor(() => {
      expect(listContents).toHaveBeenCalledWith("");
    });
  });
});
