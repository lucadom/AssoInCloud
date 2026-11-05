"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart } from "@mantine/charts";
import {
  Alert,
  Box,
  LoadingOverlay,
  MultiSelect,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import type { InvoiceMonthlySummary, Supplier } from "@/types";
import { fetchInvoiceMonthlySummary } from "@/lib/api/invoices";
import { fetchSuppliers } from "@/lib/api/suppliers";
import { logger } from "@/lib/logger";

const MONTHS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

const SERIES_COLORS = ["blue.6", "teal.6", "violet.6", "orange.6", "grape.6", "cyan.6", "pink.6"];

function formatCurrency(value: number): string {
  return value.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

export function InvoiceComparisonPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierLoading, setSupplierLoading] = useState(true);
  const [supplierError, setSupplierError] = useState<string | null>(null);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [summaries, setSummaries] = useState<
    { supplier: Supplier; rows: InvoiceMonthlySummary[] }[]
  >([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const summaryRequestId = useRef(0);

  useEffect(() => {
    let active = true;
    fetchSuppliers()
      .then((data) => {
        if (active) setSuppliers(data);
      })
      .catch(() => {
        if (active) setSupplierError("Impossibile caricare i fornitori");
      })
      .finally(() => {
        if (active) setSupplierLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      summaryRequestId.current += 1;
    };
  }, []);

  async function handleSupplierChange(supplierIds: string[]) {
    const requestId = ++summaryRequestId.current;
    setSelectedSupplierIds(supplierIds);
    setSummaries([]);
    setSelectedYears([]);
    setSummaryError(null);
    setSummaryLoading(supplierIds.length > 0);
    if (supplierIds.length === 0) return;

    try {
      const data = await Promise.all(
        suppliers
          .filter((supplier) => supplierIds.includes(supplier.id))
          .map(async (supplier) => ({
            supplier,
            rows: await fetchInvoiceMonthlySummary(supplier.id),
          })),
      );
      if (requestId !== summaryRequestId.current) return;
      setSummaries(data);
      setSelectedYears(
        [...new Set(data.flatMap(({ rows }) => rows.map((item) => item.year)))]
          .sort((a, b) => a - b),
      );
    } catch (error: unknown) {
      if (requestId !== summaryRequestId.current) return;
      logger.error("Unable to load invoice comparison", error);
      setSummaryError("Impossibile caricare il confronto delle fatture");
    } finally {
      if (requestId === summaryRequestId.current) setSummaryLoading(false);
    }
  }

  const availableYears = useMemo(
    () => [...new Set(summaries.flatMap(({ rows }) => rows.map((item) => item.year)))]
      .sort((a, b) => a - b),
    [summaries],
  );

  const series = useMemo(() => summaries.flatMap(({ supplier, rows }) =>
    selectedYears
      .filter((year) => rows.some((item) => item.year === year))
      .map((year) => ({
        name: `${supplier.id}-${year}`,
        label: `${supplier.name} - ${year}`,
      })),
  ).map((item, index) => ({
    ...item,
    color: SERIES_COLORS[index % SERIES_COLORS.length],
  })), [summaries, selectedYears]);

  const chartData = useMemo(() => {
    const totals = new Map<string, number>(
      summaries.flatMap(({ supplier, rows }) =>
        rows.map((item) => [`${supplier.id}-${item.year}-${item.month}`, item.totalAmount] as const),
      ),
    );
    return MONTHS.map((month, index) => {
      const monthNumber = index + 1;
      return {
        month,
        ...Object.fromEntries(
          series.map(({ name }) => [name, totals.get(`${name}-${monthNumber}`) ?? 0]),
        ),
      };
    });
  }, [series, summaries]);

  return (
    <Stack gap="md">
      <Title order={2}>Confronto fatture</Title>

      {supplierError && <Alert color="red" title="Errore">{supplierError}</Alert>}

      <MultiSelect
        label="Fornitori"
        placeholder="Seleziona uno o più fornitori"
        data={suppliers
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((supplier) => ({ value: supplier.id, label: supplier.name }))}
        value={selectedSupplierIds}
        onChange={handleSupplierChange}
        searchable
        clearable
        disabled={supplierLoading || suppliers.length === 0 || Boolean(supplierError)}
        nothingFoundMessage="Nessun fornitore trovato"
      />

      {selectedSupplierIds.length > 0 && !summaryLoading && !summaryError && availableYears.length > 0 && (
        <MultiSelect
          label="Anni da confrontare"
          placeholder="Seleziona gli anni"
          data={availableYears.map(String)}
          value={selectedYears.map(String)}
          onChange={(years) => setSelectedYears(years.map(Number))}
          searchable={false}
          clearable
        />
      )}

      {summaryError && <Alert color="red" title="Errore">{summaryError}</Alert>}

      {selectedSupplierIds.length === 0 && !supplierLoading && !supplierError && (
        <Text c="dimmed">Seleziona uno o più fornitori per visualizzare il confronto.</Text>
      )}

      {selectedSupplierIds.length > 0 && !summaryLoading && !summaryError && availableYears.length === 0 && (
        <Text c="dimmed">Nessuna fattura disponibile per i fornitori selezionati.</Text>
      )}

      {selectedSupplierIds.length > 0 && !summaryError && (summaryLoading || availableYears.length > 0) && (
        <Box pos="relative" mih={360}>
          <LoadingOverlay visible={summaryLoading} />
          {availableYears.length > 0 && (
            <>
              <Text size="sm" c="dimmed" mb="xs">Totale fatture, IVA inclusa</Text>
              <LineChart
                h={320}
                data={chartData}
                dataKey="month"
                series={series}
                curveType="linear"
                withLegend
                withTooltip
                valueFormatter={formatCurrency}
                yAxisLabel="Importo (€)"
              />
            </>
          )}
        </Box>
      )}
    </Stack>
  );
}
