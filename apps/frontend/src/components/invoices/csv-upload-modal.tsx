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
import { useMediaQuery } from "@mantine/hooks";
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
  onUpload: (files: File[]) => void;
  loading?: boolean;
}

export function CsvUploadModal({
  opened,
  onClose,
  onUpload,
  loading,
}: CsvUploadModalProps) {
  const openRef = useRef<(() => void) | null>(null);
  const isMobile = useMediaQuery("(max-width: 48em)");

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Carica CSV"
      size="lg"
      fullScreen={!!isMobile}
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Carica uno o più file CSV contenente i dati delle fatture. I file verranno
          elaborati e le fatture verranno importate automaticamente.
          <Popover width={420} position="bottom-end" withArrow shadow="md">
            <Popover.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                aria-label="Formato CSV fatture"
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
                <Text size="sm">
                  Il formato richiesto è quello previsto dalla funzionalità di export fatture presente sul sito internet dell&apos;Agenzia delle Entrate. Il file CSV deve contenere le seguenti colonne in ordine:
                </Text>
                <Text
                  size="sm"
                  c="dimmed"
                  style={{ fontFamily: "var(--mantine-font-family-monospace)" }}
                >
                  Tipo documento;Numero fattura;Data;Partita IVA;Fornitore;Imponibile;Imposta;Numero SDI;Fattura visualizzata
                </Text>
              </Stack>
            </Popover.Dropdown>
          </Popover>
        </Text>

        <Dropzone
          openRef={openRef}
          onDrop={(files) => {
            if (files.length > 0) onUpload(files);
          }}
          accept={[MIME_TYPES.csv, "text/csv"]}
          loading={loading}
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
              <Text size="lg" inline>
                Trascina qui i file CSV o clicca per selezionarli
              </Text>
              <Text size="sm" c="dimmed" inline mt={7}>
                Sono accettati uno o più file in formato CSV
              </Text>
            </div>
          </Group>
        </Dropzone>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={() => openRef.current?.()} loading={loading}>
            Seleziona file
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
