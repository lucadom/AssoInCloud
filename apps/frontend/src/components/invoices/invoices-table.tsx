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

type DatePreset = "all" | "lastMonth" | "previousMonth" | "last3Months" | "last6Months" | "thisYear" | "previousYear";

function getPresetRange(preset: DatePreset): [Date | null, Date | null] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case "lastMonth": {
      const from = new Date(today);
      from.setMonth(from.getMonth() - 1);
      return [from, today];
    }
    case "previousMonth": {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      return [from, to];
    }
    case "last3Months": {
      const from = new Date(today);
      from.setMonth(from.getMonth() - 3);
      return [from, today];
    }
    case "last6Months": {
      const from = new Date(today);
      from.setMonth(from.getMonth() - 6);
      return [from, today];
    }
    case "thisYear":
      return [new Date(today.getFullYear(), 0, 1), today];
    case "previousYear": {
      const from = new Date(today.getFullYear() - 1, 0, 1);
      const to = new Date(today.getFullYear() - 1, 11, 31);
      return [from, to];
    }
    default:
      return [null, null];
  }
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
      },
      {
        accessorFn: (row) => row.supplier.name,
        id: "supplierName",
        header: "Fornitore",
        size: 200,
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
      showColumnFilters: true,
      sorting: [{ id: "date", desc: true }],
      density: "xs",
      pagination: { pageIndex: 0, pageSize: 50 },
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
            { label: "Ultimo mese", value: "lastMonth" },
            { label: "Mese precedente", value: "previousMonth" },
            { label: "Ultimi 3 mesi", value: "last3Months" },
            { label: "Ultimi 6 mesi", value: "last6Months" },
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
