import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClosingPage } from "./closing-page";
import { TestWrapper } from "@/test-utils";

const moneyInputs = [
  ["Incasso bar", "100"],
  ["Incasso tabacchi", "50"],
  ["POS", "10"],
  ["Spese contanti", "20"],
  ["Spese tabacchi", "5"],
] as const;

const cashInputs = [
  ["Pezzi da 100 €", "1"],
  ["Pezzi da 20 €", "1"],
] as const;

function renderClosingPage() {
  return render(
    <TestWrapper>
      <ClosingPage />
    </TestWrapper>
  );
}

function enterAmounts(
  amounts: readonly (readonly [string, string])[] = moneyInputs,
  cash: readonly (readonly [string, string])[] = cashInputs
) {
  for (const [label, value] of amounts) {
    fireEvent.change(screen.getByRole("textbox", { name: label }), { target: { value } });
  }
  for (const [label, value] of cash) {
    fireEvent.change(screen.getByRole("textbox", { name: label }), { target: { value } });
  }
}

function getDisplayedResults() {
  return Array.from(
    screen.getByRole("region", { name: "Riepilogo calcoli" }).querySelectorAll("p[data-size='lg']"),
    (result) => result.textContent
  );
}

describe("ClosingPage", () => {
  it("groups inputs into Incassi, Spese, and Contanti effettivi boxes", () => {
    renderClosingPage();

    expect(screen.getByRole("heading", { name: "Chiusure" })).toBeInTheDocument();
    for (const group of ["Incassi", "Spese", "Contanti effettivi"]) {
      expect(screen.getByRole("heading", { name: group })).toBeInTheDocument();
    }
    const cashBox = screen.getByRole("heading", { name: "Contanti effettivi" }).closest(".mantine-Paper-root");
    expect(cashBox?.parentElement).toHaveStyle({ gridColumn: "1 / -1" });
    for (const [label] of moneyInputs) {
      expect(screen.getByRole("textbox", { name: label })).toBeInTheDocument();
    }
    for (const label of [
      "Pezzi da 500 €",
      "Pezzi da 200 €",
      "Pezzi da 100 €",
      "Pezzi da 50 €",
      "Pezzi da 20 €",
      "Pezzi da 10 €",
      "Pezzi da 5 €",
      "Spiccioli",
    ]) {
      expect(screen.getByRole("textbox", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("group", { name: "Tagli banconote" })).toBeInTheDocument();
    expect(screen.getByText("Dati incompleti")).toBeInTheDocument();
    expect(screen.queryByText("Riepilogo calcoli")).not.toBeInTheDocument();
  });

  it("calculates actual cash from entered bill counts while blank denominations count as zero", () => {
    renderClosingPage();
    enterAmounts();

    expect(getDisplayedResults()).toEqual([
      "120,00\u00a0€",
      "115,00\u00a0€",
      "5,00\u00a0€",
      "105,00\u00a0€",
      "27,30\u00a0€",
    ]);
    const breakdown = screen.getByRole("region", { name: "Riepilogo calcoli" });
    const actualCash = within(breakdown).getByRole("list", { name: "Dettaglio Contanti effettivi" });
    expect(actualCash).toHaveTextContent("1 pezzo da 100 €");
    expect(actualCash).toHaveTextContent("1 pezzo da 20 €");
    expect(actualCash).toHaveTextContent("0 pezzi da 500 €");
    expect(actualCash).toHaveTextContent("Spiccioli");
    expect(within(actualCash).getAllByRole("listitem")[0]).not.toHaveTextContent("+");
    expect(within(actualCash).getAllByRole("listitem")[1]).toHaveTextContent("+");
    expect(within(breakdown).getByRole("group", { name: "Risultato Contanti effettivi" }))
      .toHaveTextContent("=");
  });

  it("adds the coins total to banknote counts and requires at least one cash value", () => {
    renderClosingPage();
    enterAmounts(
      [
        ["Incasso bar", "900"],
        ["Incasso tabacchi", "10"],
        ["POS", "0"],
        ["Spese contanti", "0"],
        ["Spese tabacchi", "0"],
      ],
      [
        ["Pezzi da 500 €", "1"],
        ["Pezzi da 200 €", "2"],
        ["Spiccioli", "2,50"],
      ]
    );

    expect(getDisplayedResults()).toEqual([
      "902,50\u00a0€",
      "910,00\u00a0€",
      "-7,50\u00a0€",
      "892,50\u00a0€",
      "232,05\u00a0€",
    ]);

    for (const label of [
      "Pezzi da 500 €",
      "Pezzi da 200 €",
      "Pezzi da 100 €",
      "Pezzi da 50 €",
      "Pezzi da 20 €",
      "Pezzi da 10 €",
      "Pezzi da 5 €",
      "Spiccioli",
    ]) {
      fireEvent.change(screen.getByRole("textbox", { name: label }), { target: { value: "" } });
    }
    expect(screen.getByText("Dati incompleti")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Riepilogo calcoli" })).not.toBeInTheDocument();
  }, 10000);

  it("shows each input, operation, percentage rate, and calculated result", () => {
    renderClosingPage();
    enterAmounts();

    const breakdown = screen.getByRole("region", { name: "Riepilogo calcoli" });
    const theoreticalCash = within(breakdown).getByRole("list", { name: "Dettaglio Contanti teorici" });
    const theoreticalRows = within(theoreticalCash).getAllByRole("listitem");
    for (const label of ["Incasso bar", "Incasso tabacchi", "POS", "Spese contanti", "Spese tabacchi"]) {
      expect(within(theoreticalCash).getByText(label)).toBeInTheDocument();
    }
    expect(within(theoreticalRows[1]).getByText("+")).toBeInTheDocument();
    expect(within(theoreticalRows[2]).getByText("−")).toBeInTheDocument();
    expect(within(theoreticalRows[3]).getByText("−")).toBeInTheDocument();
    expect(within(theoreticalRows[4]).getByText("−")).toBeInTheDocument();
    expect(within(breakdown).getByRole("group", { name: "Risultato Contanti teorici" }))
      .toHaveTextContent("=");

    const bartendersShare = within(breakdown).getByRole("list", { name: "Dettaglio Quota banconieri" });
    expect(within(bartendersShare).getByText("26%")).toBeInTheDocument();
    expect(within(bartendersShare).getByText("Aliquota banconieri")).toBeInTheDocument();
    expect(within(bartendersShare).getByText("Incasso bar effettivo")).toBeInTheDocument();
    expect(within(bartendersShare).getByText("×")).toBeInTheDocument();
    expect(within(breakdown).getByRole("group", { name: "Risultato Quota banconieri" }))
      .toHaveTextContent("=");
  });

  it("recalculates results when an income, expense, or cash count changes", () => {
    renderClosingPage();
    enterAmounts();
    fireEvent.change(screen.getByRole("textbox", { name: "Pezzi da 20 €" }), {
      target: { value: "2" },
    });

    expect(getDisplayedResults()).toEqual([
      "140,00\u00a0€",
      "115,00\u00a0€",
      "25,00\u00a0€",
      "125,00\u00a0€",
      "32,50\u00a0€",
    ]);
  });

  it("rounds the 26 percent share to the nearest cent", () => {
    renderClosingPage();
    enterAmounts(
      [
        ["Incasso bar", "0,25"],
        ["Incasso tabacchi", "0"],
        ["POS", "0"],
        ["Spese contanti", "0"],
        ["Spese tabacchi", "0"],
      ],
      [["Spiccioli", "0,25"]]
    );

    expect(getDisplayedResults()).toEqual([
      "0,25\u00a0€",
      "0,25\u00a0€",
      "0,00\u00a0€",
      "0,25\u00a0€",
      "0,07\u00a0€",
    ]);
  });

  it("hides final calculations when a required amount or denomination is invalid", () => {
    renderClosingPage();
    enterAmounts();
    fireEvent.change(screen.getByRole("textbox", { name: "POS" }), {
      target: { value: "-1" },
    });

    expect(screen.getByText("Dati incompleti")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Riepilogo calcoli" })).not.toBeInTheDocument();
    expect(screen.getByText("Inserisci un importo valido con massimo due decimali.")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "POS" }), { target: { value: "10" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Pezzi da 100 €" }), { target: { value: "1,5" } });
    expect(screen.getByText("Inserisci un numero intero non negativo oppure lascia il campo vuoto.")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Riepilogo calcoli" })).not.toBeInTheDocument();
  });

  it("shows the exact banknotes to hand over and updates when the available notes change", () => {
    renderClosingPage();
    enterAmounts(
      [
        ["Incasso bar", "400"],
        ["Incasso tabacchi", "205"],
        ["POS", "0"],
        ["Spese contanti", "0"],
        ["Spese tabacchi", "0"],
      ],
      [["Pezzi da 500 €", "1"], ["Pezzi da 100 €", "1"], ["Pezzi da 5 €", "1"]]
    );
    const allocation = screen.getByRole("region", { name: "Banconote da dare ai banconieri" });
    expect(allocation).toHaveTextContent("Quota banconieri: 104,00");
    const rows = within(allocation).getByRole("list", { name: "Dettaglio Totale da consegnare" });
    expect(rows).toHaveTextContent("0 pezzi da 500 €");
    expect(rows).toHaveTextContent("1 pezzo da 100 €");
    expect(rows).toHaveTextContent("1 pezzo da 5 €");
    expect(within(allocation).getByRole("group", { name: "Risultato Totale da consegnare" }))
      .toHaveTextContent("105,00");

    fireEvent.change(screen.getByRole("textbox", { name: "Pezzi da 5 €" }), { target: { value: "" } });
    expect(within(allocation).getByText("Totale non componibile")).toBeInTheDocument();
    expect(within(allocation).getByText("Cambio di taglio suggerito")).toBeInTheDocument();
    expect(within(allocation).getByRole("group", { name: "Risultato Totale da consegnare dopo il cambio" }))
      .toHaveTextContent("105,00");
    expect(screen.getByRole("textbox", { name: "Pezzi da 500 €" })).toHaveValue("1");
    expect(screen.getByRole("textbox", { name: "Pezzi da 5 €" })).toHaveValue("");
  });

  it.each([
    ["205,81", "102,49", "100,00", true],
    ["205,77", "102,50", "105,00", false],
  ])("rounds the payout at the half-step boundary with tobacco income %s", (tobacco, share, rounded, composable) => {
    renderClosingPage();
    enterAmounts(
      [
        ["Incasso bar", "400"], ["Incasso tabacchi", tobacco], ["POS", "0"],
        ["Spese contanti", "0"], ["Spese tabacchi", "0"],
      ],
      [["Pezzi da 500 €", "1"], ["Pezzi da 100 €", "1"]]
    );
    const allocation = screen.getByRole("region", { name: "Banconote da dare ai banconieri" });
    expect(allocation).toHaveTextContent(`Quota banconieri: ${share}`);
    expect(allocation).toHaveTextContent(`Importo arrotondato ai 5 € più vicini: ${rounded}`);
    expect(within(allocation).queryByText("Totale non componibile") !== null).toBe(!composable);
  });

  it("does not use coins to compose a payout and handles a negative share", () => {
    renderClosingPage();
    enterAmounts(
      [
        ["Incasso bar", "100"], ["Incasso tabacchi", "0"], ["POS", "0"],
        ["Spese contanti", "0"], ["Spese tabacchi", "0"],
      ],
      [["Spiccioli", "100"]]
    );
    const allocation = screen.getByRole("region", { name: "Banconote da dare ai banconieri" });
    expect(within(allocation).getByText("Totale non componibile")).toBeInTheDocument();
    expect(allocation).toHaveTextContent("un cambio di taglio non basta");
    expect(within(allocation).queryByText("Cambio di taglio suggerito")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Incasso tabacchi" }), { target: { value: "200" } });
    expect(allocation).toHaveTextContent("La quota banconieri è negativa");
    expect(within(allocation).queryByRole("list")).not.toBeInTheDocument();
  });
});
