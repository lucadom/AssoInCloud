"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
} from "mantine-react-table";
import { MRT_Localization_IT } from "mantine-react-table/locales/it/index.esm.mjs";
import {
  Text,
  Stack,
  Title,
  Select,
  Group,
  Center,
  Loader,
  Button,
  SegmentedControl,
  ScrollArea,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconSearch, IconFileSpreadsheet, IconFileTypePdf } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { fetchSuppliers } from "@/lib/api/suppliers";
import { fetchPriceList, exportPriceListXlsx, exportPriceListPdf } from "@/lib/api/price-lists";
import type { Supplier, PriceListItem } from "@/types";

function formatCurrency(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });
}

function formatQuantity(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("it-IT", { maximumFractionDigits: 4 });
}

function formatDiscount(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("it-IT", { maximumFractionDigits: 2 }) + "%";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("it-IT");
}

function toOptional(value: string | null): string | undefined {
  return value || undefined;
}

type DatePreset = "all" | "last3Months" | "last6Months" | "last12Months";

function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getPresetRange(preset: DatePreset): [string | null, string | null] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case "last3Months": {
      const from = new Date(today);
      from.setMonth(from.getMonth() - 3);
      return [toISODateString(from), toISODateString(today)];
    }
    case "last6Months": {
      const from = new Date(today);
      from.setMonth(from.getMonth() - 6);
      return [toISODateString(from), toISODateString(today)];
    }
    case "last12Months": {
      const from = new Date(today);
      from.setMonth(from.getMonth() - 12);
      return [toISODateString(from), toISODateString(today)];
    }
    default:
      return [null, null];
  }
}

