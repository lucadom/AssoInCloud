"use client";

import { ActionIcon, Badge, Box, Button, Group, Stack, Text, Tooltip, UnstyledButton } from "@mantine/core";
import { IconChevronDown, IconMail, IconMailOpened } from "@tabler/icons-react";
import type { PecMessageSummary } from "@/types";

interface Props {
  messages: PecMessageSummary[];
  selectedUid: number | null;
  onSelect: (msg: PecMessageSummary) => void;
  onToggleRead: (msg: PecMessageSummary, read: boolean) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export function MessageList({ messages, selectedUid, onSelect, onToggleRead, hasMore, loadingMore, onLoadMore }: Props) {
  if (messages.length === 0) {
    return (
      <Text c="dimmed" size="sm" p="md">
        Nessun messaggio in questa cartella
      </Text>
    );
  }

  return (
    <Stack gap={0}>
      {messages.map((msg) => (
        <UnstyledButton
          key={msg.uid}
          onClick={() => onSelect(msg)}
          p="sm"
          style={(theme) => ({
            borderBottom: `1px solid ${theme.colors.gray[2]}`,
            backgroundColor:
              selectedUid === msg.uid ? theme.colors.blue[0] : undefined,
          })}
        >
          <Group justify="space-between" wrap="nowrap" gap="xs">
            <Text
              fw={msg.read ? 400 : 700}
              size="sm"
              truncate="end"
              style={{ flex: 1 }}
            >
              {msg.from || "(mittente sconosciuto)"}
            </Text>
            <Group gap={4} wrap="nowrap">
              <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
                {new Date(msg.date).toLocaleDateString("it-IT")}
              </Text>
              <Tooltip
                label={msg.read ? "Segna come da leggere" : "Segna come letta"}
                withArrow
                position="left"
              >
                <ActionIcon
                  component="span"
                  variant="subtle"
                  color="gray"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleRead(msg, !msg.read);
                  }}
                >
                  {msg.read ? <IconMailOpened size={13} /> : <IconMail size={13} />}
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
          <Group justify="space-between" wrap="nowrap" gap="xs">
            <Text size="xs" c="dimmed" truncate="end" style={{ flex: 1 }}>
              {msg.subject || "(nessun oggetto)"}
            </Text>
            {!msg.read && (
              <Badge size="xs" variant="dot" color="blue">
                Da leggere
              </Badge>
            )}
          </Group>
        </UnstyledButton>
      ))}
      {hasMore && (
        <Box p="sm" style={{ textAlign: "center" }}>
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconChevronDown size={14} />}
            loading={loadingMore}
            onClick={onLoadMore}
          >
            Carica altri messaggi
          </Button>
        </Box>
      )}
    </Stack>
  );
}
