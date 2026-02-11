"use client";

import { useState } from "react";
import {
  Modal,
  Text,
  Group,
  Badge,
  Stack,
  Divider,
  Table,
  ScrollArea,
  Button,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconDownload, IconEye, IconFileTypePdf } from "@tabler/icons-react";
import type { Invoice } from "@/types";
import { getAttachmentUrl } from "@/lib/api/invoices";

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  opened: boolean;
  onClose: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });
}

/** Map FatturaPA payment method codes to human-readable labels */
function paymentMethodLabel(code?: string): string {
  if (!code) return "—";
  const map: Record<string, string> = {
    MP01: "Contanti",
    MP02: "Assegno",
    MP03: "Assegno circolare",
    MP04: "Contanti c/o Tesoreria",
    MP05: "Bonifico",
    MP06: "Vaglia cambiario",
    MP07: "Bollettino bancario",
    MP08: "Carta di pagamento",
    MP09: "RID",
    MP10: "RID utenze",
    MP11: "RID veloce",
    MP12: "RIBA",
    MP13: "MAV",
    MP14: "Quietanza erario",
    MP15: "Giroconto su conti di contabilità speciale",
    MP16: "Domiciliazione bancaria",
    MP17: "Domiciliazione postale",
    MP18: "Bollettino di c/c postale",
    MP19: "SEPA Direct Debit",
    MP20: "SEPA Direct Debit CORE",
    MP21: "SEPA Direct Debit B2B",
    MP22: "Trattenuta su somme già riscosse",
    MP23: "PagoPA",
  };
  return map[code] ?? code;
}

