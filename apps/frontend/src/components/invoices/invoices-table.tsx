"use client";

import { useMemo, useState } from "react";
import {
  Table,
  ActionIcon,
  Group,
  Text,
  Tooltip,
  ScrollArea,
  TextInput,
  UnstyledButton,
  Center,
  rem,
  Button,
  SegmentedControl,
  Pagination,
  Select,
} from "@mantine/core";
import { DatePickerInput, type DatesRangeValue } from "@mantine/dates";
import {
  IconEye,
  IconEdit,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
  IconCalendar,
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

type SortField =
  | "documentType"
  | "invoiceNumber"
  | "date"
  | "supplierName"
  | "vatNumber"
  | "taxableAmount"
  | "taxAmount"
  | "totalAmount";

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
  ta?: string;
}) {
  const Icon =
    sortField === field
      ? sortDir === "asc"
        ? IconChevronUp
        : IconChevronDown
      : IconSelector;

  return (
    <Table.Th style={{ textAlign: (ta as any) ?? "left" }}>
      <UnstyledButton
        onClick={() => onSort(field)}
        style={{ display: "flex", alignItems: "center", gap: 4, width: "100%" }}
      >
        <Text fw={700} size="sm" style={{ flex: 1, textAlign: (ta as any) ?? "left" }}>
          {label}
        </Text>
        <Center style={{ width: rem(20), height: rem(20) }}>
          <Icon size={14} stroke={1.5} />
        </Center>
      </UnstyledButton>
    </Table.Th>
  );
}

function getValue(invoice: Invoice, field: SortField): string | number {
  switch (field) {
    case "documentType":
      return invoice.documentType || "";
    case "invoiceNumber":
      return invoice.invoiceNumber;
    case "date":
      return invoice.date;
    case "supplierName":
      return invoice.supplier.name;
    case "vatNumber":
      return invoice.supplier.vatNumber;
    case "taxableAmount":
      return invoice.taxableAmount;
    case "taxAmount":
      return invoice.taxAmount;
    case "totalAmount":
      return invoice.totalAmount;
  }
}

type DatePreset = "all" | "lastMonth" | "last3Months" | "last6Months" | "thisYear" | "custom";

