import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { FolderTree } from "../folder-tree";
import { MantineProvider } from "@mantine/core";

vi.mock("@/lib/api/documents", () => ({
  listContents: vi.fn().mockResolvedValue({
    folders: [
      { path: "Verbali", name: "Verbali", lastModified: "2024-01-01T00:00:00Z" },
    ],
    files: [],
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe("FolderTree", () => {
  it("renders root Documenti link", () => {
    render(<FolderTree currentPath="" onNavigate={vi.fn()} />, { wrapper });
    expect(screen.getByText("Documenti")).toBeInTheDocument();
  });

  it("renders root folders from API", async () => {
    render(<FolderTree currentPath="" onNavigate={vi.fn()} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("Verbali")).toBeInTheDocument();
    });
  });

  it("calls onNavigate when root clicked", () => {
    const onNavigate = vi.fn();
    render(<FolderTree currentPath="Verbali" onNavigate={onNavigate} />, { wrapper });
    screen.getByText("Documenti").click();
    expect(onNavigate).toHaveBeenCalledWith("");
  });
});
