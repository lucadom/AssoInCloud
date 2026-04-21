"use client";

import { useEffect, useState } from "react";
import { Modal, Button, Group, Stack, Text, ScrollArea, NavLink } from "@mantine/core";
import { IconFolder } from "@tabler/icons-react";
import type { Folder } from "@/types";
import { listContents } from "@/lib/api/documents";

interface MoveModalProps {
  opened: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (targetPath: string) => Promise<void>;
}

export function MoveModal({ opened, title, onClose, onConfirm }: MoveModalProps) {
  const [selectedPath, setSelectedPath] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (opened) {
      setSelectedPath("");
      loadFolders("");
    }
  }, [opened]);

  const loadFolders = async (path: string) => {
    try {
      const contents = await listContents(path);
      setFolders(contents.folders);
      setSelectedPath(path);
    } catch {
      setFolders([]);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm(selectedPath);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore nello spostamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={title}>
      <Stack>
        <Text size="sm" c="dimmed">
          Seleziona la cartella di destinazione
        </Text>
        <ScrollArea h={200} type="scroll">
          <NavLink
            label="Documenti (radice)"
            active={selectedPath === ""}
            onClick={() => { setSelectedPath(""); setFolders([]); loadFolders(""); }}
            leftSection={<IconFolder size={16} />}
          />
          {folders.map((f) => (
            <NavLink
              key={f.path}
              label={f.name}
              active={selectedPath === f.path}
              onClick={() => loadFolders(f.path)}
              leftSection={<IconFolder size={16} />}
              pl="md"
            />
          ))}
        </ScrollArea>
        {error && <Text c="red" size="sm">{error}</Text>}
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={handleConfirm} loading={loading}>
            Sposta qui
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
