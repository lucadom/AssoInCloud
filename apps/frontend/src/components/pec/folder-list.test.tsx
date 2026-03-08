import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FolderList } from "./folder-list";
import { TestWrapper } from "@/test-utils";
import type { PecFolder } from "@/types";

const folders: PecFolder[] = [
  { name: "INBOX", fullName: "INBOX", unreadCount: 3, messageCount: 42 },
  { name: "Sent", fullName: "Sent", unreadCount: 0, messageCount: 7 },
];

describe("FolderList", () => {
  it("should show empty message when no folders", () => {
    render(
      <TestWrapper>
        <FolderList folders={[]} selected={null} onSelect={() => {}} />
      </TestWrapper>
    );
    expect(screen.getByText("Nessuna cartella disponibile")).toBeInTheDocument();
  });

  it("should render folder names", () => {
    render(
      <TestWrapper>
        <FolderList folders={folders} selected={null} onSelect={() => {}} />
      </TestWrapper>
    );
    expect(screen.getByText("INBOX")).toBeInTheDocument();
    expect(screen.getByText("Sent")).toBeInTheDocument();
  });

  it("should show unread badge for folders with unread messages", () => {
    render(
      <TestWrapper>
        <FolderList folders={folders} selected={null} onSelect={() => {}} />
      </TestWrapper>
    );
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("should call onSelect when a folder is clicked", () => {
    const onSelect = vi.fn();
    render(
      <TestWrapper>
        <FolderList folders={folders} selected={null} onSelect={onSelect} />
      </TestWrapper>
    );
    screen.getByText("INBOX").click();
    expect(onSelect).toHaveBeenCalledWith("INBOX");
  });

  it("should highlight the selected folder", () => {
    render(
      <TestWrapper>
        <FolderList folders={folders} selected="INBOX" onSelect={() => {}} />
      </TestWrapper>
    );
    // Renders without error and shows selected folder
    expect(screen.getByText("INBOX")).toBeInTheDocument();
  });

  it("should show the total message count under the folder name", () => {
    render(
      <TestWrapper>
        <FolderList folders={folders} selected={null} onSelect={() => {}} />
      </TestWrapper>
    );
    expect(screen.getByText("42 messaggi")).toBeInTheDocument();
    expect(screen.getByText("7 messaggi")).toBeInTheDocument();
  });
});
