import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { CsvImportWizard, autoMapHeader, parseCsvHeaders, validateMapping } from "./csv-import-wizard";
import { TestWrapper } from "@/test-utils";
import * as membersApi from "@/lib/api/members";
import type { CsvColumnMapping } from "@/types";

// ---------------------------------------------------------------------------
// Pure helper unit tests (autoMapHeader, parseCsvHeaders, validateMapping)
// ---------------------------------------------------------------------------

describe("autoMapHeader", () => {
  it("maps known Italian headers correctly", () => {
    expect(autoMapHeader("Cognome")).toBe("lastName");
    expect(autoMapHeader("Nome")).toBe("firstName");
    expect(autoMapHeader("Codice fiscale")).toBe("fiscalCode");
    expect(autoMapHeader("Data di nascita")).toBe("birthDate");
    expect(autoMapHeader("Nato a")).toBe("birthPlace");
    expect(autoMapHeader("Residenza")).toBe("address");
    expect(autoMapHeader("Citta")).toBe("city");
    expect(autoMapHeader("Telefono")).toBe("phone");
    expect(autoMapHeader("Data accettazione")).toBe("membershipDate");
  });

  it("returns empty string for unknown headers", () => {
    expect(autoMapHeader("Colonna sconosciuta")).toBe("");
    expect(autoMapHeader("")).toBe("");
  });

  it("is case-insensitive", () => {
    expect(autoMapHeader("COGNOME")).toBe("lastName");
    expect(autoMapHeader("codice fiscale")).toBe("fiscalCode");
  });
});

describe("parseCsvHeaders", () => {
  it("returns headers from first line split by semicolon", () => {
    const text = "Cognome;Nome;Codice fiscale\nRossi;Mario;CF\n";
    expect(parseCsvHeaders(text)).toEqual(["Cognome", "Nome", "Codice fiscale"]);
  });

  it("returns null for empty text", () => {
    expect(parseCsvHeaders("")).toBeNull();
    expect(parseCsvHeaders("   \n")).toBeNull();
  });

  it("trims whitespace from headers", () => {
    const text = " Cognome ; Nome \nRossi;Mario\n";
    expect(parseCsvHeaders(text)).toEqual(["Cognome", "Nome"]);
  });
});

describe("validateMapping", () => {
  const base: CsvColumnMapping[] = [
    { csvHeader: "CF", memberField: "fiscalCode" },
  ];

  it("returns null when fiscalCode is mapped", () => {
    expect(validateMapping(base)).toBeNull();
  });

  it("returns error when fiscalCode is not mapped", () => {
    const mapping: CsvColumnMapping[] = [
      { csvHeader: "CF", memberField: "lastName" },
    ];
    expect(validateMapping(mapping)).toMatch(/codice fiscale/i);
  });

  it("returns null for empty mapping (no fiscalCode)", () => {
    const mapping: CsvColumnMapping[] = [{ csvHeader: "X", memberField: null }];
    expect(validateMapping(mapping)).toMatch(/codice fiscale/i);
  });

  it("returns error when same field is assigned to two columns", () => {
    const mapping: CsvColumnMapping[] = [
      { csvHeader: "CF1", memberField: "fiscalCode" },
      { csvHeader: "CF2", memberField: "fiscalCode" },
    ];
    expect(validateMapping(mapping)).toMatch(/è assegnato a più colonne/i);
  });
});

// ---------------------------------------------------------------------------
// Component rendering tests
// ---------------------------------------------------------------------------

const STANDARD_CSV = "Cognome;Nome;Codice fiscale;Citta\nRossi;Mario;RSSMRA80A01H501U;Roma\n";
const MOCK_PREVIEW = {
  rows: [
    { rowNumber: 1, rowStatus: "new" as const, lastName: "Rossi", firstName: "Mario", fiscalCode: "RSSMRA80A01H501U", birthDate: "", birthPlace: "", address: "", city: "Roma", phone: "", membershipDate: "" },
    { rowNumber: 2, rowStatus: "update" as const, lastName: "Bianchi", firstName: "Luigi", fiscalCode: "BNCLGU85B15F205X", birthDate: "", birthPlace: "", address: "", city: "Milano", phone: "", membershipDate: "" },
    { rowNumber: 3, rowStatus: "skip" as const, lastName: "", firstName: "", fiscalCode: "", birthDate: "", birthPlace: "", address: "", city: "", phone: "", membershipDate: "" },
  ],
  truncated: false,
  totalRows: 3,
};

/** Simulate uploading a file to the Mantine Dropzone's hidden input */
async function simulateFileUpload(file: File) {
  const input = document.querySelector("input[type=file]") as HTMLInputElement;
  Object.defineProperty(input, "files", { value: [file], writable: true, configurable: true });
  await act(async () => {
    fireEvent.change(input);
  });
}

function renderWizard(onClose = vi.fn(), onImported = vi.fn()) {
  return render(
    <CsvImportWizard opened={true} onClose={onClose} onImported={onImported} />,
    { wrapper: TestWrapper }
  );
}

// ---------------------------------------------------------------------------
// Step 1: Renders correctly
// ---------------------------------------------------------------------------

