"use client";

import { Badge, NavLink, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconFolder, IconFolderOpen } from "@tabler/icons-react";
import type { PecFolder } from "@/types";

interface Props {
  folders: PecFolder[];
  selected: string | null;
  onSelect: (folderFullName: string) => void;
}

export function FolderList({ folders, selected, onSelect }: Props) {
  if (folders.length === 0) {
    return (
      <Text c="dimmed" size="sm" p="sm">
        Nessuna cartella disponibile
      </Text>
    );
  }

  return (
    <Stack gap={2} p={4}>
      {folders.map((f) => (
        <NavLink
          key={f.fullName}
          label={f.name}
          description={`${f.messageCount} messaggi`}
          active={selected === f.fullName}
          onClick={() => onSelect(f.fullName)}
          leftSection={
            <ThemeIcon variant="light" size="sm">
              {selected === f.fullName ? (
                <IconFolderOpen size={14} />
              ) : (
                <IconFolder size={14} />
              )}
            </ThemeIcon>
          }
          rightSection={
            f.unreadCount > 0 ? (
              <Badge size="xs" variant="filled" color="blue">
                {f.unreadCount}
              </Badge>
            ) : null
          }
        />
      ))}
    </Stack>
  );
}
