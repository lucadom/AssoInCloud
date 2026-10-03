"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { allocateBanknotes, banknoteFields, roundCashShare, suggestBanknoteExchange } from "@/lib/closing-cash";

const incomeFields = [
  { key: "barIncome", label: "Incasso bar" },
  { key: "tobaccoIncome", label: "Incasso tabacchi" },
  { key: "pos", label: "POS" },
] as const;

const expenseFields = [
  { key: "cashExpenses", label: "Spese contanti" },
  { key: "tobaccoExpenses", label: "Spese tabacchi" },
] as const;

const CENTS_PER_EURO = BigInt(100);
const ROUNDING_ADJUSTMENT = BigInt(50);
const ZERO = BigInt(0);

type MoneyField = (typeof incomeFields)[number]["key"] | (typeof expenseFields)[number]["key"];
type BanknoteField = (typeof banknoteFields)[number]["key"];
type MoneyAmounts = Record<MoneyField, string>;
type CashAmounts = Record<BanknoteField, string> & { coins: string };
type ParsedMoneyAmounts = Record<MoneyField, bigint | null>;
type ParsedCashAmounts = Record<BanknoteField, bigint | null> & { coins: bigint | null };

const currencyFormatter = new Intl.NumberFormat("it-IT");

function parseEuroCents(value: string): bigint | null {
  const normalized = value.trim().replace(",", ".");
  const match = normalized.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;

  const euros = BigInt(match[1]);
  const cents = BigInt((match[2] ?? "").padEnd(2, "0"));
  return euros * CENTS_PER_EURO + cents;
}

function parsePieceCount(value: string): bigint | null {
  if (!/^\d+$/.test(value.trim())) return null;
  return BigInt(value.trim());
}

function formatEuroCents(cents: bigint): string {
  const negative = cents < ZERO;
  const absoluteCents = negative ? -cents : cents;
  const euros = absoluteCents / CENTS_PER_EURO;
  const fractionalCents = (absoluteCents % CENTS_PER_EURO).toString().padStart(2, "0");
  const formattedEuros = currencyFormatter.format(euros);

  return `${negative ? "-" : ""}${formattedEuros},${fractionalCents}\u00a0€`;
}

function roundToCents(amount: bigint, percentage: bigint): bigint {
  const numerator = amount * percentage;
  return numerator >= ZERO
    ? (numerator + ROUNDING_ADJUSTMENT) / CENTS_PER_EURO
    : (numerator - ROUNDING_ADJUSTMENT) / CENTS_PER_EURO;
}

