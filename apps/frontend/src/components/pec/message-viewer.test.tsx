import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageViewer } from "./message-viewer";
import { TestWrapper } from "@/test-utils";
import type { PecMessage } from "@/types";

vi.mock("@/lib/api/pec", () => ({
  fetchPecAttachmentAsInvoice: vi.fn(),
  importPecAttachmentAsInvoice: vi.fn(),
  getPecAttachmentUrl: vi.fn().mockReturnValue("http://localhost/pec/att"),
  getPecAttachmentPreviewUrl: vi.fn().mockReturnValue("http://localhost/pec/preview"),
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn() },
}));

vi.mock("@/components/invoices/invoice-detail-modal", () => ({
  InvoiceDetailModal: () => null,
}));

const baseMessage: PecMessage = {
  uid: 42,
  folder: "INBOX",
  subject: "Test Subject",
  from: "sender@example.com",
  date: "2024-03-01T12:00:00Z",
  read: false,
  bodyText: "Hello world",
  bodyHtml: null,
  attachments: [],
  bustaTransporto: false,
};

describe("MessageViewer", () => {
  const onToggleRead = vi.fn();
  const onToggleEnvelope = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show placeholder when message is null", () => {
    render(
      <TestWrapper>
        <MessageViewer
          message={null}
          envelopeMode={false}
          onToggleRead={onToggleRead}
          onToggleEnvelope={onToggleEnvelope}
        />
      </TestWrapper>
    );
    expect(screen.getByText("Seleziona un messaggio per leggerlo")).toBeInTheDocument();
  });

  it("should render message subject and sender", () => {
    render(
      <TestWrapper>
        <MessageViewer
          message={baseMessage}
          envelopeMode={false}
          onToggleRead={onToggleRead}
          onToggleEnvelope={onToggleEnvelope}
        />
      </TestWrapper>
    );
    expect(screen.getByText("Test Subject")).toBeInTheDocument();
    expect(screen.getByText(/sender@example.com/)).toBeInTheDocument();
  });

  it("should render message body text", () => {
    render(
      <TestWrapper>
        <MessageViewer
          message={baseMessage}
          envelopeMode={false}
          onToggleRead={onToggleRead}
          onToggleEnvelope={onToggleEnvelope}
        />
      </TestWrapper>
    );
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("should render '(nessun contenuto)' when no body", () => {
    const emptyMsg: PecMessage = { ...baseMessage, bodyText: null, bodyHtml: null };
    render(
      <TestWrapper>
        <MessageViewer
          message={emptyMsg}
          envelopeMode={false}
          onToggleRead={onToggleRead}
          onToggleEnvelope={onToggleEnvelope}
        />
      </TestWrapper>
    );
    expect(screen.getByText("(nessun contenuto)")).toBeInTheDocument();
  });

  it("should render '(nessun oggetto)' when subject is empty", () => {
    const noSubjectMsg: PecMessage = { ...baseMessage, subject: "" };
    render(
      <TestWrapper>
        <MessageViewer
          message={noSubjectMsg}
          envelopeMode={false}
          onToggleRead={onToggleRead}
          onToggleEnvelope={onToggleEnvelope}
        />
      </TestWrapper>
    );
    expect(screen.getByText("(nessun oggetto)")).toBeInTheDocument();
  });

  it("should show read/unread toggle button", () => {
    render(
      <TestWrapper>
        <MessageViewer
          message={baseMessage}
          envelopeMode={false}
          onToggleRead={onToggleRead}
          onToggleEnvelope={onToggleEnvelope}
        />
      </TestWrapper>
    );
    // unread message shows "Segna come letta"
    expect(screen.getByText("Segna come letta")).toBeInTheDocument();
  });

  it("should show different label for read messages", () => {
    const readMsg: PecMessage = { ...baseMessage, read: true };
    render(
      <TestWrapper>
        <MessageViewer
          message={readMsg}
          envelopeMode={false}
          onToggleRead={onToggleRead}
          onToggleEnvelope={onToggleEnvelope}
        />
      </TestWrapper>
    );
    expect(screen.getByText("Segna da leggere")).toBeInTheDocument();
  });

  it("should render attachments when present", () => {
    const msgWithAtt: PecMessage = {
      ...baseMessage,
      attachments: [
        { index: 0, filename: "fattura.xml.p7m", contentType: "application/pkcs7-mime" },
        { index: 1, filename: "attachment.pdf", contentType: "application/pdf" },
      ],
    };
    render(
      <TestWrapper>
        <MessageViewer
          message={msgWithAtt}
          envelopeMode={false}
          onToggleRead={onToggleRead}
          onToggleEnvelope={onToggleEnvelope}
        />
      </TestWrapper>
    );
    expect(screen.getByText("fattura.xml.p7m")).toBeInTheDocument();
    expect(screen.getByText("attachment.pdf")).toBeInTheDocument();
  });
});
