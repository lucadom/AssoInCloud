"use client";

import { useState, useCallback } from "react";
import {
  Table,
  TextInput,
  Text,
  ScrollArea,
  Stack,
  Title,
  Loader,
  Center,
  Group,
  Pagination,
  Select,
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

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 400);
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

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
      setPage(1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    doSearch(debouncedSearch);
  }, [debouncedSearch, doSearch]);

  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = results.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

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

      {!searched && !loading && (
        <Center py="xl">
          <Text c="dimmed" size="lg">
            Inserisci un termine di ricerca per trovare i prodotti nelle fatture.
            Usa * come carattere jolly (es: the*limone*12).
          </Text>
        </Center>
      )}

      {searched && results.length === 0 && !loading && (
        <Center py="xl">
          <Text c="dimmed">Nessun prodotto trovato.</Text>
        </Center>
      )}

      {results.length > 0 && (
        <>
          <Text size="sm" c="dimmed">
            {results.length} risultat{results.length === 1 ? "o" : "i"} trovat{results.length === 1 ? "o" : "i"}
          </Text>

          <ScrollArea>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fornitore</Table.Th>
                  <Table.Th>Data fattura</Table.Th>
                  <Table.Th>Descrizione</Table.Th>
                  <Table.Th ta="right">Quantità</Table.Th>
                  <Table.Th>U.M.</Table.Th>
                  <Table.Th ta="right">Prezzo unitario</Table.Th>
                  <Table.Th ta="right">Totale</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedRows.map((item) => (
                  <Table.Tr key={item.lineItemId}>
                    <Table.Td>{item.supplierName}</Table.Td>
                    <Table.Td>{formatDate(item.invoiceDate)}</Table.Td>
                    <Table.Td>{item.description}</Table.Td>
                    <Table.Td ta="right">{formatQuantity(item.quantity)}</Table.Td>
                    <Table.Td>{item.unitOfMeasure || "—"}</Table.Td>
                    <Table.Td ta="right">{formatCurrency(item.unitPrice)}</Table.Td>
                    <Table.Td ta="right" fw={600}>{formatCurrency(item.totalPrice)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>

          {results.length > pageSize && (
            <Group justify="space-between" mt="sm" wrap="wrap" gap="sm">
              <Group gap="xs" align="center">
                <Text size="sm" c="dimmed">Righe per pagina:</Text>
                <Select
                  data={["25", "50", "100", "200"]}
                  value={String(pageSize)}
                  onChange={(v) => { if (v) { setPageSize(Number(v)); setPage(1); } }}
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
                {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, results.length)} di {results.length}
              </Text>
            </Group>
          )}
        </>
      )}
    </Stack>
  );
}
