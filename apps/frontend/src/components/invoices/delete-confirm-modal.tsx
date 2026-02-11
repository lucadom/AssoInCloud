"use client";

import {
  Modal,
  Text,
  Button,
  Group,
  Stack,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import type { Invoice } from "@/types";

interface DeleteConfirmModalProps {
  invoice: Invoice | null;
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteConfirmModal({
  invoice,
  opened,
  onClose,
  onConfirm,
  loading,
}: DeleteConfirmModalProps) {
  if (!invoice) return null;

  return (
    <Modal opened={opened} onClose={onClose} title="Elimina Fattura" centered>
      <Stack gap="md">
        <Group gap="sm">
          <IconAlertTriangle size={24} color="var(--mantine-color-red-6)" />
          <Text>
            Sei sicuro di voler eliminare la fattura di{" "}
            <Text span fw={700}>
              {invoice.supplier.name}
            </Text>{" "}
            del{" "}
            <Text span fw={700}>
              {new Date(invoice.date).toLocaleDateString("it-IT")}
            </Text>
            ?
          </Text>
        </Group>
        <Text size="sm" c="dimmed">
          Questa azione non può essere annullata.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Annulla
          </Button>
          <Button color="red" onClick={onConfirm} loading={loading}>
            Elimina
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
