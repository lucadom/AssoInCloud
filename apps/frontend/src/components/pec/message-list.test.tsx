import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MessageList } from "./message-list";
import { TestWrapper } from "@/test-utils";
import type { PecMessageSummary } from "@/types";

const messages: PecMessageSummary[] = [
  {
    uid: 1,
    subject: "Fattura n. 1",
    from: "fornitore@example.com",
    date: "2024-01-15T10:00:00Z",
    read: false,
    hasAttachments: true,
  },
  {
    uid: 2,
    subject: "Comunicazione",
    from: "altro@example.com",
    date: "2024-01-10T09:00:00Z",
    read: true,
    hasAttachments: false,
  },
];

describe("MessageList", () => {
  const onSelect = vi.fn();
  const onToggleRead = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show empty message when no messages", () => {
    render(
      <TestWrapper>
        <MessageList
          messages={[]}
          selectedUid={null}
          onSelect={onSelect}
          onToggleRead={onToggleRead}
        />
      </TestWrapper>
    );
    expect(screen.getByText("Nessun messaggio in questa cartella")).toBeInTheDocument();
  });

  it("should render message senders", () => {
    render(
      <TestWrapper>
        <MessageList
          messages={messages}
          selectedUid={null}
          onSelect={onSelect}
          onToggleRead={onToggleRead}
        />
      </TestWrapper>
    );
    expect(screen.getByText("fornitore@example.com")).toBeInTheDocument();
    expect(screen.getByText("altro@example.com")).toBeInTheDocument();
  });

  it("should call onSelect when a message is clicked", () => {
    render(
      <TestWrapper>
        <MessageList
          messages={messages}
          selectedUid={null}
          onSelect={onSelect}
          onToggleRead={onToggleRead}
        />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText("fornitore@example.com"));
    expect(onSelect).toHaveBeenCalledWith(messages[0]);
  });

  it("should show messages with unknown sender as placeholder", () => {
    const msgNoFrom: PecMessageSummary[] = [
      { uid: 3, subject: "Test", from: "", date: "2024-01-01T00:00:00Z", read: false, hasAttachments: false },
    ];
    render(
      <TestWrapper>
        <MessageList
          messages={msgNoFrom}
          selectedUid={null}
          onSelect={onSelect}
          onToggleRead={onToggleRead}
        />
      </TestWrapper>
    );
    expect(screen.getByText("(mittente sconosciuto)")).toBeInTheDocument();
  });
});
