import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { PecInboxPage } from "./pec-inbox-page";
import { TestWrapper } from "@/test-utils";
import type { PecFolder } from "@/types";

vi.mock("@/lib/api/pec", () => ({
  fetchPecFolders: vi.fn(),
  fetchPecMessages: vi.fn(),
  fetchPecMessage: vi.fn(),
  setPecReadStatus: vi.fn(),
  searchPecMessages: vi.fn(),
  isPecNotConfiguredError: vi.fn().mockImplementation((e: unknown) => {
    return e instanceof Error && (e as Error & { notConfigured?: boolean }).notConfigured === true;
  }),
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn() },
}));

vi.mock("./pec/folder-list", () => ({
  FolderList: ({ folders }: { folders: PecFolder[] }) => (
    <div data-testid="folder-list">{folders.length} cartelle</div>
  ),
}));

vi.mock("./pec/message-list", () => ({
  MessageList: ({ hasMore, onLoadMore }: { hasMore?: boolean; onLoadMore?: () => void }) => (
    <div data-testid="message-list">
      {hasMore && <button onClick={onLoadMore}>Carica altri messaggi</button>}
    </div>
  ),
}));

vi.mock("./pec/message-viewer", () => ({
  MessageViewer: () => <div data-testid="message-viewer" />,
}));

import * as pecApi from "@/lib/api/pec";
const mockFetchFolders = vi.mocked(pecApi.fetchPecFolders);
const mockFetchMessages = vi.mocked(pecApi.fetchPecMessages);
const mockSearchMessages = vi.mocked(pecApi.searchPecMessages);
const mockIsPecNotConfigured = vi.mocked(pecApi.isPecNotConfiguredError);

const folders: PecFolder[] = [
  { name: "INBOX", fullName: "INBOX", unreadCount: 2, messageCount: 10 },
  { name: "Sent", fullName: "Sent", unreadCount: 0, messageCount: 5 },
];

describe("PecInboxPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchMessages.mockResolvedValue([]);
    mockSearchMessages.mockResolvedValue([]);
    mockIsPecNotConfiguredError(false);
  });

  function mockIsPecNotConfiguredError(val: boolean) {
    mockIsPecNotConfigured.mockImplementation((e: unknown) => {
      if (!val) return false;
      return e instanceof Error;
    });
  }

  it("should render the page title", async () => {
    mockFetchFolders.mockResolvedValue(folders);
    render(
      <TestWrapper>
        <PecInboxPage />
      </TestWrapper>
    );
    expect(screen.getByText("Casella PEC")).toBeInTheDocument();
  });

  it("should load and display folders", async () => {
    mockFetchFolders.mockResolvedValue(folders);
    render(
      <TestWrapper>
        <PecInboxPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByTestId("folder-list")).toBeInTheDocument();
      expect(screen.getByText("2 cartelle")).toBeInTheDocument();
    });
    expect(mockFetchFolders).toHaveBeenCalled();
  });

  it("should show alert when PEC is not configured", async () => {
    const notConfiguredErr = Object.assign(new Error("PEC non configurata"), {
      notConfigured: true,
    });
    mockFetchFolders.mockRejectedValueOnce(notConfiguredErr);
    mockIsPecNotConfiguredError(true);

    render(
      <TestWrapper>
        <PecInboxPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(
        screen.getByText(/Casella PEC non configurata|PEC non configurata/i)
      ).toBeInTheDocument();
    });
  });

  it("should show error notification on generic load failure", async () => {
    const { notifications } = await import("@mantine/notifications");
    mockFetchFolders.mockRejectedValueOnce(new Error("Network error"));
    render(
      <TestWrapper>
        <PecInboxPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ color: "red" })
      );
    });
  });

  it("should show load more button when a full page is returned", async () => {
    const fullPage = Array.from({ length: 25 }, (_, i) => ({
      uid: i + 1,
      folder: "INBOX",
      from: `mittente${i}@example.com`,
      subject: `Messaggio ${i}`,
      date: "2024-01-01T00:00:00Z",
      read: false,
    }));
    mockFetchFolders.mockResolvedValue(folders);
    mockFetchMessages.mockResolvedValue(fullPage);
    render(
      <TestWrapper>
        <PecInboxPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByText("Carica altri messaggi")).toBeInTheDocument();
    });
  });

  it("should not show load more button when partial page is returned", async () => {
    const partialPage = Array.from({ length: 10 }, (_, i) => ({
      uid: i + 1,
      folder: "INBOX",
      from: `mittente${i}@example.com`,
      subject: `Messaggio ${i}`,
      date: "2024-01-01T00:00:00Z",
      read: false,
    }));
    mockFetchFolders.mockResolvedValue(folders);
    mockFetchMessages.mockResolvedValue(partialPage);
    render(
      <TestWrapper>
        <PecInboxPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByTestId("message-list")).toBeInTheDocument();
    });
    expect(screen.queryByText("Carica altri messaggi")).not.toBeInTheDocument();
  });

  it("should fetch next page when load more is clicked", async () => {
    const { fireEvent } = await import("@testing-library/react");
    const fullPage = Array.from({ length: 25 }, (_, i) => ({
      uid: i + 1,
      folder: "INBOX",
      from: `mittente${i}@example.com`,
      subject: `Messaggio ${i}`,
      date: "2024-01-01T00:00:00Z",
      read: false,
    }));
    mockFetchFolders.mockResolvedValue(folders);
    mockFetchMessages.mockResolvedValueOnce(fullPage).mockResolvedValueOnce([]);
    render(
      <TestWrapper>
        <PecInboxPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByText("Carica altri messaggi")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Carica altri messaggi"));
    await waitFor(() => {
      expect(mockFetchMessages).toHaveBeenCalledWith("INBOX", 1, 25);
    });
  });

  it("should render the search input", async () => {
    mockFetchFolders.mockResolvedValue(folders);
    render(
      <TestWrapper>
        <PecInboxPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/cerca per oggetto/i)).toBeInTheDocument();
    });
  });
});
