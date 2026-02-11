"use client";

import { useMemo, useState } from "react";
import {
  Table,
  ActionIcon,
  Group,
  Text,
  Tooltip,
  Badge,
  ScrollArea,
  TextInput,
  UnstyledButton,
  Center,
  rem,
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
} from "@tabler/icons-react";
import type { Supplier } from "@/types";

interface SuppliersTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

type SortField = "name" | "vatNumber" | "invoiceCount";
type SortDir = "asc" | "desc";

function SortableHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
  ta,
}: {
  label: string;
  field: SortField;
  sortField: SortField | null;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  ta?: React.CSSProperties["textAlign"];
}) {
  const Icon =
    sortField === field
      ? sortDir === "asc"
        ? IconChevronUp
        : IconChevronDown
      : IconSelector;

  return (
    <Table.Th style={{ textAlign: ta ?? "left" }}>
      <UnstyledButton
        onClick={() => onSort(field)}
        style={{ display: "flex", alignItems: "center", gap: 4, width: "100%" }}
      >
        <Text fw={700} size="sm" style={{ flex: 1, textAlign: ta ?? "left" }}>
          {label}
        </Text>
        <Center style={{ width: rem(20), height: rem(20) }}>
          <Icon size={14} stroke={1.5} />
        </Center>
      </UnstyledButton>
    </Table.Th>
  );
}

export function SuppliersTable({
  suppliers,
  onEdit,
  onDelete,
}: SuppliersTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = suppliers;

    if (q) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.vatNumber.includes(q)
      );
    }

    if (sortField) {
      result = [...result].sort((a, b) => {
        let cmp: number;
        switch (sortField) {
          case "name":
            cmp = a.name.localeCompare(b.name, "it");
            break;
          case "vatNumber":
            cmp = a.vatNumber.localeCompare(b.vatNumber);
            break;
          case "invoiceCount":
            cmp = a.invoiceCount - b.invoiceCount;
            break;
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [suppliers, search, sortField, sortDir]);

  return (
    <>
      <TextInput
        placeholder="Filtra fornitori..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        mb="sm"
      />
      <ScrollArea>
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <SortableHeader label="Ragione sociale" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Partita IVA" field="vatNumber" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Fatture" field="invoiceCount" sortField={sortField} sortDir={sortDir} onSort={handleSort} ta="center" />
              <Table.Th ta="center">Azioni</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text ta="center" c="dimmed" py="lg">
                    {suppliers.length === 0
                      ? "Nessun fornitore presente."
                      : "Nessun risultato trovato."}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {filtered.map((supplier) => (
              <Table.Tr key={supplier.id}>
                <Table.Td>{supplier.name}</Table.Td>
                <Table.Td>
                  <Badge variant="light" size="sm">
                    {supplier.vatNumber}
                  </Badge>
                </Table.Td>
                <Table.Td ta="center">
                  <Badge variant="light" color={supplier.invoiceCount > 0 ? "blue" : "gray"} size="sm">
                    {supplier.invoiceCount}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="center" wrap="nowrap">
                    <Tooltip label="Modifica">
                      <ActionIcon
                        variant="subtle"
                        color="yellow"
                        onClick={() => onEdit(supplier)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label={supplier.invoiceCount > 0 ? "Ha fatture associate" : "Elimina"}>
                      <ActionIcon
                        variant="subtle"
                        color={supplier.invoiceCount > 0 ? "gray" : "red"}
                        onClick={() => onDelete(supplier)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </>
  );
}
