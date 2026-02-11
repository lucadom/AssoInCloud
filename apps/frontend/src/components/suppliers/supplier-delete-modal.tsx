"use client";

import {
  Modal,
  Text,
  Button,
  Group,
  Stack,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import type { Supplier } from "@/types";

interface SupplierDeleteModalProps {
  supplier: Supplier | null;
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function SupplierDeleteModal({
  supplier,
  opened,
  onClose,
  onConfirm,
  loading,
}: SupplierDeleteModalProps) {
  if (!supplier) return null;

  const hasInvoices = supplier.invoiceCount > 0;

  return (
    <Modal opened={opened} onClose={onClose} title="Elimina Fornitore" centered>
      <Stack gap="md">
        {hasInvoices ? (
          <>
            <Group gap="sm">
              <IconAlertTriangle size={24} color="var(--mantine-color-yellow-6)" />
              <Text>
                Il fornitore{" "}
                <Text span fw={700}>
                  {supplier.name}
                </Text>{" "}
                ha{" "}
                <Text span fw={700}>
                  {supplier.invoiceCount}
                </Text>{" "}
                fattura/e associate e non può essere eliminato.
              </Text>
            </Group>
            <Text size="sm" c="dimmed">
              Elimina prima le fatture associate a questo fornitore.
            </Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={onClose}>
                Chiudi
              </Button>
            </Group>
          </>
        ) : (
          <>
            <Group gap="sm">
              <IconAlertTriangle size={24} color="var(--mantine-color-red-6)" />
              <Text>
                Sei sicuro di voler eliminare il fornitore{" "}
                <Text span fw={700}>
                  {supplier.name}
                </Text>{" "}
                (P.IVA: {supplier.vatNumber})?
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
          </>
        )}
      </Stack>
    </Modal>
  );
}
