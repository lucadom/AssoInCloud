"use client";

import { useRef } from "react";
import {
  ActionIcon,
  Modal,
  Popover,
  Text,
  Button,
  Group,
  Stack,
  rem,
} from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import {
  IconHelpCircle,
  IconUpload,
  IconFileSpreadsheet,
  IconX,
} from "@tabler/icons-react";

interface CsvUploadModalProps {
  opened: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  loading?: boolean;
}

export function CsvUploadModal({
  opened,
  onClose,
  onUpload,
  loading,
}: CsvUploadModalProps) {
  const openRef = useRef<(() => void) | null>(null);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Carica CSV Soci"
      size="lg"
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Carica un file CSV contenente l&apos;elenco dei soci. Se un socio esiste già
          (identificato dal codice fiscale), i dati verranno aggiornati con i valori
          presenti nel CSV.
          <Popover position="bottom-end" withArrow shadow="md">
            <Popover.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                aria-label="Formato CSV"
                style={{ marginLeft: rem(6), verticalAlign: "middle" }}
              >
                <IconHelpCircle size={16} stroke={1.5} />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown>
              <Stack gap={4}>
                <Text size="sm" fw={600}>
                  Formato richiesto
                </Text>
                <Text
                  size="sm"
                  c="dimmed"
                  style={{ whiteSpace: "pre", fontFamily: "var(--mantine-font-family-monospace)" }}
                >
                  Cognome;Nome;Codice fiscale;Data di nascita;Nato a;Residenza;Citta;Telefono;Data accettazione
                </Text>
              </Stack>
            </Popover.Dropdown>
          </Popover>
        </Text>

        <Dropzone
          openRef={openRef}
          onDrop={(files) => {
            if (files.length > 0) onUpload(files[0]);
          }}
          accept={[MIME_TYPES.csv, "text/csv"]}
          loading={loading}
          maxFiles={1}
        >
          <Group
            justify="center"
            gap="xl"
            mih={160}
            style={{ pointerEvents: "none" }}
          >
            <Dropzone.Accept>
              <IconUpload
                style={{
                  width: rem(52),
                  height: rem(52),
                  color: "var(--mantine-color-blue-6)",
                }}
                stroke={1.5}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX
                style={{
                  width: rem(52),
                  height: rem(52),
                  color: "var(--mantine-color-red-6)",
                }}
                stroke={1.5}
              />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconFileSpreadsheet
                style={{
                  width: rem(52),
                  height: rem(52),
                  color: "var(--mantine-color-dimmed)",
                }}
                stroke={1.5}
              />
            </Dropzone.Idle>

            <div>
              <Text size="xl" inline>
                Trascina il file CSV qui o clicca per selezionare
              </Text>
              <Text size="sm" c="dimmed" inline mt={7}>
                Il file deve essere in formato CSV con separatore punto e virgola (;)
              </Text>
            </div>
          </Group>
        </Dropzone>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Chiudi
          </Button>
          <Button
            onClick={() => openRef.current?.()}
            leftSection={<IconUpload size={16} />}
            loading={loading}
          >
            Seleziona file
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
