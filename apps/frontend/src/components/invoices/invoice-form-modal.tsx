"use client";

import { useEffect } from "react";
import {
  Modal,
  TextInput,
  NumberInput,
  Button,
  Group,
  Stack,
  Select,
  Switch,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import type { Invoice } from "@/types";

interface InvoiceFormValues {
  documentType: string;
  invoiceNumber: string;
  date: Date | null;
  supplierName: string;
  supplierVatNumber: string;
  taxableAmount: number;
  taxAmount: number;
  sdiNumber: string;
  viewed: boolean;
}

interface InvoiceFormModalProps {
  invoice: Invoice | null; // null = create, non-null = edit
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: InvoiceFormValues) => void;
  loading?: boolean;
}

export function InvoiceFormModal({
  invoice,
  opened,
  onClose,
  onSubmit,
  loading,
}: InvoiceFormModalProps) {
  const form = useForm<InvoiceFormValues>({
    initialValues: {
      documentType: "",
      invoiceNumber: "",
      date: null,
      supplierName: "",
      supplierVatNumber: "",
      taxableAmount: 0,
      taxAmount: 0,
      sdiNumber: "",
      viewed: false,
    },
    validate: {
      invoiceNumber: (v) =>
        v.trim().length > 0 ? null : "Il numero fattura è obbligatorio",
      date: (v) => (v ? null : "La data è obbligatoria"),
      supplierName: (v) =>
        v.trim().length > 0 ? null : "Il nome del fornitore è obbligatorio",
      supplierVatNumber: (v) =>
        v.trim().length > 0 ? null : "La partita IVA è obbligatoria",
      taxableAmount: (v) =>
        v > 0 ? null : "L'imponibile deve essere maggiore di 0",
    },
  });

  useEffect(() => {
    if (opened) {
      if (invoice) {
        form.setValues({
          documentType: invoice.documentType,
          invoiceNumber: invoice.invoiceNumber,
          date: new Date(invoice.date),
          supplierName: invoice.supplier.name,
          supplierVatNumber: invoice.supplier.vatNumber,
          taxableAmount: invoice.taxableAmount,
          taxAmount: invoice.taxAmount,
          sdiNumber: invoice.sdiNumber,
          viewed: invoice.viewed,
        });
      } else {
        form.reset();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, invoice]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={invoice ? "Modifica Fattura" : "Nuova Fattura"}
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="md">
          <Group grow>
            <Select
              label="Tipo documento"
              placeholder="Seleziona tipo"
              data={[
                { value: "", label: "(nessuno)" },
                { value: "Fattura", label: "Fattura" },
              ]}
              allowDeselect={false}
              {...form.getInputProps("documentType")}
            />
            <TextInput
              label="Numero fattura"
              placeholder="Es. 1/11017"
              {...form.getInputProps("invoiceNumber")}
            />
          </Group>

          <Group grow>
            <DatePickerInput
              label="Data emissione"
              placeholder="Seleziona data"
              valueFormat="DD/MM/YYYY"
              {...form.getInputProps("date")}
            />
          </Group>

          <Group grow>
            <TextInput
              label="Fornitore"
              placeholder="Ragione sociale"
              {...form.getInputProps("supplierName")}
            />
            <TextInput
              label="Partita IVA"
              placeholder="Es. 01234567890"
              {...form.getInputProps("supplierVatNumber")}
            />
          </Group>

          <Group grow>
            <NumberInput
              label="Imponibile / Importo (€)"
              placeholder="0,00"
              decimalScale={2}
              decimalSeparator=","
              thousandSeparator="."
              min={0}
              {...form.getInputProps("taxableAmount")}
            />
            <NumberInput
              label="Imposta (€)"
              placeholder="0,00"
              decimalScale={2}
              decimalSeparator=","
              thousandSeparator="."
              min={0}
              {...form.getInputProps("taxAmount")}
            />
          </Group>

          <Group grow>
            <TextInput
              label="Numero SDI"
              placeholder="Es. 13699991347"
              {...form.getInputProps("sdiNumber")}
            />
            <Switch
              label="Fattura visualizzata"
              mt="md"
              {...form.getInputProps("viewed", { type: "checkbox" })}
            />
          </Group>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" loading={loading}>
              {invoice ? "Salva modifiche" : "Crea fattura"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

export type { InvoiceFormValues };
