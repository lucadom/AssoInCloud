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
import { useMediaQuery } from "@mantine/hooks";
import { Dropzone } from "@mantine/dropzone";
import { IconUpload, IconFileText, IconX } from "@tabler/icons-react";

interface InvoiceUploadModalProps {
  opened: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
  loading?: boolean;
}

const ACCEPTED_MIME_TYPES = [
  "text/xml",
  "application/xml",
  "application/pkcs7-mime",
  "application/x-pkcs7-mime",
];

export function InvoiceUploadModal({
  opened,
  onClose,
  onUpload,
  loading,
}: InvoiceUploadModalProps) {
  const openRef = useRef<(() => void) | null>(null);
  const isMobile = useMediaQuery("(max-width: 48em)");

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Carica Fattura"
      size="lg"
      fullScreen={!!isMobile}
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Carica uno o più file fattura in formato XML o P7M (fattura elettronica). I
          file verranno elaborati e i dati delle fatture verranno estratti
          automaticamente.
        </Text>

        <Dropzone
          openRef={openRef}
          onDrop={(files) => {
            if (files.length > 0) onUpload(files);
          }}
          accept={ACCEPTED_MIME_TYPES}
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
              <IconFileText
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
                Trascina qui i file XML/P7M o clicca per selezionarli
              </Text>
              <Text size="sm" c="dimmed" inline mt={7}>
                Sono accettati uno o più file in formato XML e P7M
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
