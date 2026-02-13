"use client";

import { useState, useCallback, useMemo } from "react";
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
} from "mantine-react-table";
import { MRT_Localization_IT } from "mantine-react-table/locales/it/index.esm.mjs";
import {
  Box,
  Text,
  Stack,
  Title,
  Loader,
  Center,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { searchProducts } from "@/lib/api/products";
import type { ProductSearchResult } from "@/types";
import { useEffect } from "react";

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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("it-IT");
}

const MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

/** Derives "Mese Anno" (e.g. "Giugno 2024") from an ISO date string. */
export function formatMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 400);
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const data = await searchProducts(query.trim());
      setResults(data);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    doSearch(debouncedSearch);
  }, [debouncedSearch, doSearch]);

  const columns = useMemo<MRT_ColumnDef<ProductSearchResult>[]>(
    () => [
      {
        accessorKey: "supplierName",
        header: "Fornitore",
        size: 200,
      },
      {
        id: "invoiceDate",
        header: "Data fattura",
        size: 160,
        accessorFn: (row) => formatMonth(row.invoiceDate),
        enableGrouping: true,
        Cell: ({ row }) => formatDate(row.original.invoiceDate),
        GroupedCell: ({ cell }) => (
          <Text fw={700} size="sm">{cell.getValue<string>()}</Text>
        ),
      },
      {
        accessorKey: "description",
        header: "Descrizione",
        size: 300,
      },
      {
        accessorKey: "quantity",
        header: "Quantità",
        size: 120,
        mantineTableHeadCellProps: { align: "right" },
        mantineTableBodyCellProps: { align: "right" },
        aggregationFn: "sum",
        AggregatedCell: ({ cell }) => (
          <Box style={{ textAlign: "right", width: "100%" }}>
            <Text fw={700} size="sm" c="blue.7">
              Tot: {formatQuantity(cell.getValue<number | null>())}
            </Text>
          </Box>
        ),
        Cell: ({ cell }) => formatQuantity(cell.getValue<number | null>()),
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
        size: 130,
        mantineTableHeadCellProps: { align: "right" },
        mantineTableBodyCellProps: { align: "right" },
        enableGrouping: false,
        aggregationFn: "mean",
        AggregatedCell: ({ cell }) => (
          <Box style={{ textAlign: "right", width: "100%" }}>
            <Text fw={700} size="sm" c="blue.7">
              Media: {formatCurrency(cell.getValue<number | null>())}
            </Text>
          </Box>
        ),
        Cell: ({ cell }) => formatCurrency(cell.getValue<number | null>()),
      },
      {
        accessorKey: "totalPrice",
        header: "Totale",
        size: 130,
        mantineTableHeadCellProps: { align: "right" },
        mantineTableBodyCellProps: { align: "right" },
        aggregationFn: "sum",
        AggregatedCell: ({ cell }) => (
          <Box style={{ textAlign: "right", width: "100%" }}>
            <Text fw={700} size="sm" c="blue.7">
              Tot: {formatCurrency(cell.getValue<number | null>())}
            </Text>
          </Box>
        ),
        Cell: ({ cell }) => (
          <Text fw={600} size="sm">
            {formatCurrency(cell.getValue<number | null>())}
          </Text>
        ),
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
    enableExpandAll: true,
    getRowId: (row) => row.lineItemId,
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
            ? "Inserisci un termine di ricerca per trovare i prodotti nelle fatture. Usa * come carattere jolly (es: the*limone*12)."
            : "Nessun prodotto trovato."}
        </Text>
      </Center>
    ),
    renderTopToolbarCustomActions: () => (
      <Text size="sm" c="dimmed" pl="sm">
        {searched ? `${results.length} risultat${results.length === 1 ? "o" : "i"} trovat${results.length === 1 ? "o" : "i"}` : ""}
      </Text>
    ),
    mantineTableProps: {
      striped: true,
      highlightOnHover: true,
      withTableBorder: true,
      withColumnBorders: true,
    },
    mantineToolbarAlertBannerProps: {
      color: "blue",
      variant: "light",
    },
  });

  return (
    <Stack gap="md">
      <Title order={2}>Prodotti</Title>

      <TextInput
        placeholder="Cerca prodotti... (usa * come jolly, es: the*limone*12)"
        leftSection={<IconSearch size={16} />}
        rightSection={loading ? <Loader size={16} /> : null}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        size="md"
      />

      {!searched && !loading ? (
        <Center py="xl">
          <Text c="dimmed" size="lg">
            Inserisci un termine di ricerca per trovare i prodotti nelle fatture.
            Usa * come carattere jolly (es: the*limone*12).
          </Text>
        </Center>
      ) : (
        <MantineReactTable table={table} />
      )}
    </Stack>
  );
}
