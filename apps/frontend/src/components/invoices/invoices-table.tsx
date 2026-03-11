"use client";

import { useMemo, useState } from "react";
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
  type MRT_Row,
} from "mantine-react-table";
import { MRT_Localization_IT } from "mantine-react-table/locales/it/index.esm.mjs";
import {
  ActionIcon,
  Badge,
  Group,
  ScrollArea,
  SegmentedControl,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconEye,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import type { Invoice } from "@/types";

interface InvoicesTableProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(amount: number, isCreditNote: boolean = false): string {
  const displayAmount = isCreditNote ? -Math.abs(amount) : amount;
  return displayAmount.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });
}

type DatePreset = "all" | "thisMonth" | "lastMonth" | "twoMonthsAgo" | "threeMonthsAgo" | "last3Months" | "thisYear" | "previousYear";

function getPresetRange(preset: DatePreset): [Date | null, Date | null] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case "thisMonth": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return [from, null];
    }
    case "lastMonth": {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      return [from, to];
    }
    case "twoMonthsAgo": {
      const from = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      const to = new Date(today.getFullYear(), today.getMonth() - 1, 0);
      return [from, to];
    }
    case "threeMonthsAgo": {
      const from = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      const to = new Date(today.getFullYear(), today.getMonth() - 2, 0);
      return [from, to];
    }
    case "last3Months": {
      // 3 months preceding the current month: from 1st of (currentMonth-3) to last day of last month
      const from = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      return [from, to];
    }
    case "thisYear":
      return [new Date(today.getFullYear(), 0, 1), null];
    case "previousYear": {
      const from = new Date(today.getFullYear() - 1, 0, 1);
      const to = new Date(today.getFullYear() - 1, 11, 31);
      return [from, to];
    }
    default:
      return [null, null];
  }
}

export function dateRangeFilterFn(
  row: { getValue: (id: string) => unknown },
  columnId: string,
  filterValue: [Date | null, Date | null],
): boolean {
  const [from, to] = filterValue ?? [null, null];
  if (!from && !to) return true;
  const cellDate = row.getValue(columnId);
  if (!(cellDate instanceof Date)) return true;
  if (from) {
    const startDate = new Date(from);
    if (cellDate < startDate) return false;
  }
  if (to) {
    const endOfDay = new Date(to);
    endOfDay.setHours(23, 59, 59, 999);
    if (cellDate > endOfDay) return false;
  }
  return true;
}

