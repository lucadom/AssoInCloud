"use client";

import { useEffect, useState } from "react";
import { Modal, TextInput, Button, Group, Stack } from "@mantine/core";

interface RenameModalProps {
  opened: boolean;
  currentName: string;
  itemType: "file" | "folder";
  onClose: () => void;
  onConfirm: (name: string) => Promise<void>;
}

export function RenameModal({ opened, currentName, itemType, onClose, onConfirm }: RenameModalProps) {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(currentName);
    setError(null);
  }, [currentName, opened]);

  const handleConfirm = async () => {
    if (!name.trim()) {
      setError("Il nome non può essere vuoto");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConfirm(name.trim());
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore nel rinomino");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Rinomina ${itemType === "file" ? "file" : "cartella"}`}
    >
      <Stack>
        <TextInput
          label="Nuovo nome"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          error={error}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          autoFocus
        />
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={handleConfirm} loading={loading}>
            Rinomina
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
