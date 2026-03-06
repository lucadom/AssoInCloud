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
  MessageList: () => <div data-testid="message-list" />,
}));

vi.mock("./pec/message-viewer", () => ({
  MessageViewer: () => <div data-testid="message-viewer" />,
}));

import * as pecApi from "@/lib/api/pec";
const mockFetchFolders = vi.mocked(pecApi.fetchPecFolders);
const mockFetchMessages = vi.mocked(pecApi.fetchPecMessages);
const mockIsPecNotConfigured = vi.mocked(pecApi.isPecNotConfiguredError);

const folders: PecFolder[] = [
  { name: "INBOX", fullName: "INBOX", unreadCount: 2 },
  { name: "Sent", fullName: "Sent", unreadCount: 0 },
];

describe("PecInboxPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchMessages.mockResolvedValue([]);
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
});