describe("CsvImportWizard – Step 1 (upload)", () => {
  it("renders the wizard title and step labels", () => {
    renderWizard();
    expect(screen.getByText("Importa soci da CSV")).toBeInTheDocument();
    expect(screen.getByText("Carica")).toBeInTheDocument();
    expect(screen.getByText("Mappa colonne")).toBeInTheDocument();
    expect(screen.getByText("Anteprima")).toBeInTheDocument();
  });

  it("renders the dropzone with instructions", () => {
    renderWizard();
    expect(screen.getByText(/Trascina il file CSV/i)).toBeInTheDocument();
  });

  it("calls onClose when Chiudi is clicked", () => {
    const onClose = vi.fn();
    renderWizard(onClose);
    fireEvent.click(screen.getByRole("button", { name: "Chiudi" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows error when file has no valid headers", async () => {
    renderWizard();
    const emptyFile = new File(["   \n"], "empty.csv", { type: "text/csv" });
    await simulateFileUpload(emptyFile);
    await waitFor(() => {
      expect(screen.getByText(/Impossibile leggere le intestazioni/i)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Step 2: Column mapping validation (via "Avanti" button click)
// ---------------------------------------------------------------------------

describe("CsvImportWizard – Step 2 (column mapping)", () => {
  beforeEach(() => {
    vi.spyOn(membersApi, "previewCsvImport").mockResolvedValue(MOCK_PREVIEW);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows column headers after file upload", async () => {
    renderWizard();
    await simulateFileUpload(new File([STANDARD_CSV], "members.csv", { type: "text/csv" }));
    await waitFor(() => {
      // The mapping table renders headers in a <code> element to disambiguate from stepper labels
      const cells = screen.getAllByText("Cognome");
      expect(cells.length).toBeGreaterThan(0);
      expect(screen.getAllByText("Nome").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Codice fiscale").length).toBeGreaterThan(0);
    });
  });

  it("shows validation error when fiscalCode is not mapped", async () => {
    // CSV with unknown headers so auto-map produces no fiscalCode mapping
    const csv = "ColA;ColB\nv1;v2\n";
    renderWizard();
    await simulateFileUpload(new File([csv], "t.csv", { type: "text/csv" }));
    await waitFor(() => screen.getByRole("button", { name: "Avanti" }));
    fireEvent.click(screen.getByRole("button", { name: "Avanti" }));
    await waitFor(() => {
      expect(screen.getByText(/devi mappare almeno una colonna al campo codice fiscale/i)).toBeInTheDocument();
    });
  });

  it("goes back to step 1 when Indietro is clicked", async () => {
    renderWizard();
    await simulateFileUpload(new File([STANDARD_CSV], "members.csv", { type: "text/csv" }));
    await waitFor(() => screen.getByRole("button", { name: "Indietro" }));
    fireEvent.click(screen.getByRole("button", { name: "Indietro" }));
    await waitFor(() => {
      expect(screen.getByText(/Trascina il file CSV/i)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Step 3: Preview + confirm
// ---------------------------------------------------------------------------

describe("CsvImportWizard – Step 3 (preview & confirm)", () => {
  beforeEach(() => {
    vi.spyOn(membersApi, "previewCsvImport").mockResolvedValue(MOCK_PREVIEW);
    vi.spyOn(membersApi, "confirmCsvImport").mockResolvedValue({ imported: 1, updated: 1, skipped: 1 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function goToStep3() {
    const onImported = vi.fn();
    renderWizard(vi.fn(), onImported);
    await simulateFileUpload(new File([STANDARD_CSV], "members.csv", { type: "text/csv" }));
    await waitFor(() => screen.getByRole("button", { name: "Avanti" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Avanti" }));
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Conferma importazione" })).toBeInTheDocument();
    });
    return onImported;
  }

  it("renders preview table with correct status badges", async () => {
    await goToStep3();
    expect(screen.getByText("Nuovo")).toBeInTheDocument();
    expect(screen.getByText("Aggiornamento")).toBeInTheDocument();
    expect(screen.getByText("Saltato")).toBeInTheDocument();
  });

  it("shows correct summary counters", async () => {
    await goToStep3();
    expect(screen.getByText(/1 Nuovi/i)).toBeInTheDocument();
    expect(screen.getByText(/1 Aggiornamenti/i)).toBeInTheDocument();
    expect(screen.getByText(/1 Saltati/i)).toBeInTheDocument();
  });

  it("shows truncation warning when preview is truncated", async () => {
    vi.spyOn(membersApi, "previewCsvImport").mockResolvedValueOnce({
      rows: [],
      truncated: true,
      totalRows: 5100,
    });
    renderWizard();
    await simulateFileUpload(new File([STANDARD_CSV], "members.csv", { type: "text/csv" }));
    await waitFor(() => screen.getByRole("button", { name: "Avanti" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Avanti" }));
    });
    await waitFor(() => {
      // Text may be split across nodes — check by partial text match function
      expect(screen.getByText((content) => content.includes("5100") || content.includes("5.100"))).toBeInTheDocument();
    });
  });

  it("confirm button calls confirmCsvImport", async () => {
    await goToStep3();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Conferma importazione" }));
    });
    await waitFor(() => {
      expect(membersApi.confirmCsvImport).toHaveBeenCalled();
    });
  });

  it("calls onImported after successful confirm", async () => {
    const onImported = await goToStep3();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Conferma importazione" }));
    });
    await waitFor(() => {
      expect(onImported).toHaveBeenCalledOnce();
    });
  });
});
