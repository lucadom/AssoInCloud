"use client";

import { useEffect } from "react";
import {
  Modal,
  TextInput,
  Button,
  Group,
  Stack,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import type { Supplier } from "@/types";

interface SupplierFormValues {
  name: string;
  vatNumber: string;
}

interface SupplierFormModalProps {
  supplier: Supplier | null; // null = create, non-null = edit
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: SupplierFormValues) => void;
  loading?: boolean;
}

export function SupplierFormModal({
  supplier,
  opened,
  onClose,
  onSubmit,
  loading,
}: SupplierFormModalProps) {
  const form = useForm<SupplierFormValues>({
    initialValues: {
      name: "",
      vatNumber: "",
    },
    validate: {
      name: (v) =>
        v.trim().length > 0 ? null : "La ragione sociale è obbligatoria",
      vatNumber: (v) =>
        v.trim().length > 0 ? null : "La partita IVA è obbligatoria",
    },
  });

  useEffect(() => {
    if (opened) {
      if (supplier) {
        form.setValues({
          name: supplier.name,
          vatNumber: supplier.vatNumber,
        });
      } else {
        form.reset();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, supplier]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={supplier ? "Modifica Fornitore" : "Nuovo Fornitore"}
      size="md"
      centered
    >
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Ragione sociale"
            placeholder="Es. Rossi S.R.L."
            {...form.getInputProps("name")}
          />
          <TextInput
            label="Partita IVA"
            placeholder="Es. 01234567890"
            {...form.getInputProps("vatNumber")}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" loading={loading}>
              {supplier ? "Salva modifiche" : "Crea fornitore"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

export type { SupplierFormValues };
