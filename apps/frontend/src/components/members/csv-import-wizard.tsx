"use client";

import { useState, useCallback } from "react";
import {
  Modal,
  Stepper,
  Stack,
  Text,
  Group,
  Button,
  Select,
  Table,
  Badge,
  Checkbox,
  Alert,
  rem,
  Pagination,
} from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import { notifications } from "@mantine/notifications";
import {
  IconUpload,
  IconFileSpreadsheet,
  IconX,
  IconAlertTriangle,
} from "@tabler/icons-react";
import type { CsvColumnMapping, CsvPreviewRow, CsvPreviewResponse } from "@/types";
import { previewCsvImport, confirmCsvImport } from "@/lib/api/members";

// ---------------------------------------------------------------------------
// Known Italian header → field identifier auto-mapping table
// ---------------------------------------------------------------------------
const ITALIAN_HEADER_MAP: Record<string, string> = {
  cognome: "lastName",
  nome: "firstName",
  "codice fiscale": "fiscalCode",
  "codice_fiscale": "fiscalCode",
  "data di nascita": "birthDate",
  "data_di_nascita": "birthDate",
  "nato a": "birthPlace",
  "nato_a": "birthPlace",
  residenza: "address",
  città: "city",
  citta: "city",
  telefono: "phone",
  "data accettazione": "membershipDate",
  "data_accettazione": "membershipDate",
};