function getPresetRange(preset: DatePreset): [Date | null, Date | null] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case "lastMonth": {
      const from = new Date(today);
      from.setMonth(from.getMonth() - 1);
      return [from, today];
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
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField | null>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [dateRange, setDateRange] = useState<DatesRangeValue>([null, null]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  };

  const handlePresetChange = (value: string) => {
    const preset = value as DatePreset;
    setDatePreset(preset);
    if (preset !== "custom") {
      setDateRange(getPresetRange(preset));
    }
    setPage(1);
  };

  const handleDateRangeChange = (value: DatesRangeValue) => {
    setDateRange(value);
    setDatePreset("custom");
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = invoices;

    // Date range filter
    const [from, to] = datePreset === "custom" ? dateRange : getPresetRange(datePreset);
    if (from || to) {
      result = result.filter((inv) => {
        const d = new Date(inv.date);
        if (from && d < from) return false;
        if (to) {
          const endOfDay = new Date(to);
          endOfDay.setHours(23, 59, 59, 999);
          if (d > endOfDay) return false;
        }
        return true;
      });
    }

    if (q) {
      result = result.filter(
        (inv) =>
          (inv.documentType || "").toLowerCase().includes(q) ||
          inv.invoiceNumber.toLowerCase().includes(q) ||
          formatDate(inv.date).includes(q) ||
          inv.supplier.name.toLowerCase().includes(q) ||
          inv.supplier.vatNumber.includes(q) ||
          String(inv.taxableAmount).includes(q) ||
          String(inv.taxAmount).includes(q) ||
          String(inv.totalAmount).includes(q)
      );
    }

    if (sortField) {
      result = [...result].sort((a, b) => {
        const va = getValue(a, sortField);
        const vb = getValue(b, sortField);
        const cmp =
          typeof va === "number" && typeof vb === "number"
            ? va - vb
            : String(va).localeCompare(String(vb), "it");
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [invoices, search, sortField, sortDir, datePreset, dateRange]);
  const totals = useMemo(() => {
    let taxableAmount = 0;
    let taxAmount = 0;
    let totalAmount = 0;
    for (const inv of filtered) {
      const sign = inv.documentType === "Nota di credito" ? -1 : 1;
      taxableAmount += sign * inv.taxableAmount;
      taxAmount += sign * inv.taxAmount;
      totalAmount += sign * inv.totalAmount;
    }
    return { count: filtered.length, taxableAmount, taxAmount, totalAmount };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePageSizeChange = (value: string | null) => {
    if (value) {
      setPageSize(Number(value));
      setPage(1);
    }
  };

  return (
    <>
      <Group gap="sm" mb="sm" align="flex-end">
        <TextInput
          placeholder="Filtra fatture..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => handleSearchChange(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <DatePickerInput
          type="range"
          label="Periodo"
          placeholder="Seleziona intervallo"
          value={dateRange}
          onChange={handleDateRangeChange}
          valueFormat="DD/MM/YYYY"
          leftSection={<IconCalendar size={16} />}
          clearable
          w={280}
        />
      </Group>
      <SegmentedControl
        value={datePreset}
        onChange={handlePresetChange}
        data={[
          { label: "Tutte", value: "all" },
          { label: "Ultimo mese", value: "lastMonth" },
          { label: "Ultimi 3 mesi", value: "last3Months" },
          { label: "Ultimi 6 mesi", value: "last6Months" },
          { label: "Anno corrente", value: "thisYear" },
          { label: "Personalizzato", value: "custom" },
        ]}
        mb="sm"
        size="xs"
      />
      <ScrollArea>
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <SortableHeader label="Tipo" field="documentType" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Numero" field="invoiceNumber" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Data" field="date" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Fornitore" field="supplierName" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Imponibile" field="taxableAmount" sortField={sortField} sortDir={sortDir} onSort={handleSort} ta="right" />
              <SortableHeader label="Imposta" field="taxAmount" sortField={sortField} sortDir={sortDir} onSort={handleSort} ta="right" />
              <SortableHeader label="Totale" field="totalAmount" sortField={sortField} sortDir={sortDir} onSort={handleSort} ta="right" />
              <Table.Th ta="center">Azioni</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Text ta="center" c="dimmed" py="lg">
                    {invoices.length === 0
                      ? "Nessuna fattura presente. Carica un file per iniziare."
                      : "Nessun risultato trovato."}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {paginatedRows.map((invoice) => {
              const isCreditNote = invoice.documentType === "Nota di credito";
              return (
              <Table.Tr key={invoice.id}>
                <Table.Td>{invoice.documentType || "—"}</Table.Td>
                <Table.Td>{invoice.invoiceNumber}</Table.Td>
                <Table.Td>{formatDate(invoice.date)}</Table.Td>
                <Table.Td>{invoice.supplier.name}</Table.Td>
                <Table.Td ta="right">{formatCurrency(invoice.taxableAmount, isCreditNote)}</Table.Td>
                <Table.Td ta="right">{formatCurrency(invoice.taxAmount, isCreditNote)}</Table.Td>
                <Table.Td ta="right" fw={600}>
                  {formatCurrency(invoice.totalAmount, isCreditNote)}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="center" wrap="nowrap">
                    <Tooltip label="Visualizza">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => onView(invoice)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Modifica">
                      <ActionIcon
                        variant="subtle"
                        color="yellow"
                        onClick={() => onEdit(invoice)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Elimina">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => onDelete(invoice)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
              );
            })}
          </Table.Tbody>
          {filtered.length > 0 && (
            <Table.Tfoot>
              <Table.Tr style={{ backgroundColor: "var(--mantine-color-gray-1)" }}>
                <Table.Td colSpan={4}>
                  <Text fw={700} size="sm">
                    Totale: {totals.count} fattur{totals.count === 1 ? "a" : "e"}
                  </Text>
                </Table.Td>
                <Table.Td ta="right">
                  <Text fw={700} size="sm">
                    {formatCurrency(totals.taxableAmount)}
                  </Text>
                </Table.Td>
                <Table.Td ta="right">
                  <Text fw={700} size="sm">
                    {formatCurrency(totals.taxAmount)}
                  </Text>
                </Table.Td>
                <Table.Td ta="right">
                  <Text fw={700} size="sm">
                    {formatCurrency(totals.totalAmount)}
                  </Text>
                </Table.Td>
                <Table.Td />
              </Table.Tr>
            </Table.Tfoot>
          )}
        </Table>
      </ScrollArea>
      {filtered.length > 0 && (
        <Group justify="space-between" mt="sm">
          <Group gap="xs" align="center">
            <Text size="sm" c="dimmed">
              Righe per pagina:
            </Text>
            <Select
              data={["25", "50", "100", "200"]}
              value={String(pageSize)}
              onChange={handlePageSizeChange}
              w={80}
              size="xs"
            />
          </Group>
          <Pagination
            total={totalPages}
            value={safePage}
            onChange={setPage}
            size="sm"
          />
          <Text size="sm" c="dimmed">
            {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} di {filtered.length}
          </Text>
        </Group>
      )}
    </>
  );
}
