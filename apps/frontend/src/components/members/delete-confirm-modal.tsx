"use client";

import { Modal, Text, Button, Group } from "@mantine/core";
import type { Member } from "@/types";

interface DeleteConfirmModalProps {
  member: Member | null;
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteConfirmModal({
  member,
  opened,
  onClose,
  onConfirm,
  loading,
}: DeleteConfirmModalProps) {
  if (!member) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Conferma eliminazione"
      size="md"
      centered
    >
      <Text size="sm">
        Sei sicuro di voler eliminare il socio{" "}
        <Text span fw={700}>
          {member.firstName} {member.lastName}
        </Text>
        ?
      </Text>
      <Text size="sm" mt="sm" c="dimmed">
        Questa azione non può essere annullata.
      </Text>

      <Group justify="flex-end" mt="xl">
        <Button variant="default" onClick={onClose}>
          Annulla
        </Button>
        <Button color="red" onClick={onConfirm} loading={loading}>
          Elimina
        </Button>
      </Group>
    </Modal>
  );
}
