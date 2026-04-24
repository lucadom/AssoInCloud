"use client";

import { useEffect } from "react";
import {
  Modal,
  TextInput,
  Button,
  Group,
  Stack,
  Grid,
  TagsInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import type { DateValue } from "@mantine/dates";
import { useForm } from "@mantine/form";
import type { Member } from "@/types";

export interface MemberFormValues {
  lastName: string;
  firstName: string;
  /** Date | string | null — Mantine 8 DatePickerInput returns DateValue (string or Date) */
  birthDate: DateValue;
  birthPlace: string;
  fiscalCode: string;
  address: string;
  city: string;
  phone: string;
  /** Date | string | null — Mantine 8 DatePickerInput returns DateValue (string or Date) */
  membershipDate: DateValue;
  membershipYears: string[];
}

interface MemberFormModalProps {
  member: Member | null; // null = create, non-null = edit
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: MemberFormValues) => void;
  loading?: boolean;
}

export function MemberFormModal({
  member,
  opened,
  onClose,
  onSubmit,
  loading,
}: MemberFormModalProps) {
  const form = useForm<MemberFormValues>({
    initialValues: {
      lastName: "",
      firstName: "",
      birthDate: null,
      birthPlace: "",
      fiscalCode: "",
      address: "",
      city: "",
      phone: "",
      membershipDate: new Date(),
      membershipYears: [],
    },
    validate: {
      lastName: (v) => (v.trim().length > 0 ? null : "Il cognome è obbligatorio"),
      firstName: (v) => (v.trim().length > 0 ? null : "Il nome è obbligatorio"),
      fiscalCode: (v) =>
        v.trim().length === 16 ? null : "Il codice fiscale deve essere di 16 caratteri",
    },
  });

  useEffect(() => {
    if (opened) {
      if (member) {
        form.setValues({
          lastName: member.lastName,
          firstName: member.firstName,
          birthDate: member.birthDate ? new Date(member.birthDate) : null,
          birthPlace: member.birthPlace || "",
          fiscalCode: member.fiscalCode,
          address: member.address || "",
          city: member.city || "",
          phone: member.phone || "",
          membershipDate: member.membershipDate ? new Date(member.membershipDate) : null,
          membershipYears: [...member.membershipYears]
            .sort((a, b) => a - b)
            .map((year) => String(year)),
        });
      } else {
        form.setValues({
          lastName: "",
          firstName: "",
          birthDate: null,
          birthPlace: "",
          fiscalCode: "",
          address: "",
          city: "",
          phone: "",
          membershipDate: new Date(),
          membershipYears: [],
        });
        form.resetDirty();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, member]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={member ? "Modifica Socio" : "Nuovo Socio"}
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="md">
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Cognome"
                placeholder="Rossi"
                required
                {...form.getInputProps("lastName")}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Nome"
                placeholder="Mario"
                required
                {...form.getInputProps("firstName")}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Codice Fiscale"
            placeholder="RSSMRA80A01H501U"
            required
            maxLength={16}
            value={form.values.fiscalCode}
            onChange={(e) => form.setFieldValue("fiscalCode", e.currentTarget.value.toUpperCase())}
            error={form.errors.fiscalCode}
          />

          <Grid>
            <Grid.Col span={6}>
              <DatePickerInput
                label="Data di nascita"
                placeholder="DD/MM/YYYY"
                valueFormat="DD/MM/YYYY"
                clearable
                {...form.getInputProps("birthDate")}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Luogo di nascita"
                placeholder="Roma"
                {...form.getInputProps("birthPlace")}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Indirizzo"
            placeholder="Via Roma 1"
            {...form.getInputProps("address")}
          />

          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Città"
                placeholder="Roma"
                {...form.getInputProps("city")}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Telefono"
                placeholder="3331234567"
                {...form.getInputProps("phone")}
              />
            </Grid.Col>
          </Grid>

          <DatePickerInput
            label="Data accettazione socio"
            placeholder="DD/MM/YYYY"
            valueFormat="DD/MM/YYYY"
            clearable
            {...form.getInputProps("membershipDate")}
          />

          {member && (
            <TagsInput
              label="Anni di iscrizione"
              placeholder="Aggiungi anno e premi invio"
              description="Inserisci anni a 4 cifre (es. 2021, 2024)."
              {...form.getInputProps("membershipYears")}
            />
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" loading={loading}>
              {member ? "Salva modifiche" : "Crea socio"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
