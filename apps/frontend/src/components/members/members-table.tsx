"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
} from "mantine-react-table";
import { MRT_Localization_IT } from "mantine-react-table/locales/it/index.esm.mjs";
import { ActionIcon, Group, Text, Tooltip } from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import type { Member } from "@/types";

interface MembersTableProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("it-IT");
}

export function MembersTable({ members, onEdit, onDelete }: MembersTableProps) {
  const columns = useMemo<MRT_ColumnDef<Member>[]>(
    () => [
      {
        accessorKey: "lastName",
        header: "Cognome",
        size: 150,
      },
      {
        accessorKey: "firstName",
        header: "Nome",
        size: 150,
      },
      {
        accessorKey: "fiscalCode",
        header: "Codice Fiscale",
        size: 140,
      },
      {
        accessorKey: "birthDate",
        header: "Data di nascita",
        size: 130,
        Cell: ({ cell }) => formatDate(cell.getValue<string | null>()),
      },
      {
        accessorKey: "city",
        header: "Città",
        size: 130,
        Cell: ({ cell }) => cell.getValue<string | null>() || "—",
      },
      {
        accessorKey: "phone",
        header: "Telefono",
        size: 130,
        Cell: ({ cell }) => cell.getValue<string | null>() || "—",
      },
      {
        accessorKey: "membershipDate",
        header: "Data accettazione",
        size: 140,
        Cell: ({ cell }) => formatDate(cell.getValue<string | null>()),
      },
    ],
    [],
  );

  const table = useMantineReactTable({
    columns,
    data: members,
    enableColumnFilterModes: true,
    enableColumnOrdering: true,
    enableFacetedValues: true,
    enablePinning: true,
    enableRowActions: true,
    enableSorting: true,
    localization: MRT_Localization_IT,
    initialState: {
      density: "xs",
      pagination: { pageIndex: 0, pageSize: 50 },
      columnVisibility: {
        city: false,
        membershipDate: false,
      },
      columnPinning: {
        right: ["mrt-row-actions"],
      },
    },
    positionActionsColumn: "last",
    paginationDisplayMode: "pages",
    mantinePaginationProps: {
      radius: "md",
      size: "sm",
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
    displayColumnDefOptions: {
      "mrt-row-actions": {
        header: "Azioni",
        size: 120,
      },
    },
    renderBottomToolbarCustomActions: ({ table }) => {
      const rowCount = table.getFilteredRowModel().rows.length;
      return (
        <Text size="sm" c="dimmed" pl="sm">
          {rowCount} soci
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

  return <MantineReactTable table={table} />;
}
