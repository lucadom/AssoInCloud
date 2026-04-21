"use client";

import { Group, Text, Button, Paper } from "@mantine/core";
import { IconTrash, IconArrowsMove, IconFileZip } from "@tabler/icons-react";

interface BulkActionToolbarProps {
  selectedCount: number;
  onMove: () => void;
  onDelete: () => void;
  onDownload: () => void;
}

export function BulkActionToolbar({ selectedCount, onMove, onDelete, onDownload }: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <Paper withBorder p="xs" bg="blue.0">
      <Group justify="space-between">
        <Text size="sm" fw={500}>
          {selectedCount} {selectedCount === 1 ? "file selezionato" : "file selezionati"}
        </Text>
        <Group gap="xs">
          <Button size="xs" variant="light" leftSection={<IconArrowsMove size={14} />} onClick={onMove}>
            Sposta
          </Button>
          <Button size="xs" variant="light" color="red" leftSection={<IconTrash size={14} />} onClick={onDelete}>
            Elimina
          </Button>
          <Button size="xs" variant="light" leftSection={<IconFileZip size={14} />} onClick={onDownload}>
            Scarica come ZIP
          </Button>
        </Group>
      </Group>
    </Paper>
  );
}