export function ClosingPage() {
  const [amounts, setAmounts] = useState<MoneyAmounts>({
    barIncome: "",
    tobaccoIncome: "",
    pos: "",
    cashExpenses: "",
    tobaccoExpenses: "",
  });
  const [cashAmounts, setCashAmounts] = useState<CashAmounts>({
    bill500: "",
    bill200: "",
    bill100: "",
    bill50: "",
    bill20: "",
    bill10: "",
    bill5: "",
    coins: "",
  });

  const parsedAmounts = useMemo(
    () => Object.fromEntries(
      [...incomeFields, ...expenseFields].map(({ key }) => [key, parseEuroCents(amounts[key])])
    ) as ParsedMoneyAmounts,
    [amounts]
  );
  const parsedCashAmounts = useMemo(
    () => ({
      ...Object.fromEntries(
        banknoteFields.map(({ key }) => [key, cashAmounts[key].trim() === "" ? ZERO : parsePieceCount(cashAmounts[key])])
      ),
      coins: cashAmounts.coins.trim() === "" ? ZERO : parseEuroCents(cashAmounts.coins),
    }) as ParsedCashAmounts,
    [cashAmounts]
  );

  const cashHasEntry = Object.values(cashAmounts).some((value) => value.trim() !== "");
  const cashInputsValid = Object.values(parsedCashAmounts).every((value) => value !== null);
  const calculations = useMemo(() => {
    const { barIncome, tobaccoIncome, pos, cashExpenses, tobaccoExpenses } = parsedAmounts;
    if (
      barIncome === null ||
      tobaccoIncome === null ||
      pos === null ||
      cashExpenses === null ||
      tobaccoExpenses === null ||
      !cashHasEntry ||
      !cashInputsValid
    ) {
      return null;
    }

    const actualCash = banknoteFields.reduce(
      (total, field) => total + parsedCashAmounts[field.key]! * BigInt(field.value) * CENTS_PER_EURO,
      parsedCashAmounts.coins!
    );
    const theoreticalCash = barIncome + tobaccoIncome - pos - cashExpenses - tobaccoExpenses;
    const cashDifference = actualCash - theoreticalCash;
    const effectiveBarIncome = barIncome + cashDifference;
    const actualCashEntries: CalculationEntry[] = banknoteFields.map((field, index) => {
      const pieces = parsedCashAmounts[field.key]!;
      return {
        amount: pieces * BigInt(field.value) * CENTS_PER_EURO,
        operator: index === 0 ? "" : "+",
        description: `${pieces.toString()} ${pieces === BigInt(1) ? "pezzo" : "pezzi"} da ${field.value} €`,
      };
    });
    actualCashEntries.push({
      amount: parsedCashAmounts.coins!,
      operator: "+",
      description: "Spiccioli",
    });
    const bartendersShare = roundToCents(effectiveBarIncome, BigInt(26));
    const roundedShare = roundCashShare(bartendersShare);
    const availableBanknotes = banknoteFields.map(({ key }) => parsedCashAmounts[key]!);
    const banknoteAllocation = bartendersShare < ZERO ? null : allocateBanknotes(roundedShare, availableBanknotes);
    const exchange = banknoteAllocation === null && bartendersShare >= ZERO
      ? suggestBanknoteExchange(roundedShare, availableBanknotes) : null;
    const payoutEntries = banknoteAllocation !== null ? banknoteEntries(banknoteAllocation) : null;
    const exchangePayoutEntries = exchange !== null ? banknoteEntries(exchange.allocation) : null;

    return {
      amounts: { barIncome, tobaccoIncome, pos, cashExpenses, tobaccoExpenses },
      actualCash,
      actualCashEntries,
      theoreticalCash,
      cashDifference,
      effectiveBarIncome,
      bartendersShare,
      roundedShare,
      payoutEntries,
      exchange,
      exchangePayoutEntries,
    };
  }, [cashHasEntry, cashInputsValid, parsedAmounts, parsedCashAmounts]);

  return (
    <Stack gap="xl" maw={900}>
      <Title order={2}>Chiusure</Title>
      <Text size="sm" c="dimmed">
        Inserisci i valori della chiusura mensile. I dati restano in questa pagina e non vengono salvati.
      </Text>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <InputGroup title="Incassi">
          {incomeFields.map(({ key, label }) => (
            <TextInput
              key={key}
              label={label}
              aria-label={label}
              inputMode="decimal"
              value={amounts[key]}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setAmounts((current) => ({ ...current, [key]: value }));
              }}
              rightSection={<Text size="sm" c="dimmed">€</Text>}
              rightSectionWidth={40}
              error={amounts[key] !== "" && parsedAmounts[key] === null
                ? "Inserisci un importo valido con massimo due decimali."
                : undefined}
            />
          ))}
        </InputGroup>

        <InputGroup title="Spese">
          {expenseFields.map(({ key, label }) => (
            <TextInput
              key={key}
              label={label}
              aria-label={label}
              inputMode="decimal"
              value={amounts[key]}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setAmounts((current) => ({ ...current, [key]: value }));
              }}
              rightSection={<Text size="sm" c="dimmed">€</Text>}
              rightSectionWidth={40}
              error={amounts[key] !== "" && parsedAmounts[key] === null
                ? "Inserisci un importo valido con massimo due decimali."
                : undefined}
            />
          ))}
        </InputGroup>

        <div style={{ gridColumn: "1 / -1" }}>
          <InputGroup title="Contanti effettivi">
            <SimpleGrid cols={{ base: 2, sm: 4 }} role="group" aria-label="Tagli banconote">
              {banknoteFields.map(({ key, label }) => (
                <TextInput
                  key={key}
                  label={label}
                  aria-label={label}
                  inputMode="numeric"
                  value={cashAmounts[key]}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setCashAmounts((current) => ({ ...current, [key]: value }));
                  }}
                  rightSection={<Text size="sm" c="dimmed">pz</Text>}
                  rightSectionWidth={40}
                  error={cashAmounts[key] !== "" && parsedCashAmounts[key] === null
                    ? "Inserisci un numero intero non negativo oppure lascia il campo vuoto."
                    : undefined}
                />
              ))}
            </SimpleGrid>
            <TextInput
              label="Spiccioli"
              aria-label="Spiccioli"
              inputMode="decimal"
              value={cashAmounts.coins}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setCashAmounts((current) => ({ ...current, coins: value }));
              }}
              rightSection={<Text size="sm" c="dimmed">€</Text>}
              rightSectionWidth={40}
              error={cashAmounts.coins !== "" && parsedCashAmounts.coins === null
                ? "Inserisci un importo valido con massimo due decimali."
                : undefined}
              description="Importo totale degli spiccioli"
            />
            <Text size="xs" c="dimmed">
              I campi vuoti valgono zero. Compila almeno un campo dei contanti.
            </Text>
          </InputGroup>
        </div>
      </SimpleGrid>

      {calculations ? (
        <Paper withBorder p="md" role="region" aria-label="Riepilogo calcoli" aria-live="polite">
          <Stack gap="md">
            <Title order={3}>Riepilogo calcoli</Title>
            <CalculationRow
              label="Contanti effettivi"
              entries={calculations.actualCashEntries}
              result={calculations.actualCash}
            />
            <CalculationRow
              label="Contanti teorici"
              entries={[
                { amount: calculations.amounts.barIncome, operator: "", description: "Incasso bar" },
                { amount: calculations.amounts.tobaccoIncome, operator: "+", description: "Incasso tabacchi" },
                { amount: calculations.amounts.pos, operator: "−", description: "POS" },
                { amount: calculations.amounts.cashExpenses, operator: "−", description: "Spese contanti" },
                { amount: calculations.amounts.tobaccoExpenses, operator: "−", description: "Spese tabacchi" },
              ]}
              result={calculations.theoreticalCash}
            />
            <CalculationRow
              label="Differenza contanti"
              entries={[
                { amount: calculations.actualCash, operator: "", description: "Contanti effettivi" },
                { amount: calculations.theoreticalCash, operator: "−", description: "Contanti teorici" },
              ]}
              result={calculations.cashDifference}
            />
            <CalculationRow
              label="Incasso bar effettivo"
              entries={[
                { amount: calculations.amounts.barIncome, operator: "", description: "Incasso bar" },
                { amount: calculations.cashDifference, operator: "+", description: "Differenza contanti" },
              ]}
              result={calculations.effectiveBarIncome}
            />
            <CalculationRow
              label="Quota banconieri"
              entries={[
                { amount: calculations.effectiveBarIncome, operator: "", description: "Incasso bar effettivo" },
                { amount: "26%", operator: "×", description: "Aliquota banconieri" },
              ]}
              result={calculations.bartendersShare}
            />
          </Stack>
        </Paper>
      ) : (
        <Alert color="blue" title="Dati incompleti">
          Inserisci i cinque importi di Incassi e Spese e valorizza almeno un campo dei Contanti effettivi.
          I campi contanti vuoti valgono zero.
        </Alert>
      )}

      {calculations && (
        <Paper withBorder p="md" role="region" aria-label="Banconote da dare ai banconieri" aria-live="polite">
          <Stack gap="md">
            <Title order={3}>Banconote da dare ai banconieri</Title>
            <Text size="sm" c="dimmed">
              Quota banconieri: {formatEuroCents(calculations.bartendersShare)}.
              Importo arrotondato ai 5 € più vicini: {formatEuroCents(calculations.roundedShare)}.
              A metà si arrotonda verso l&apos;alto. Gli spiccioli non sono utilizzati.
            </Text>
            {calculations.payoutEntries !== null ? (
              <CalculationRow
                label="Totale da consegnare"
                entries={calculations.payoutEntries}
                result={calculations.roundedShare}
              />
            ) : (
              <Alert color="yellow" title="Totale non componibile">
                {calculations.bartendersShare < ZERO
                  ? "La quota banconieri è negativa: non è possibile proporre banconote da consegnare."
                  : calculations.exchange !== null
                    ? "Il totale arrotondato non è componibile con i tagli attuali. Effettua il cambio suggerito prima della consegna."
                    : "Il valore delle banconote disponibili è insufficiente: un cambio di taglio non basta a raggiungere la quota. Non viene proposto un importo superiore."}
              </Alert>
            )}
            {calculations.exchange !== null && calculations.exchangePayoutEntries !== null && (
              <Stack gap="md">
                <Text fw={600}>Cambio di taglio suggerito</Text>
                <Text>
                  Cambia 1 pezzo da {banknoteFields[calculations.exchange.sourceIndex].value} € in{" "}
                  {calculations.exchange.received
                    .map((count, index) => count > ZERO
                      ? `${count.toString()} ${count === BigInt(1) ? "pezzo" : "pezzi"} da ${banknoteFields[index].value} €`
                      : null)
                    .filter((description) => description !== null)
                    .join(" + ")}.
                </Text>
                <Text size="sm" c="dimmed">
                  Procurati questi tagli tramite un cambio di pari valore. La proposta non modifica i contanti inseriti.
                </Text>
                <CalculationRow
                  label="Totale da consegnare dopo il cambio"
                  entries={calculations.exchangePayoutEntries}
                  result={calculations.roundedShare}
                />
              </Stack>
            )}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

function InputGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper withBorder p="md">
      <Stack gap="md">
        <Title order={3}>{title}</Title>
        {children}
      </Stack>
    </Paper>
  );
}