const MEMBER_FIELD_OPTIONS = [
  { value: "", label: "Ignora" },
  { value: "lastName", label: "Cognome" },
  { value: "firstName", label: "Nome" },
  { value: "fiscalCode", label: "Codice fiscale" },
  { value: "birthDate", label: "Data di nascita" },
  { value: "birthPlace", label: "Nato a" },
  { value: "address", label: "Residenza" },
  { value: "city", label: "Città" },
  { value: "phone", label: "Telefono" },
  { value: "membershipDate", label: "Data accettazione" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function autoMapHeader(header: string): string {
  return ITALIAN_HEADER_MAP[header.trim().toLowerCase()] ?? "";
}

function parseCsvHeaders(text: string): string[] | null {
  const firstLine = text.split("\n")[0];
  if (!firstLine || firstLine.trim() === "") return null;
  return firstLine.split(";").map((h) => h.trim());
}

function validateMapping(mapping: CsvColumnMapping[]): string | null {
  const nonNullFields = mapping.map((m) => m.memberField).filter(Boolean);
  const hasFiscalCode = nonNullFields.includes("fiscalCode");
  if (!hasFiscalCode) return "Devi mappare almeno una colonna al campo Codice fiscale.";
  const seen = new Set<string>();
  for (const field of nonNullFields) {
    if (field && seen.has(field)) return `Il campo "${MEMBER_FIELD_OPTIONS.find((o) => o.value === field)?.label}" è assegnato a più colonne.`;
    if (field) seen.add(field);
  }
  return null;
}

function rowStatusBadge(status: CsvPreviewRow["rowStatus"]) {
  if (status === "new") return <Badge color="green">Nuovo</Badge>;
  if (status === "update") return <Badge color="blue">Aggiornamento</Badge>;
  return <Badge color="gray">Saltato</Badge>;
}

const PAGE_SIZE = 50;

// ---------------------------------------------------------------------------
// Exported pure helpers (used by tests)
// ---------------------------------------------------------------------------

export { autoMapHeader, parseCsvHeaders, validateMapping };



interface CsvImportWizardProps {
  opened: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function CsvImportWizard({ opened, onClose, onImported }: CsvImportWizardProps) {
  const [active, setActive] = useState(0);

  // Step 1
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  // Step 2
  const [mapping, setMapping] = useState<CsvColumnMapping[]>([]);
  const [mappingError, setMappingError] = useState<string | null>(null);

  // Step 3
  const [preview, setPreview] = useState<CsvPreviewResponse | null>(null);
  const [markAsActive, setMarkAsActive] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [page, setPage] = useState(1);

  const reset = useCallback(() => {
    setActive(0);
    setFile(null);
    setHeaders([]);
    setFileError(null);
    setMapping([]);
    setMappingError(null);
    setPreview(null);
    setMarkAsActive(false);
    setPage(1);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  // -- Step 1: file drop --
  const handleFileDrop = async (files: File[]) => {
    const dropped = files[0];
    if (!dropped) return;
    setFileError(null);
    const text = await dropped.text();
    const parsed = parseCsvHeaders(text);
    if (!parsed || parsed.length === 0) {
      setFileError("Impossibile leggere le intestazioni del file. Verifica che il file sia un CSV valido con separatore punto e virgola (;) e una riga di intestazione.");
      return;
    }
    const initialMapping: CsvColumnMapping[] = parsed.map((h) => ({
      csvHeader: h,
      memberField: autoMapHeader(h) || null,
    }));
    setFile(dropped);
    setHeaders(parsed);
    setMapping(initialMapping);
    setActive(1);
  };

  // -- Step 2: mapping change --
  const handleMappingChange = (index: number, value: string) => {
    setMapping((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], memberField: value || null };
      return updated;
    });
    setMappingError(null);
  };

  const handleGoToPreview = async () => {
    const err = validateMapping(mapping);
    if (err) {
      setMappingError(err);
      return;
    }
    setPreviewLoading(true);
    try {
      const result = await previewCsvImport(file!, mapping);
      setPreview(result);
      setPage(1);
      setActive(2);
    } catch (e) {
      setMappingError(e instanceof Error ? e.message : "Errore durante l'anteprima");
    } finally {
      setPreviewLoading(false);
    }
  };

  // -- Step 3: confirm --
  const handleConfirm = async () => {
    setConfirmLoading(true);
    try {
      const result = await confirmCsvImport(file!, mapping, markAsActive);
      notifications.show({
        title: "Importazione completata",
        message: `${result.imported} soci importati, ${result.updated} aggiornati, ${result.skipped} saltati`,
        color: "green",
      });
      onImported();
      handleClose();
    } catch (e) {
      notifications.show({
        title: "Errore importazione",
        message: e instanceof Error ? e.message : "Errore sconosciuto",
        color: "red",
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  // -- Summary counts --
  const newCount = preview?.rows.filter((r) => r.rowStatus === "new").length ?? 0;
  const updateCount = preview?.rows.filter((r) => r.rowStatus === "update").length ?? 0;
  const skipCount = preview?.rows.filter((r) => r.rowStatus === "skip").length ?? 0;

  // -- Paginated rows --
  const pagedRows = preview?.rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [];
  const totalPages = Math.ceil((preview?.rows.length ?? 0) / PAGE_SIZE);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Importa soci da CSV"
      size="xl"
      centered
    >
      <Stepper active={active} mb="lg" size="sm">
        <Stepper.Step label="Carica" description="File CSV" />
        <Stepper.Step label="Mappa colonne" description="Assegna i campi" />
        <Stepper.Step label="Anteprima" description="Rivedi e conferma" />
      </Stepper>

      {/* ---- Step 1: Upload ---- */}
      {active === 0 && (
        <Stack>
          <Text size="sm" c="dimmed">
            Carica un file CSV con separatore punto e virgola (;). Il file deve avere una riga di intestazione.
          </Text>
          {fileError && (
            <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light">
              {fileError}
            </Alert>
          )}
          <Dropzone
            onDrop={handleFileDrop}
            accept={[MIME_TYPES.csv, "text/csv", "text/plain"]}
            maxFiles={1}
          >
            <Group justify="center" gap="xl" mih={140} style={{ pointerEvents: "none" }}>
              <Dropzone.Accept>
                <IconUpload style={{ width: rem(52), height: rem(52), color: "var(--mantine-color-blue-6)" }} stroke={1.5} />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX style={{ width: rem(52), height: rem(52), color: "var(--mantine-color-red-6)" }} stroke={1.5} />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconFileSpreadsheet style={{ width: rem(52), height: rem(52), color: "var(--mantine-color-dimmed)" }} stroke={1.5} />
              </Dropzone.Idle>
              <div>
                <Text size="xl" inline>Trascina il file CSV qui o clicca per selezionare</Text>
                <Text size="sm" c="dimmed" inline mt={7}>Formato: Cognome;Nome;Codice fiscale;…</Text>
              </div>
            </Group>
          </Dropzone>
          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose}>Chiudi</Button>
          </Group>
        </Stack>
      )}

      {/* ---- Step 2: Column mapping ---- */}
      {active === 1 && (
        <Stack>
          <Text size="sm" c="dimmed">
            Associa ogni colonna del CSV al campo corrispondente del socio. Almeno una colonna deve essere mappata al{" "}
            <strong>Codice fiscale</strong>.
          </Text>
          {mappingError && (
            <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light">
              {mappingError}
            </Alert>
          )}
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Colonna CSV</Table.Th>
                <Table.Th>Campo socio</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {headers.map((header, i) => (
                <Table.Tr key={i}>
                  <Table.Td>
                    <Text size="sm" ff="monospace">{header}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Select
                      data={MEMBER_FIELD_OPTIONS}
                      value={mapping[i]?.memberField ?? ""}
                      onChange={(v) => handleMappingChange(i, v ?? "")}
                      size="xs"
                      w={200}
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setActive(0)} disabled={previewLoading}>Indietro</Button>
            <Button onClick={handleGoToPreview} loading={previewLoading}>Avanti</Button>
          </Group>
        </Stack>
      )}

      {/* ---- Step 3: Preview + Confirm ---- */}
      {active === 2 && preview && (
        <Stack>
          {preview.truncated && (
            <Alert icon={<IconAlertTriangle size={16} />} color="yellow" variant="light">
              Il file contiene {preview.totalRows} righe. Vengono mostrate solo le prime 5.000. Tutte le righe verranno importate alla conferma.
            </Alert>
          )}
          <Group gap="md">
            <Badge color="green" size="lg">{newCount} Nuovi</Badge>
            <Badge color="blue" size="lg">{updateCount} Aggiornamenti</Badge>
            <Badge color="gray" size="lg">{skipCount} Saltati</Badge>
          </Group>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>Stato</Table.Th>
                <Table.Th>Cognome</Table.Th>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Codice fiscale</Table.Th>
                <Table.Th>Città</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pagedRows.map((row) => (
                <Table.Tr key={row.rowNumber}>
                  <Table.Td>{row.rowNumber}</Table.Td>
                  <Table.Td>{rowStatusBadge(row.rowStatus)}</Table.Td>
                  <Table.Td>{row.lastName}</Table.Td>
                  <Table.Td>{row.firstName}</Table.Td>
                  <Table.Td>{row.fiscalCode}</Table.Td>
                  <Table.Td>{row.city}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          {totalPages > 1 && (
            <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
          )}
          <Checkbox
            label="Segna i soci importati come attivi per l'anno corrente"
            checked={markAsActive}
            onChange={(e) => setMarkAsActive(e.currentTarget.checked)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setActive(1)} disabled={confirmLoading}>Indietro</Button>
            <Button onClick={handleConfirm} loading={confirmLoading} color="green">
              Conferma importazione
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
