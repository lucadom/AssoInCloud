"use client";

import {
  Anchor,
  Badge,
  Button,
  Divider,
  Group,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconMail, IconMailOpened, IconPaperclip } from "@tabler/icons-react";
import type { PecMessage } from "@/types";
import { getPecAttachmentUrl } from "@/lib/api/pec";

interface Props {
  message: PecMessage | null;
  onToggleRead: (msg: PecMessage, read: boolean) => void;
}

export function MessageViewer({ message, onToggleRead }: Props) {
  if (!message) {
    return (
      <Stack align="center" justify="center" h="100%">
        <Text c="dimmed" size="sm">
          Seleziona un messaggio per leggerlo
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="sm" h="100%" p="md" style={{ overflow: "hidden" }}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Title order={5}>{message.subject || "(nessun oggetto)"}</Title>
          <Text size="sm" c="dimmed">
            Da: {message.from}
          </Text>
          <Text size="xs" c="dimmed">
            {new Date(message.date).toLocaleString("it-IT")}
          </Text>
        </Stack>
        <Button
          variant="subtle"
          color="gray"
          size="xs"
          leftSection={
            message.read ? <IconMail size={14} /> : <IconMailOpened size={14} />
          }
          onClick={() => onToggleRead(message, !message.read)}
          style={{ flexShrink: 0 }}
        >
          {message.read ? "Segna da leggere" : "Segna come letta"}
        </Button>
      </Group>

      <Divider />

      {message.attachments.length > 0 && (
        <>
          <Group gap="sm" wrap="wrap">
            <IconPaperclip size={16} />
            {message.attachments.map((att) => (
              <Anchor
                key={att.index}
                href={getPecAttachmentUrl(message.folder, message.uid, att.index)}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
              >
                <Badge variant="outline" size="sm">
                  {att.filename}
                </Badge>
              </Anchor>
            ))}
          </Group>
          <Divider />
        </>
      )}

      <ScrollArea style={{ flex: 1 }}>
        {message.bodyHtml ? (
          <iframe
            srcDoc={message.bodyHtml}
            sandbox="allow-same-origin"
            style={{ width: "100%", minHeight: 400, border: "none" }}
            title="Corpo del messaggio"
          />
        ) : (
          <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
            {message.bodyText || "(nessun contenuto)"}
          </Text>
        )}
      </ScrollArea>
    </Stack>
  );
}