interface CalculationEntry {
  amount: bigint | string;
  operator: string;
  description: string;
}

function banknoteEntries(counts: readonly bigint[]): CalculationEntry[] {
  return counts.map((pieces, index) => ({
    amount: pieces * BigInt(banknoteFields[index].value) * CENTS_PER_EURO,
    operator: index === 0 ? "" : "+",
    description: `${pieces.toString()} ${pieces === BigInt(1) ? "pezzo" : "pezzi"} da ${banknoteFields[index].value} €`,
  }));
}

function CalculationRow({
  label,
  entries,
  result,
}: {
  label: string;
  entries: CalculationEntry[];
  result: bigint;
}) {
  return (
    <Paper withBorder p="sm" radius="sm">
      <Stack gap={4}>
        <Text fw={600}>{label}</Text>
        <Stack gap={2} role="list" aria-label={`Dettaglio ${label}`}>
          {entries.map((entry, index) => (
            <Group key={`${entry.description}-${index}`} gap="xs" wrap="nowrap" role="listitem">
              <Text fw={700} c="dark" size="md" w={120} ta="right">
                {typeof entry.amount === "bigint" ? formatEuroCents(entry.amount) : entry.amount}
              </Text>
              <Text fw={700} c="dark" size="md" w={24} ta="center">{entry.operator}</Text>
              <Text size="sm" c="dimmed" style={{ flex: 1 }}>{entry.description}</Text>
            </Group>
          ))}
        </Stack>
        <Divider my={4} />
        <Group gap="xs" wrap="nowrap" role="group" aria-label={`Risultato ${label}`}>
          <Text fw={700} c="dark" size="md" w={120} ta="right" aria-hidden="true" />
          <Text fw={700} c="dark" size="md" w={24} ta="center">=</Text>
          <Text fw={700} c="dark" size="lg">{formatEuroCents(result)}</Text>
        </Group>
      </Stack>
    </Paper>
  );
}
