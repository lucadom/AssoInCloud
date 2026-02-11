"use client";

import { useMemo } from "react";
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
} from "mantine-react-table";
import { MRT_Localization_IT } from "mantine-react-table/locales/it/index.esm.mjs";
import {
  ActionIcon,
  Badge,
  Group,
  Tooltip,
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import type { Supplier } from "@/types";

interface SuppliersTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export function SuppliersTable({
  suppliers,
  onEdit,
  onDelete,
}: SuppliersTableProps) {
  const columns = useMemo<MRT_ColumnDef<Supplier>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Ragione sociale",
        size: 300,
      },
      {
        accessorKey: "vatNumber",
        header: "Partita IVA",
        size: 200,
        Cell: ({ cell }) => (
          <Badge variant="light" size="sm">
            {cell.getValue<string>()}
          </Badge>
        ),
      },
      {
        accessorKey: "invoiceCount",
        header: "Fatture",
        size: 100,
        mantineTableHeadCellProps: { align: "center" },
        mantineTableBodyCellProps: { align: "center" },
        filterVariant: "range",
        Cell: ({ cell }) => {
          const count = cell.getValue<number>();
          return (
            <Badge variant="light" color={count > 0 ? "blue" : "gray"} size="sm">
              {count}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  const table = useMantineReactTable({
    columns,
    data: suppliers,
    enableColumnFilterModes: true,
    enableColumnOrdering: true,
    enableFacetedValues: true,
    enableColumnPinning: true,
    enableRowActions: true,
    enableSorting: true,
    enableGlobalFilter: true,
    getRowId: (row) => row.id,
    localization: MRT_Localization_IT,
    initialState: {
      showGlobalFilter: true,
      density: "xs",
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
      placeholder: "Cerca fornitori...",
    },
    positionActionsColumn: "last",
    displayColumnDefOptions: {
      "mrt-row-actions": {
        header: "Azioni",
        size: 100,
      },
    },
    renderRowActions: ({ row }) => (
      <Group gap="xs" justify="center" wrap="nowrap">
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
        <Tooltip label={row.original.invoiceCount > 0 ? "Ha fatture associate" : "Elimina"}>
          <ActionIcon
            variant="subtle"
            color={row.original.invoiceCount > 0 ? "gray" : "red"}
            aria-label={row.original.invoiceCount > 0 ? "Ha fatture associate" : "Elimina"}
            onClick={() => onDelete(row.original)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    ),
    renderEmptyRowsFallback: () => (
      <div style={{ textAlign: "center", padding: "2rem", color: "var(--mantine-color-dimmed)" }}>
        {suppliers.length === 0
          ? "Nessun fornitore presente."
          : "Nessun risultato trovato."}
      </div>
    ),
    mantineTableProps: {
      striped: true,
      highlightOnHover: true,
      withTableBorder: true,
      withColumnBorders: true,
    },
  });

  return <MantineReactTable table={table} />;
}