export function InvoiceDetailModal({
  invoice,
  opened,
  onClose,
}: InvoiceDetailModalProps) {
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 48em)");

  if (!invoice) return null;

  const hasLineItems = invoice.lineItems && invoice.lineItems.length > 0;
  const hasAttachments = invoice.attachments && invoice.attachments.length > 0;
  const hasPaymentInfo = invoice.paymentMethod || invoice.paymentDueDate || invoice.iban;

  return (
    <>
      <Modal
        opened={opened}
        onClose={() => {
          onClose();
          setPdfPreviewUrl(null);
        }}
        title="Dettaglio Fattura"
        size="90%"
        fullScreen={!!isMobile}
        centered
        styles={{ body: { maxHeight: isMobile ? undefined : "80vh", overflowY: "auto" } }}
      >
        <Stack gap="md">
          {/* Header info */}
          <Group justify="space-between" wrap="wrap" gap="md">
            <div>
              <Text size="sm" c="dimmed">
                Tipo documento
              </Text>
              <Text fw={500}>{invoice.documentTypeDescription || invoice.documentType || "—"}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Numero fattura
              </Text>
              <Text fw={500}>{invoice.invoiceNumber}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Data emissione
              </Text>
              <Text fw={500}>{formatDate(invoice.date)}</Text>
            </div>
            {invoice.currency && (
              <div>
                <Text size="sm" c="dimmed">
                  Divisa
                </Text>
                <Text fw={500}>{invoice.currency}</Text>
              </div>
            )}
          </Group>

          <Divider />

          {/* Supplier */}
          <div>
            <Text size="sm" c="dimmed">
              Fornitore
            </Text>
            <Group gap="sm">
              <Text fw={500}>{invoice.supplier.name}</Text>
              <Badge variant="light" size="sm">
                P.IVA: {invoice.supplier.vatNumber}
              </Badge>
              {invoice.supplierFiscalCode && (
                <Badge variant="light" size="sm" color="gray">
                  C.F.: {invoice.supplierFiscalCode}
                </Badge>
              )}
            </Group>
            {(invoice.supplierAddress || invoice.supplierCity) && (
              <Text size="sm" c="dimmed" mt={4}>
                {[invoice.supplierAddress, invoice.supplierCap, invoice.supplierCity, invoice.supplierProvince]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            )}
          </div>

          <Divider />

          {/* Amounts */}
          <Group justify="space-between" wrap="wrap" gap="md">
            <div>
              <Text size="sm" c="dimmed">
                Imponibile
              </Text>
              <Text fw={500}>{formatCurrency(invoice.taxableAmount)}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Imposta
              </Text>
              <Text fw={500}>{formatCurrency(invoice.taxAmount)}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Totale
              </Text>
              <Text fw={700} size="lg">
                {formatCurrency(invoice.totalAmount)}
              </Text>
            </div>
          </Group>

          <Divider />

          {/* SDI and status */}
          <Group justify="space-between" wrap="wrap" gap="md">
            <div>
              <Text size="sm" c="dimmed">
                Numero SDI
              </Text>
              <Text fw={500}>{invoice.sdiNumber || "—"}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Stato
              </Text>
              <Badge color={invoice.viewed ? "green" : "gray"} variant="light">
                {invoice.viewed ? "Visualizzata" : "Non visualizzata"}
              </Badge>
            </div>
            {invoice.causale && (
              <div>
                <Text size="sm" c="dimmed">
                  Causale
                </Text>
                <Text fw={500}>{invoice.causale}</Text>
              </div>
            )}
          </Group>

          {/* Payment info */}
          {hasPaymentInfo && (
            <>
              <Divider />
              <Text fw={600} size="md">
                Dati Pagamento
              </Text>
              <Group justify="space-between" wrap="wrap" gap="md">
                {invoice.paymentMethod && (
                  <div>
                    <Text size="sm" c="dimmed">
                      Modalità
                    </Text>
                    <Text fw={500}>{paymentMethodLabel(invoice.paymentMethod)}</Text>
                  </div>
                )}
                {invoice.paymentDueDate && (
                  <div>
                    <Text size="sm" c="dimmed">
                      Scadenza
                    </Text>
                    <Text fw={500}>{formatDate(invoice.paymentDueDate)}</Text>
                  </div>
                )}
                {invoice.paymentAmount != null && (
                  <div>
                    <Text size="sm" c="dimmed">
                      Importo
                    </Text>
                    <Text fw={500}>{formatCurrency(invoice.paymentAmount)}</Text>
                  </div>
                )}
                {invoice.iban && (
                  <div>
                    <Text size="sm" c="dimmed">
                      IBAN
                    </Text>
                    <Text fw={500} size="sm" ff="monospace">
                      {invoice.iban}
                    </Text>
                  </div>
                )}
              </Group>
            </>
          )}

          {/* Line items */}
          {hasLineItems && (
            <>
              <Divider />
              <Text fw={600} size="md">
                Dettaglio Articoli ({invoice.lineItems.length})
              </Text>
              <ScrollArea>
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={40}>#</Table.Th>
                      <Table.Th>Descrizione</Table.Th>
                      <Table.Th w={60} ta="center">
                        Cod.
                      </Table.Th>
                      <Table.Th w={70} ta="right">
                        Qtà
                      </Table.Th>
                      <Table.Th w={50} ta="center">
                        U.M.
                      </Table.Th>
                      <Table.Th w={100} ta="right">
                        Prezzo Unit.
                      </Table.Th>
                      <Table.Th w={80} ta="right">
                        Sconto
                      </Table.Th>
                      <Table.Th w={100} ta="right">
                        Totale
                      </Table.Th>
                      <Table.Th w={60} ta="right">
                        IVA %
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {invoice.lineItems.map((item) => (
                      <Table.Tr key={item.id}>
                        <Table.Td>{item.lineNumber}</Table.Td>
                        <Table.Td>
                          <Text size="sm">{item.description}</Text>
                          {item.eanCode && (
                            <Text size="xs" c="dimmed">
                              EAN: {item.eanCode}
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td ta="center">
                          <Text size="xs">{item.articleCode || "—"}</Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          {item.quantity != null ? item.quantity.toFixed(2) : "—"}
                        </Table.Td>
                        <Table.Td ta="center">{item.unitOfMeasure || "—"}</Table.Td>
                        <Table.Td ta="right">
                          {item.unitPrice != null ? formatCurrency(item.unitPrice) : "—"}
                        </Table.Td>
                        <Table.Td ta="right">
                          {item.discountPercentage != null
                            ? `${item.discountType === "SC" ? "-" : "+"}${item.discountPercentage}%`
                            : "—"}
                        </Table.Td>
                        <Table.Td ta="right" fw={500}>
                          {item.totalPrice != null ? formatCurrency(item.totalPrice) : "—"}
                        </Table.Td>
                        <Table.Td ta="right">
                          {item.vatRate != null ? `${item.vatRate}%` : "—"}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </>
          )}

          {/* Attachments */}
          {hasAttachments && (
            <>
              <Divider />
              <Text fw={600} size="md">
                Allegati ({invoice.attachments.length})
              </Text>
              <Stack gap="xs">
                {invoice.attachments.map((att) => (
                  <Group key={att.id} gap="sm" align="center">
                    <IconFileTypePdf size={20} color="var(--mantine-color-red-6)" />
                    <Text size="sm" fw={500} style={{ flex: 1 }}>
                      {att.fileName}
                    </Text>
                    <Group gap="xs">
                      {att.contentType === "application/pdf" && (
                        <Tooltip label="Anteprima PDF">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() =>
                              setPdfPreviewUrl(getAttachmentUrl(invoice.id, att.id))
                            }
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      <Tooltip label="Scarica">
                        <ActionIcon
                          variant="light"
                          color="green"
                          component="a"
                          href={getAttachmentUrl(invoice.id, att.id)}
                          download={att.fileName}
                          target="_blank"
                        >
                          <IconDownload size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                ))}
              </Stack>
            </>
          )}

          {/* Inline PDF preview */}
          {pdfPreviewUrl && (
            <>
              <Divider />
              <Group justify="space-between" align="center">
                <Text fw={600} size="md">
                  Anteprima PDF
                </Text>
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => setPdfPreviewUrl(null)}
                >
                  Chiudi anteprima
                </Button>
              </Group>
              <iframe
                src={pdfPreviewUrl}
                style={{
                  width: "100%",
                  height: "600px",
                  border: "1px solid var(--mantine-color-gray-3)",
                  borderRadius: "8px",
                }}
                title="Anteprima PDF"
              />
            </>
          )}
        </Stack>
      </Modal>
    </>
  );
}
