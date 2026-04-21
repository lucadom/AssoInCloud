import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FolderContents } from "../folder-contents";
import { MantineProvider } from "@mantine/core";
import type { Folder, DocumentFile } from "@/types";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

const mockFolders: Folder[] = [
  { path: "Verbali", name: "Verbali", lastModified: "2024-01-01T00:00:00Z" },
];

const mockFiles: DocumentFile[] = [
  { path: "report.pdf", name: "report.pdf", size: 1024, mimeType: "application/pdf", lastModified: "2024-01-01T00:00:00Z" },
];

const defaultProps = {
  path: "",
  folders: [],
  files: [],
  loading: false,
  onNavigate: vi.fn(),
  onRefresh: vi.fn(),
  onCreateFolder: vi.fn(),
  onUploadFiles: vi.fn(),
};

describe("FolderContents", () => {
  it("shows loading spinner when loading", () => {
    render(
      <FolderContents {...defaultProps} loading={true} />,
      { wrapper }
    );
    // Loader component renders - check there's no "Cartella vuota" text
    expect(screen.queryByText(/Cartella vuota/)).toBeNull();
  });

  it("shows empty message when no items", () => {
    render(<FolderContents {...defaultProps} />, { wrapper });
    expect(screen.getByText(/Cartella vuota/)).toBeInTheDocument();
  });

  it("renders folder names", () => {
    render(<FolderContents {...defaultProps} folders={mockFolders} />, { wrapper });
    expect(screen.getByText("Verbali")).toBeInTheDocument();
  });

  it("renders file names", () => {
    render(<FolderContents {...defaultProps} files={mockFiles} />, { wrapper });
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("shows action buttons", () => {
    render(<FolderContents {...defaultProps} />, { wrapper });
    expect(screen.getByText("Nuova cartella")).toBeInTheDocument();
    expect(screen.getByText("Carica file")).toBeInTheDocument();
  });

  it("shows select all when files present", () => {
    render(<FolderContents {...defaultProps} files={mockFiles} />, { wrapper });
    expect(screen.getByText("Seleziona tutti")).toBeInTheDocument();
  });

  it("calls onCreateFolder when button clicked", () => {
    const onCreateFolder = vi.fn();
    render(<FolderContents {...defaultProps} onCreateFolder={onCreateFolder} />, { wrapper });
    screen.getByText("Nuova cartella").click();
    expect(onCreateFolder).toHaveBeenCalled();
  });
});
