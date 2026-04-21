"use client";

import { useState } from "react";
import { Modal, TextInput, Button, Group, Stack } from "@mantine/core";

interface CreateFolderModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void>;
}

export function CreateFolderModal({ opened, onClose, onConfirm }: CreateFolderModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!name.trim()) {
      setError("Il nome non può essere vuoto");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConfirm(name.trim());
      setName("");
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore nella creazione della cartella");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setError(null);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Nuova cartella">
      <Stack>
        <TextInput
          label="Nome cartella"
          placeholder="Inserisci il nome"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          error={error}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          autoFocus
        />
        <Group justify="flex-end">
          <Button variant="subtle" onClick={handleClose}>
            Annulla
          </Button>
          <Button onClick={handleConfirm} loading={loading}>
            Crea
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
