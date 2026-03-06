"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  ActionIcon,
  Divider,
  Group,
  Menu,
  Modal,
  ScrollArea,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconCertificate, IconDownload, IconEye, IconFileText, IconMail, IconMailOpened, IconPaperclip, IconX } from "@tabler/icons-react";
import type { PecMessage } from "@/types";
import type { Invoice } from "@/types";
import { fetchPecAttachmentAsInvoice, getPecAttachmentPreviewUrl, getPecAttachmentUrl, importPecAttachmentAsInvoice } from "@/lib/api/pec";
import { InvoiceDetailModal } from "@/components/invoices/invoice-detail-modal";

interface Props {
  message: PecMessage | null;
  envelopeMode: boolean;
  onToggleRead: (msg: PecMessage, read: boolean) => void;
  onToggleEnvelope: () => void;
  hideSubject?: boolean;
  onClose?: () => void;
}

export function MessageViewer({ message, envelopeMode, onToggleRead, onToggleEnvelope, hideSubject = false, onClose }: Props) {
  const [openedMenuIndex, setOpenedMenuIndex] = useState<number | null>(null);
  const [pdfPreviewIndex, setPdfPreviewIndex] = useState<number | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<Invoice | null>(null);
  const [invoicePreviewLoading, setInvoicePreviewLoading] = useState(false);
  const [importingIndex, setImportingIndex] = useState<number | null>(null);
  const isMobile = useMediaQuery("(max-width: 48em)");

  function isInvoiceFile(filename: string): boolean {
    return filename.toLowerCase().endsWith(".p7m");
  }

  async function handleInvoicePreview(partIndex: number) {
    if (!message) return;
    setInvoicePreviewLoading(true);
    try {
      const invoice = await fetchPecAttachmentAsInvoice(message.folder, message.uid, partIndex, envelopeMode);
      setInvoicePreview(invoice);
    } catch (err) {
      notifications.show({
        title: "Errore",
        message: err instanceof Error ? err.message : "Impossibile aprire la fattura",
        color: "red",
      });
    } finally {
      setInvoicePreviewLoading(false);
    }
  }

  async function handleImportInvoice(partIndex: number) {
    if (!message) return;
    setImportingIndex(partIndex);
    try {
      const result = await importPecAttachmentAsInvoice(message.folder, message.uid, partIndex, envelopeMode);
      if (result.updated > 0) {
        notifications.show({
          title: "Fattura aggiornata",
          message: "La fattura era già presente ed è stata aggiornata.",
          color: "blue",
        });
      } else {
        notifications.show({
          title: "Fattura importata",
          message: "La fattura è stata importata con successo.",
          color: "green",
        });
      }
    } catch (err) {
      notifications.show({
        title: "Errore importazione",
        message: err instanceof Error ? err.message : "Impossibile importare la fattura",
        color: "red",
      });
    } finally {
      setImportingIndex(null);
    }
  }
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
        {onClose && (
          <ActionIcon variant="subtle" color="gray" onClick={onClose} style={{ flexShrink: 0 }}>
            <IconX size={16} />
          </ActionIcon>
        )}
        {(message.bustaTransporto || envelopeMode) && (
          <Tooltip
            label={
              envelopeMode
                ? "Stai visualizzando la busta di trasporto con i dati di certificazione."
                : "Questo messaggio è una busta di trasporto PEC. Viene mostrato il messaggio originale."
            }
            multiline
            w={260}
            withArrow
          >
            <Button
              variant="subtle"
              color={envelopeMode ? "gray" : "blue"}
              size="xs"
              leftSection={<IconCertificate size={14} />}
              onClick={onToggleEnvelope}
              style={{ flexShrink: 0 }}
            >
              {envelopeMode ? "Indietro" : "Visualizza busta"}
            </Button>
          </Tooltip>
        )}
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
              <Menu
                key={att.index}
                opened={openedMenuIndex === att.index}
                onClose={() => setOpenedMenuIndex(null)}
                position="bottom-start"
                withinPortal
              >
                <Menu.Target>
                  <Badge
                    variant="outline"
                    size="sm"
                    style={{ cursor: "pointer" }}
                    onClick={() => setOpenedMenuIndex(att.index)}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {att.filename}
                  </Badge>
                </Menu.Target>
                <Menu.Dropdown>
                  {(att.contentType === "application/pdf" || att.filename.toLowerCase().endsWith(".pdf")) && (
                    <Menu.Item
                      leftSection={<IconEye size={14} />}
                      onClick={() => setPdfPreviewIndex(att.index)}
                    >
                      Anteprima
                    </Menu.Item>
                  )}
                  {isInvoiceFile(att.filename) && (
                    <Menu.Item
                      leftSection={<IconFileText size={14} />}
                      disabled={invoicePreviewLoading}
                      onClick={() => handleInvoicePreview(att.index)}
                    >
                      Anteprima fattura
                    </Menu.Item>
                  )}
                  {isInvoiceFile(att.filename) && (
                    <Menu.Item
                      leftSection={<IconFileText size={14} />}
                      disabled={importingIndex === att.index}
                      onClick={() => handleImportInvoice(att.index)}
                    >
                      {importingIndex === att.index ? "Importazione..." : "Importa fattura"}
                    </Menu.Item>
                  )}
                  <Menu.Item
                    leftSection={<IconDownload size={14} />}
                    component="a"
                    href={getPecAttachmentUrl(message.folder, message.uid, att.index, envelopeMode)}
                    download={att.filename}
                  >
                    Download
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
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

      {/* Invoice preview modal */}
      <InvoiceDetailModal
        invoice={invoicePreview}
        opened={invoicePreview !== null}
        onClose={() => setInvoicePreview(null)}
      />

      {/* PDF preview modal */}
      {pdfPreviewIndex !== null && message && (() => {
        const att = message.attachments.find((a) => a.index === pdfPreviewIndex);
        return (
          <Modal
            opened={pdfPreviewIndex !== null}
            onClose={() => setPdfPreviewIndex(null)}
            title={att?.filename ?? "Anteprima PDF"}
            size="90%"
            fullScreen={!!isMobile}
            centered
          >
            <iframe
              src={getPecAttachmentPreviewUrl(message.folder, message.uid, pdfPreviewIndex, envelopeMode)}
              style={{
                width: "100%",
                height: "75vh",
                border: "1px solid var(--mantine-color-gray-3)",
                borderRadius: 8,
              }}
              title="Anteprima PDF"
            />
          </Modal>
        );
      })()}
    </Stack>
  );
}