export function PriceListPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>("last12Months");
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [results, setResults] = useState<PriceListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Update date fields when preset changes
  useEffect(() => {
    const [from, to] = getPresetRange(datePreset);
    setDateFrom(from);
    setDateTo(to);
  }, [datePreset]);

  // Load suppliers on mount
  useEffect(() => {
    async function loadSuppliers() {
      setSuppliersLoading(true);
      try {
        const data = await fetchSuppliers();
        setSuppliers(data);
      } catch {
        notifications.show({
          title: "Errore",
          message: "Impossibile caricare i fornitori",
          color: "red",
        });
      } finally {
        setSuppliersLoading(false);
      }
    }
    loadSuppliers();
  }, []);

  const supplierOptions = useMemo(
    () =>
      suppliers
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => ({ value: s.id, label: s.name })),
    [suppliers],
  );

  const handleDateFromChange = useCallback((value: string | null) => {
    setDateFrom(value);
    setDatePreset("all");
  }, []);

  const handleDateToChange = useCallback((value: string | null) => {
    setDateTo(value);
    setDatePreset("all");
  }, []);

  const doSearch = useCallback(async () => {
    if (!selectedSupplierId) return;
    setLoading(true);
    try {
      const data = await fetchPriceList(
        selectedSupplierId,
        toOptional(dateFrom),
        toOptional(dateTo),
      );
      setResults(data);
      setSearched(true);
    } catch {
      notifications.show({
        title: "Errore",
        message: "Impossibile caricare il listino",
        color: "red",
      });
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSupplierId, dateFrom, dateTo]);

  const doExportXlsx = useCallback(async () => {
    if (!selectedSupplierId) return;
    setExportingXlsx(true);
    try {
      await exportPriceListXlsx(selectedSupplierId, toOptional(dateFrom), toOptional(dateTo));
    } catch {
      notifications.show({
        title: "Errore",
        message: "Impossibile esportare il listino in Excel",
        color: "red",
      });
    } finally {
      setExportingXlsx(false);
    }
  }, [selectedSupplierId, dateFrom, dateTo]);

  const doExportPdf = useCallback(async () => {
    if (!selectedSupplierId) return;
    setExportingPdf(true);
    try {
      await exportPriceListPdf(selectedSupplierId, toOptional(dateFrom), toOptional(dateTo));
    } catch {
      notifications.show({
        title: "Errore",
        message: "Impossibile esportare il listino in PDF",
        color: "red",
      });
    } finally {
      setExportingPdf(false);
    }
  }, [selectedSupplierId, dateFrom, dateTo]);

  const columns = useMemo<MRT_ColumnDef<PriceListItem>[]>(
    () => [
      {
        accessorKey: "description",
        header: "Descrizione",
        size: 350,
      },
      {
        accessorKey: "unitOfMeasure",
        header: "U.M.",
        size: 80,
        Cell: ({ cell }) => cell.getValue<string | null>() || "—",
      },
      {
        accessorKey: "unitPrice",
        header: "Prezzo unitario",
        size: 140,
        mantineTableHeadCellProps: { align: "right" },
        mantineTableBodyCellProps: { align: "right" },
        Cell: ({ cell }) => formatCurrency(cell.getValue<number | null>()),
      },
      {
        accessorKey: "discountPercentage",
        header: "Sconto (%)",
        size: 110,
        mantineTableHeadCellProps: { align: "right" },
        mantineTableBodyCellProps: { align: "right" },
        Cell: ({ cell }) => formatDiscount(cell.getValue<number | null>()),
      },
      {
        accessorKey: "effectiveUnitPrice",
        header: "Prezzo effettivo",
        size: 140,
        mantineTableHeadCellProps: { align: "right" },
        mantineTableBodyCellProps: { align: "right" },
        Cell: ({ cell }) => formatCurrency(cell.getValue<number | null>()),
      },
      {
        accessorKey: "lastPurchaseDate",
        header: "Ultimo acquisto",
        size: 140,
        Cell: ({ cell }) => formatDate(cell.getValue<string | null>()),
      },
      {
        accessorKey: "totalQuantity",
        header: "Quantità totale",
        size: 140,
        mantineTableHeadCellProps: { align: "right" },
        mantineTableBodyCellProps: { align: "right" },
        Cell: ({ cell }) => formatQuantity(cell.getValue<number | null>()),
      },
    ],
    [],
  );

  const table = useMantineReactTable({
    columns,
    data: results,
    enableColumnFilterModes: true,
    enableColumnOrdering: true,
    enableFacetedValues: true,
    enableSorting: true,
    enableGlobalFilter: false,
    enableGrouping: true,
    getRowId: (_row, index) => String(index),
    localization: MRT_Localization_IT,
    initialState: {
      density: "xs",
      pagination: { pageIndex: 0, pageSize: 50 },
    },
    state: {
      isLoading: loading,
    },
    paginationDisplayMode: "pages",
    mantinePaginationProps: {
      radius: "md",
      size: "sm",
    },
    renderEmptyRowsFallback: () => (
      <Center py="xl">
        <Text c="dimmed">
          {!searched
            ? "Seleziona un fornitore e premi \"Cerca\" per visualizzare il listino."
            : "Nessun prodotto trovato per i criteri selezionati."}
        </Text>
      </Center>
    ),
    renderTopToolbarCustomActions: () => (
      <Text size="sm" c="dimmed" pl="sm">
        {searched
          ? `${results.length} prodott${results.length === 1 ? "o" : "i"} trovat${results.length === 1 ? "o" : "i"}`
          : ""}
      </Text>
    ),
    mantineTableProps: {
      striped: true,
      highlightOnHover: true,
      withTableBorder: true,
      withColumnBorders: true,
    },
  });

  return (
    <Stack gap="md">
      <Title order={2}>Listini</Title>
      <ScrollArea type="scroll" offsetScrollbars={false}>
        <SegmentedControl
          value={datePreset}
          onChange={(value) => setDatePreset(value as DatePreset)}
          data={[
            { label: "Tutte", value: "all" },
            { label: "Ultimi 3 mesi", value: "last3Months" },
            { label: "Ultimi 6 mesi", value: "last6Months" },
            { label: "Ultimi 12 mesi", value: "last12Months" },
          ]}
          size="xs"
          style={{ minWidth: "fit-content" }}
        />
      </ScrollArea>
      <Group align="end" gap="md" wrap="wrap">
        <Select
          label="Fornitore"
          placeholder="Seleziona un fornitore"
          data={supplierOptions}
          value={selectedSupplierId}
          onChange={setSelectedSupplierId}
          searchable
          clearable
          w={300}
          rightSection={suppliersLoading ? <Loader size={16} /> : undefined}
          disabled={suppliersLoading}
        />
        <DatePickerInput
          label="Da"
          placeholder="Data inizio"
          value={dateFrom}
          onChange={handleDateFromChange}
          clearable
          w={160}
          valueFormat="DD/MM/YYYY"
        />
        <DatePickerInput
          label="A"
          placeholder="Data fine"
          value={dateTo}
          onChange={handleDateToChange}
          clearable
          w={160}
          valueFormat="DD/MM/YYYY"
        />
        <Button
          leftSection={<IconSearch size={16} />}
          onClick={doSearch}
          loading={loading}
          disabled={!selectedSupplierId}
        >
          Cerca
        </Button>
        <Button
          leftSection={<IconFileSpreadsheet size={16} />}
          onClick={doExportXlsx}
          loading={exportingXlsx}
          disabled={!searched || !selectedSupplierId}
          variant="light"
          color="green"
        >
          Esporta Excel
        </Button>
        <Button
          leftSection={<IconFileTypePdf size={16} />}
          onClick={doExportPdf}
          loading={exportingPdf}
          disabled={!searched || !selectedSupplierId}
          variant="light"
          color="red"
        >
          Esporta PDF
        </Button>
      </Group>

      {!searched && !loading ? (
        <Center py="xl">
          <Text c="dimmed" size="lg">
            Seleziona un fornitore e premi &quot;Cerca&quot; per visualizzare il listino prezzi.
          </Text>
        </Center>
      ) : (
        <MantineReactTable table={table} />
      )}
    </Stack>
  );
}
