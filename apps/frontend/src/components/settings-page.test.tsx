import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { SettingsPage } from "./settings-page";
import { TestWrapper } from "@/test-utils";

// Mock the backup API module
vi.mock("@/lib/api/backup", () => ({
  inspectBackupFile: vi.fn(),
  downloadBackup: vi.fn(),
  restoreBackup: vi.fn(),
}));

// Mock notifications
vi.mock("@mantine/notifications", () => ({
  notifications: {
    show: vi.fn(),
  },
}));

import * as api from "@/lib/api/backup";
import { notifications } from "@mantine/notifications";

const mockInspectBackupFile = vi.mocked(api.inspectBackupFile);
const mockDownloadBackup = vi.mocked(api.downloadBackup);
const mockRestoreBackup = vi.mocked(api.restoreBackup);
const mockNotificationsShow = vi.mocked(notifications.show);

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDownloadBackup.mockResolvedValue(undefined);
    mockRestoreBackup.mockResolvedValue(undefined);
  });

  it("should render the page title", () => {
    render(
      <TestWrapper>
        <SettingsPage dbVersion="3" />
      </TestWrapper>
    );
    expect(screen.getByText("Impostazioni")).toBeInTheDocument();
  });

  it("should render backup and restore sections", () => {
    render(
      <TestWrapper>
        <SettingsPage dbVersion="3" />
      </TestWrapper>
    );
    expect(screen.getByText("Backup dei dati")).toBeInTheDocument();
    expect(screen.getByText("Ripristino dei dati")).toBeInTheDocument();
  });

  it("should render the download backup button", () => {
    render(
      <TestWrapper>
        <SettingsPage dbVersion="3" />
      </TestWrapper>
    );
    expect(screen.getByText("Scarica backup")).toBeInTheDocument();
  });

  it("should call downloadBackup when the download button is clicked", async () => {
    render(
      <TestWrapper>
        <SettingsPage dbVersion="3" />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText("Scarica backup"));
    await waitFor(() => {
      expect(mockDownloadBackup).toHaveBeenCalledTimes(1);
    });
  });

  it("should show error notification when download fails", async () => {
    mockDownloadBackup.mockRejectedValue(new Error("fail"));
    render(
      <TestWrapper>
        <SettingsPage dbVersion="3" />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText("Scarica backup"));
    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Errore", color: "red" })
      );
    });
  });

  it("should call inspectBackupFile when a file is selected", async () => {
    mockInspectBackupFile.mockResolvedValue({ version: "3" });
    const { container } = render(
      <TestWrapper>
        <SettingsPage dbVersion="3" />
      </TestWrapper>
    );

    const fileInput = container.querySelector("input[type='file']") as HTMLInputElement;
    const file = new File(["SQLite format 3\x00"], "backup.db", { type: "application/octet-stream" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockInspectBackupFile).toHaveBeenCalledWith(file);
    });
  });

  it("should show the file version badge after successful file inspection", async () => {
    mockInspectBackupFile.mockResolvedValue({ version: "3" });
    const { container } = render(
      <TestWrapper>
        <SettingsPage dbVersion="3" />
      </TestWrapper>
    );

    const fileInput = container.querySelector("input[type='file']") as HTMLInputElement;
    const file = new File(["SQLite format 3\x00"], "backup.db", { type: "application/octet-stream" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      // The file version badge appears after inspection
      expect(screen.getByText("v3")).toBeInTheDocument();
    });
  });

  it("should show error text when file inspection fails", async () => {
    mockInspectBackupFile.mockRejectedValue(new Error("Il file non è un database SQLite valido"));
    const { container } = render(
      <TestWrapper>
        <SettingsPage dbVersion="3" />
      </TestWrapper>
    );

    const fileInput = container.querySelector("input[type='file']") as HTMLInputElement;
    const file = new File(["not sqlite"], "bad.db", { type: "application/octet-stream" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Il file non è un database SQLite valido")).toBeInTheDocument();
    });
  });

  it("should open confirmation modal with version mismatch warning when versions differ", async () => {
    // Current version is 3, file version is 2
    mockInspectBackupFile.mockResolvedValue({ version: "2" });
    const { container } = render(
      <TestWrapper>
        <SettingsPage dbVersion="3" />
      </TestWrapper>
    );

    // Select file with version 2
    const fileInput = container.querySelector("input[type='file']") as HTMLInputElement;
    const file = new File(["SQLite format 3\x00"], "old_backup.db", { type: "application/octet-stream" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for the inspect to resolve and file version badge to appear
    await waitFor(() => expect(screen.getAllByText(/v2/)).not.toHaveLength(0));

    // Click "Ripristina da file" button (now enabled) and open modal
    fireEvent.click(screen.getByRole("button", { name: /ripristina da file/i }));

    // The modal should show the version mismatch warning
    await waitFor(() => {
      expect(screen.getByText("Versione diversa")).toBeInTheDocument();
    });
  });

  it("should open confirmation modal without version warning when versions match", async () => {
    // Current version is 3, file version is also 3
    mockInspectBackupFile.mockResolvedValue({ version: "3" });
    const { container } = render(
      <TestWrapper>
        <SettingsPage dbVersion="3" />
      </TestWrapper>
    );

    // Select file with version 3
    const fileInput = container.querySelector("input[type='file']") as HTMLInputElement;
    const file = new File(["SQLite format 3\x00"], "backup.db", { type: "application/octet-stream" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for the inspect to resolve: file version badge appears
    await waitFor(() => expect(screen.getByText("v3")).toBeInTheDocument());

    // Click "Ripristina da file" button (now enabled)
    fireEvent.click(screen.getByRole("button", { name: /ripristina da file/i }));

    // The modal should NOT show version mismatch warning
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.queryByText("Versione diversa")).not.toBeInTheDocument();
    });
  });

  it("should call restoreBackup and show success notification on confirm", async () => {
    mockInspectBackupFile.mockResolvedValue({ version: "3" });
    const { container } = render(
      <TestWrapper>
        <SettingsPage dbVersion="3" />
      </TestWrapper>
    );

    const fileInput = container.querySelector("input[type='file']") as HTMLInputElement;
    const file = new File(["SQLite format 3\x00"], "backup.db", { type: "application/octet-stream" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for inspect to resolve
    await waitFor(() => expect(screen.getByText("v3")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /ripristina da file/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Conferma ripristino" }));

    await waitFor(() => {
      expect(mockRestoreBackup).toHaveBeenCalledWith(file);
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Ripristino completato", color: "green" })
      );
    });
  });

  it("should show error notification when restore fails", async () => {
    mockInspectBackupFile.mockResolvedValue({ version: "3" });
    mockRestoreBackup.mockRejectedValue(new Error("Errore durante il ripristino del database"));

    const { container } = render(
      <TestWrapper>
        <SettingsPage dbVersion="3" />
      </TestWrapper>
    );

    const fileInput = container.querySelector("input[type='file']") as HTMLInputElement;
    const file = new File(["SQLite format 3\x00"], "backup.db", { type: "application/octet-stream" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for inspect to resolve
    await waitFor(() => expect(screen.getByText("v3")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /ripristina da file/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Conferma ripristino" }));

    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Errore", color: "red" })
      );
    });
  });
});
