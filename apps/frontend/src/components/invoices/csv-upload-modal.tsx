"use client";

import { useRef } from "react";
import {
  Modal,
  Text,
  Button,
  Group,
  Stack,
  rem,
} from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import { IconUpload, IconFileSpreadsheet, IconX } from "@tabler/icons-react";

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

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Carica CSV"
      size="lg"
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Carica uno o più file CSV contenente i dati delle fatture. I file verranno
          elaborati e le fatture verranno importate automaticamente.
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