export function InvoicesTable({
  invoices,
  onView,
  onEdit,
  onDelete,
}: InvoicesTableProps) {
  const [datePreset, setDatePreset] = useState<DatePreset>("all");

  const filteredInvoices = useMemo(() => {
    const [from, to] = getPresetRange(datePreset);
    if (!from && !to) return invoices;
    return invoices.filter((inv) => {
      const d = new Date(inv.date);
      if (from && d < from) return false;
      if (to) {
        const endOfDay = new Date(to);
        endOfDay.setHours(23, 59, 59, 999);
        if (d > endOfDay) return false;
      }
      return true;
    });
  }, [invoices, datePreset]);

  const columns = useMemo<MRT_ColumnDef<Invoice>[]>(
    () => [
      {
        accessorFn: (row) => row.documentTypeDescription || row.documentType || "—",
        id: "documentType",
        header: "Tipo",
        size: 180,
        Cell: ({ row }) => {
          const label = row.original.documentTypeDescription || row.original.documentType || "—";
          return label.length > 20 ? (
            <Tooltip label={label}>
              <Text size="sm" component="span">{label.slice(0, 20)}…</Text>
            </Tooltip>
          ) : (
            <Text size="sm" component="span">{label}</Text>
          );
        },
      },
      {
        accessorKey: "invoiceNumber",
        header: "Numero",
        size: 120,
      },
      {
        accessorFn: (row) => new Date(row.date),
        id: "date",
        header: "Data",
        size: 120,
        sortingFn: "datetime",
        Cell: ({ row }) => formatDate(row.original.date),
        filterVariant: "date-range",
        filterFn: dateRangeFilterFn,
      },
      {
        accessorFn: (row) => row.supplier.name,
        id: "supplierName",
        header: "Fornitore",
        size: 200,
      },
      {
        accessorFn: (row) => {
          const map: Record<string, string> = {
            CASH: "Contanti",
            BANK_TRANSFER: "Bonifico",
            DIRECT_DEBIT: "Addebito diretto",
          };
          const pm = row.supplier.paymentMethod;
          return pm ? (map[pm] ?? pm) : null;
        },
        id: "supplierPaymentMethod",
        header: "Modalità di pagamento",
        size: 180,
        filterVariant: "multi-select",
        Cell: ({ row }) => {
          const value = row.original.supplier.paymentMethod;
          if (!value) return <span>—</span>;
          const map: Record<string, { label: string; color: string }> = {
            CASH: { label: "Contanti", color: "green" },
            BANK_TRANSFER: { label: "Bonifico", color: "blue" },
            DIRECT_DEBIT: { label: "Addebito diretto", color: "orange" },
          };
          const entry = map[value];
          return entry ? (
            <Badge variant="light" color={entry.color} size="sm">{entry.label}</Badge>
          ) : (
            <span>{value}</span>
          );
        },
      },
      {
        accessorKey: "taxableAmount",
        header: "Imponibile",
        size: 130,
        mantineTableBodyCellProps: { align: "right" },
        mantineTableHeadCellProps: { align: "right" },
        Cell: ({ row }) =>
          formatCurrency(row.original.taxableAmount, row.original.creditNote),
        filterVariant: "range",
        Footer: ({ table }) => {
          const rows = table.getFilteredRowModel().rows;
          let total = 0;
          for (const r of rows) {
            const inv = r.original;
            total += (inv.creditNote ? -1 : 1) * inv.taxableAmount;
          }
          return (
            <Text fw={700} size="sm" ta="right">
              {formatCurrency(total)}
            </Text>
          );
        },
      },
      {
        accessorKey: "taxAmount",
        header: "Imposta",
        size: 120,
        mantineTableBodyCellProps: { align: "right" },
        mantineTableHeadCellProps: { align: "right" },
        Cell: ({ row }) =>
          formatCurrency(row.original.taxAmount, row.original.creditNote),
        filterVariant: "range",
        Footer: ({ table }) => {
          const rows = table.getFilteredRowModel().rows;
          let total = 0;
          for (const r of rows) {
            const inv = r.original;
            total += (inv.creditNote ? -1 : 1) * inv.taxAmount;
          }
          return (
            <Text fw={700} size="sm" ta="right">
              {formatCurrency(total)}
            </Text>
          );
        },
      },
      {
        accessorKey: "totalAmount",
        header: "Totale",
        size: 130,
        mantineTableBodyCellProps: { align: "right" },
        mantineTableHeadCellProps: { align: "right" },
        Cell: ({ row }) => (
          <Text fw={600} size="sm">
            {formatCurrency(row.original.totalAmount, row.original.creditNote)}
          </Text>
        ),
        filterVariant: "range",
        Footer: ({ table }) => {
          const rows = table.getFilteredRowModel().rows;
          let total = 0;
          for (const r of rows) {
            const inv = r.original;
            total += (inv.creditNote ? -1 : 1) * inv.totalAmount;
          }
          return (
            <Text fw={700} size="sm" ta="right">
              {formatCurrency(total)}
            </Text>
          );
        },
      },
    ],
    [],
  );

  const table = useMantineReactTable({
    columns,
    data: filteredInvoices,
    enableColumnFilterModes: true,
    enableColumnOrdering: true,
    enableFacetedValues: true,
    enableColumnPinning: true,
    enableRowActions: true,
    enableColumnFilters: true,
    enableSorting: true,
    enableGlobalFilter: true,
    enableDensityToggle: true,
    enableFullScreenToggle: true,
    getRowId: (row) => row.id,
    localization: MRT_Localization_IT,
    initialState: {
      showGlobalFilter: true,
      showColumnFilters: false,
      sorting: [{ id: "date", desc: true }],
      density: "xs",
      pagination: { pageIndex: 0, pageSize: 50 },
      columnVisibility: {
        documentType: false,
        invoiceNumber: false,
        taxableAmount: false,
        taxAmount: false,
      },
      columnPinning: {
        right: ["mrt-row-actions"],
      },
    },
    paginationDisplayMode: "pages",
    mantinePaginationProps: {
      radius: "md",
      size: "sm",
    },
    mantineSearchTextInputProps: {
      placeholder: "Cerca nelle fatture...",
    },
    positionActionsColumn: "last",
    displayColumnDefOptions: {
      "mrt-row-actions": {
        header: "Azioni",
        size: 120,
      },
    },
    renderRowActions: ({ row }) => (
      <Group gap="xs" justify="center" wrap="nowrap">
        <Tooltip label="Visualizza">
          <ActionIcon
            variant="subtle"
            color="blue"
            aria-label="Visualizza"
            onClick={() => onView(row.original)}
          >
            <IconEye size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Modifica">
          <ActionIcon
            variant="subtle"
            color="yellow"
            aria-label="Modifica"
            onClick={() => onEdit(row.original)}
          >
            <IconEdit size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Elimina">
          <ActionIcon
            variant="subtle"
            color="red"
            aria-label="Elimina"
            onClick={() => onDelete(row.original)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    ),
    renderEmptyRowsFallback: () => (
      <Text ta="center" c="dimmed" py="lg">
        {invoices.length === 0
          ? "Nessuna fattura presente. Carica un file per iniziare."
          : "Nessun risultato trovato."}
      </Text>
    ),
    renderBottomToolbarCustomActions: ({ table }) => {
      const rowCount = table.getFilteredRowModel().rows.length;
      return (
        <Text size="sm" c="dimmed" pl="sm">
          {rowCount} fattur{rowCount === 1 ? "a" : "e"}
        </Text>
      );
    },
    mantineTableProps: {
      striped: true,
      highlightOnHover: true,
      withTableBorder: true,
      withColumnBorders: true,
    },
  });

  return (
    <>
      <ScrollArea type="scroll" offsetScrollbars={false} mb="sm">
        <SegmentedControl
          value={datePreset}
          onChange={(value) => setDatePreset(value as DatePreset)}
          data={[
            { label: "Tutte", value: "all" },
            { label: "Questo mese", value: "thisMonth" },
            { label: "Mese scorso", value: "lastMonth" },
            { label: "Due mesi fa", value: "twoMonthsAgo" },
            { label: "Tre mesi fa", value: "threeMonthsAgo" },
            { label: "Ultimi 3 mesi", value: "last3Months" },
            { label: "Anno corrente", value: "thisYear" },
            { label: "Anno precedente", value: "previousYear" },
          ]}
          size="xs"
          style={{ minWidth: "fit-content" }}
        />
      </ScrollArea>
      <MantineReactTable table={table} />
    </>
  );
}
