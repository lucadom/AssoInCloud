import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InvoiceUploadModal } from "./invoice-upload-modal";
import { TestWrapper } from "@/test-utils";

describe("InvoiceUploadModal", () => {
  const onClose = vi.fn();
  const onUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render content when closed", () => {
    render(
      <TestWrapper>
        <InvoiceUploadModal opened={false} onClose={onClose} onUpload={onUpload} />
      </TestWrapper>
    );
    expect(screen.queryByText("Carica Fattura")).not.toBeInTheDocument();
  });

  it("should render title and description when opened", () => {
    render(
      <TestWrapper>
        <InvoiceUploadModal opened={true} onClose={onClose} onUpload={onUpload} />
      </TestWrapper>
    );
    expect(screen.getByText("Carica Fattura")).toBeInTheDocument();
    expect(screen.getByText(/Carica uno o più file fattura in formato XML o P7M/)).toBeInTheDocument();
  });

  it("should render dropzone text", () => {
    render(
      <TestWrapper>
        <InvoiceUploadModal opened={true} onClose={onClose} onUpload={onUpload} />
      </TestWrapper>
    );
    expect(screen.getByText(/Trascina qui i file XML\/P7M/)).toBeInTheDocument();
    expect(screen.getByText(/Sono accettati uno o più file in formato XML e P7M/)).toBeInTheDocument();
  });

  it("should render buttons", () => {
    render(
      <TestWrapper>
        <InvoiceUploadModal opened={true} onClose={onClose} onUpload={onUpload} />
      </TestWrapper>
    );
    expect(screen.getByText("Annulla")).toBeInTheDocument();
    expect(screen.getByText("Seleziona file")).toBeInTheDocument();
  });

  it("should call onClose when clicking Annulla", () => {
    render(
      <TestWrapper>
        <InvoiceUploadModal opened={true} onClose={onClose} onUpload={onUpload} />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText("Annulla"));
    expect(onClose).toHaveBeenCalled();
  });

  it("should show loading state", () => {
    render(
      <TestWrapper>
        <InvoiceUploadModal opened={true} onClose={onClose} onUpload={onUpload} loading={true} />
      </TestWrapper>
    );
    const button = screen.getByText("Seleziona file").closest("button");
    expect(button).toHaveAttribute("data-loading");
  });
});
