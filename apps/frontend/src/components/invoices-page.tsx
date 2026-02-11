"use client";

import { useCallback, useEffect, useState } from "react";
import { Title, Button, Group, Stack, LoadingOverlay, Box } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconFileSpreadsheet, IconFileText, IconPlus } from "@tabler/icons-react";
import type { Invoice } from "@/types";
import * as api from "@/lib/api/invoices";
import { InvoicesTable } from "./invoices/invoices-table";
import { CsvUploadModal } from "./invoices/csv-upload-modal";
import { InvoiceUploadModal } from "./invoices/invoice-upload-modal";
import { InvoiceDetailModal } from "./invoices/invoice-detail-modal";
import { InvoiceFormModal, type InvoiceFormValues } from "./invoices/invoice-form-modal";
import { DeleteConfirmModal } from "./invoices/delete-confirm-modal";

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [csvModalOpened, csvModalHandlers] = useDisclosure(false);
  const [invoiceUploadModalOpened, invoiceUploadModalHandlers] = useDisclosure(false);
  const [detailModalOpened, detailModalHandlers] = useDisclosure(false);
  const [formModalOpened, formModalHandlers] = useDisclosure(false);
  const [deleteModalOpened, deleteModalHandlers] = useDisclosure(false);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchInvoices();
      setInvoices(data);
    } catch {
      notifications.show({
        title: "Errore",
        message: "Impossibile caricare le fatture",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // --- Handlers ---

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    detailModalHandlers.open();
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    formModalHandlers.open();
  };

  const handleCreate = () => {
    setSelectedInvoice(null);
    formModalHandlers.open();
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    deleteModalHandlers.open();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInvoice) return;
    setActionLoading(true);
    try {
      await api.deleteInvoice(selectedInvoice.id);
      notifications.show({
        title: "Fattura eliminata",
        message: "La fattura è stata eliminata con successo",
        color: "green",
      });
      deleteModalHandlers.close();
      await loadInvoices();
    } catch {
      notifications.show({
        title: "Errore",
        message: "Impossibile eliminare la fattura",
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormSubmit = async (values: InvoiceFormValues) => {
    setActionLoading(true);
    try {
      const payload = {
        documentType: values.documentType,
        invoiceNumber: values.invoiceNumber,
        date: values.date!.toISOString(),
        supplierName: values.supplierName,
        supplierVatNumber: values.supplierVatNumber,
        taxableAmount: values.taxableAmount,
        taxAmount: values.taxAmount,
        sdiNumber: values.sdiNumber,
        viewed: values.viewed,
      };

      if (selectedInvoice) {
        await api.updateInvoice(selectedInvoice.id, payload);
        notifications.show({
          title: "Fattura aggiornata",
          message: "Le modifiche sono state salvate",
          color: "green",
        });
      } else {
        await api.createInvoice(payload);
        notifications.show({
          title: "Fattura creata",
          message: "La fattura è stata creata con successo",
          color: "green",
        });
      }
      formModalHandlers.close();
      await loadInvoices();
    } catch {
      notifications.show({
        title: "Errore",
        message: "Impossibile salvare la fattura",
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCsvUpload = async (files: File[]) => {
    setActionLoading(true);
    try {
      const result = await api.uploadCsv(files);
      const parts: string[] = [];
      if (result.imported > 0) parts.push(`${result.imported} importate`);
      if (result.skipped > 0) parts.push(`${result.skipped} scartate (duplicate)`);
      const message = parts.length > 0 ? `Fatture: ${parts.join(", ")}` : "Nessuna fattura trovata nei file";
      notifications.show({
        title: "CSV caricato",
        message,
        color: result.skipped > 0 && result.imported === 0 ? "yellow" : "green",
      });
      csvModalHandlers.close();
      await loadInvoices();
    } catch {
      notifications.show({
        title: "Errore",
        message: "Impossibile caricare i file CSV",
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleInvoiceUpload = async (files: File[]) => {
    setActionLoading(true);
    try {
      const result = await api.uploadInvoiceFiles(files);
      const parts: string[] = [];
      if (result.imported > 0) parts.push(`${result.imported} nuove`);
      if (result.updated > 0) parts.push(`${result.updated} aggiornate`);
      const message = parts.length > 0 ? `Fatture: ${parts.join(", ")}` : "Nessuna fattura trovata nei file";
      notifications.show({
        title: "Fatture caricate",
        message,
        color: "green",
      });
      invoiceUploadModalHandlers.close();
      await loadInvoices();
    } catch {
      notifications.show({
        title: "Errore",
        message: "Impossibile caricare i file delle fatture",
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={2}>Fatture</Title>
        <Group gap="sm">
          <Button
            variant="light"
            leftSection={<IconFileSpreadsheet size={16} />}
            onClick={csvModalHandlers.open}
          >
            Carica CSV
          </Button>
          <Button
            variant="light"
            leftSection={<IconFileText size={16} />}
            onClick={invoiceUploadModalHandlers.open}
          >
            Carica Fattura
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleCreate}
          >
            Nuova Fattura
          </Button>
        </Group>
      </Group>

      <Box pos="relative" mih={200}>
        <LoadingOverlay visible={loading} />
        <InvoicesTable
          invoices={invoices}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </Box>

      {/* Modals */}
      <CsvUploadModal
        opened={csvModalOpened}
        onClose={csvModalHandlers.close}
        onUpload={handleCsvUpload}
        loading={actionLoading}
      />
      <InvoiceUploadModal
        opened={invoiceUploadModalOpened}
        onClose={invoiceUploadModalHandlers.close}
        onUpload={handleInvoiceUpload}
        loading={actionLoading}
      />
      <InvoiceDetailModal
        invoice={selectedInvoice}
        opened={detailModalOpened}
        onClose={detailModalHandlers.close}
      />
      <InvoiceFormModal
        invoice={selectedInvoice}
        opened={formModalOpened}
        onClose={formModalHandlers.close}
        onSubmit={handleFormSubmit}
        loading={actionLoading}
      />
      <DeleteConfirmModal
        invoice={selectedInvoice}
        opened={deleteModalOpened}
        onClose={deleteModalHandlers.close}
        onConfirm={handleDeleteConfirm}
        loading={actionLoading}
      />
    </Stack>
  );
}

