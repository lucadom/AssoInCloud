"use client";

import { useMemo } from "react";
import { Stepper, Stack, Text } from "@mantine/core";
import { IconCake } from "@tabler/icons-react";
import type { Member } from "@/types";

type BirthdayMember = {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
};

type BirthdayGroup = {
  date: Date;
  members: BirthdayMember[];
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseIsoDate(dateStr: string): Date | null {
  const [y, m, d] = dateStr.split("-").map((part) => Number(part));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function makeBirthdayDate(year: number, month: number, day: number): Date {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(day, daysInMonth);
  return new Date(year, month, safeDay);
}

const longDateFormatter = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function formatLongDate(date: Date): string {
  const formatted = longDateFormatter.format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatAge(age: number): string {
  return `${age} ${age === 1 ? "anno" : "anni"}`;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function pushMember(
  target: Map<string, BirthdayGroup>,
  date: Date,
  member: Member,
  birthDate: Date
) {
  const key = toDateKey(date);
  const age = date.getFullYear() - birthDate.getFullYear();
  const entry = target.get(key) ?? { date, members: [] };
  entry.members.push({
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    age,
  });
  target.set(key, entry);
}

function sortMembers(group: BirthdayGroup) {
  group.members.sort((a, b) => {
    const lastNameCompare = a.lastName.localeCompare(b.lastName, "it");
    if (lastNameCompare !== 0) return lastNameCompare;
    return a.firstName.localeCompare(b.firstName, "it");
  });
}

function buildBirthdayGroups(members: Member[], today: Date) {
  const todayStart = startOfDay(today);
  const todayMap = new Map<string, BirthdayGroup>();
  const futureMap = new Map<string, BirthdayGroup>();

  for (const member of members) {
    if (!member.birthDate) continue;
    const birthDate = parseIsoDate(member.birthDate);
    if (!birthDate) continue;

    const month = birthDate.getMonth();
    const day = birthDate.getDate();
    const thisYear = todayStart.getFullYear();
    const birthdayThisYear = makeBirthdayDate(thisYear, month, day);
    const nextBirthday =
      birthdayThisYear > todayStart
        ? birthdayThisYear
        : makeBirthdayDate(thisYear + 1, month, day);

    if (birthdayThisYear.getTime() === todayStart.getTime()) {
      pushMember(todayMap, birthdayThisYear, member, birthDate);
    }
    pushMember(futureMap, nextBirthday, member, birthDate);
  }

  const future = Array.from(futureMap.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);

  const todayGroup = Array.from(todayMap.values())[0] ?? null;
  if (todayGroup) sortMembers(todayGroup);
  for (const group of future) sortMembers(group);

  return { today: todayGroup, future };
}

export function BirthdaysSummary({ members }: { members: Member[] }) {
  const today = useMemo(() => new Date(), []);
  const { today: todayGroup, future } = useMemo(
    () => buildBirthdayGroups(members, today),
    [members, today]
  );

  const futureSteps = Array.from({ length: 3 }, (_, index) => future[index] ?? null);

  function renderDescription(group: BirthdayGroup | null) {
    return (
      <Stack gap={4}>
        {!group || group.members.length === 0 ? (
          <Text size="md" c="dimmed">
            Nessun compleanno trovato.
          </Text>
        ) : (
          group.members.map((member) => (
            <Text size="md" key={member.id}>
              <Text component="span" c="black">
                {member.firstName} {member.lastName}
              </Text>
              <Text component="span" c="dimmed">
                {" "}- {formatAge(member.age)}
              </Text>
            </Text>
          ))
        )}
      </Stack>
    );
  }

  return (
    <Stepper active={0} orientation="vertical">
      <Stepper.Step
        label={<Text size="lg" fw="bold">Oggi</Text>}
        description={renderDescription(todayGroup)}
        icon={<IconCake size={16} />}
      />
      {futureSteps.map((group, index) => (
        <Stepper.Step
          key={`future-${index}`}
          label={
            <Text size="lg" fw="bold">
              {group ? formatLongDate(group.date) : "Nessuna data"}
            </Text>
          }
          description={renderDescription(group)}
          icon={<IconCake size={16} />}
        />
      ))}
    </Stepper>
  );
}
