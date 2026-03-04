"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const _rgl = require("react-grid-layout");
// react-grid-layout is a CJS module: module.exports = Class (default export)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GridLayout = (_rgl.default ?? _rgl) as React.ComponentType<Record<string, unknown>>;
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { BarChart } from "@mantine/charts";
import {
  Title,
  Stack,
  Card,
  Text,
  Group,
  ThemeIcon,
  Skeleton,
  NumberFormatter,
  Divider,
} from "@mantine/core";
import {
  IconFileInvoice,
  IconUsers,
  IconCake,
  IconBuildingStore,
} from "@tabler/icons-react";
import type { Invoice } from "@/types";
import type { Member } from "@/types";
import type { Supplier } from "@/types";
import { fetchInvoices } from "@/lib/api/invoices";
import { fetchMembers } from "@/lib/api/members";
import { fetchSuppliers } from "@/lib/api/suppliers";
import {
  type AppSettings,
  loadSettings,
} from "@/lib/settings";

// --- Grid layout setup ---

// (WidthProvider removed — we measure width manually via ResizeObserver)

const LAYOUT_STORAGE_KEY = "assoincloud-dashboard-layout-v1";

interface DashboardLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  isDraggable?: boolean;
  isResizable?: boolean;
  static?: boolean;
}

const DEFAULT_LAYOUT: DashboardLayout[] = [
  { i: "fatture-mese", x: 0,  y: 0,  w: 4, h: 5, minW: 1, minH: 1 },
  { i: "fatture-prev", x: 4,  y: 0,  w: 4, h: 8, minW: 1, minH: 1 },
  { i: "fornitori",    x: 8,  y: 0,  w: 4, h: 5, minW: 1, minH: 1 },
  { i: "soci",         x: 0,  y: 5,  w: 4, h: 5, minW: 1, minH: 1 },
  { i: "compleanno",   x: 8,  y: 5,  w: 4, h: 5, minW: 1, minH: 1 },
  { i: "grafico",      x: 0,  y: 10, w: 12, h: 11, minW: 1, minH: 1 },
];

function loadLayout(): DashboardLayout[] {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (raw) {
      const parsed: DashboardLayout[] = JSON.parse(raw);
      // Merge saved positions/sizes with defaults (preserves minW/minH in case defaults change)
      return DEFAULT_LAYOUT.map((def) => {
        const saved = parsed.find((l) => l.i === def.i);
        return saved ? { ...def, x: saved.x, y: saved.y, w: saved.w, h: saved.h } : def;
      });
    }
  } catch {
    // ignore
  }
  return DEFAULT_LAYOUT;
}

function saveLayout(layout: DashboardLayout[]): void {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // ignore
  }
}

// --- Date helpers ---

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function endOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0, 23, 59, 59, 999);
}

function filterInvoicesByRange(invoices: Invoice[], from: Date, to: Date): Invoice[] {
  return invoices.filter((inv) => {
    const d = new Date(inv.date);
    return d >= from && d <= to;
  });
}

function sumTotal(invoices: Invoice[]): number {
  return invoices.reduce((acc, inv) => acc + (inv.creditNote ? -inv.totalAmount : inv.totalAmount), 0);
}

/** Returns days until the next birthday (0 = today, max 364). */
function daysUntilBirthday(birthDate: string): number {
  const today = new Date();
  const todayY = today.getFullYear();
  const bday = new Date(birthDate);

  let next = new Date(todayY, bday.getMonth(), bday.getDate());
  if (next < today) {
    next = new Date(todayY + 1, bday.getMonth(), bday.getDate());
  }

  const ms = next.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "long" });
}

function getNextBirthday(members: Member[]): { member: Member; days: number; nextDate: Date; turningAge: number } | null {
  const withBirthday = members.filter((m) => m.birthDate);
  if (!withBirthday.length) return null;

  const today = new Date();
  const todayY = today.getFullYear();

  const ranked = withBirthday.map((m) => {
    const bday = new Date(m.birthDate!);
    let next = new Date(todayY, bday.getMonth(), bday.getDate());
    if (next < new Date(todayY, today.getMonth(), today.getDate())) {
      next = new Date(todayY + 1, bday.getMonth(), bday.getDate());
    }
    const turningAge = next.getFullYear() - bday.getFullYear();
    return { member: m, days: daysUntilBirthday(m.birthDate!), nextDate: next, turningAge };
  });
  ranked.sort((a, b) => a.days - b.days);
  return ranked[0];
}

// --- Stat card ---

interface StatCardProps {
  icon: typeof IconFileInvoice;
  color: string;
  label: string;
  loading: boolean;
  children: React.ReactNode;
}

function StatCard({ icon: Icon, color, label, loading, children }: StatCardProps) {
  return (
    <Card withBorder shadow="sm" radius="md" padding="lg" style={{ height: "100%", boxSizing: "border-box" }}>
      <Group justify="space-between" align="flex-start" mb="xs" className="drag-handle" style={{ cursor: "grab" }}>
        <Text size="sm" c="dimmed" fw={500}>
          {label}
        </Text>
        <ThemeIcon variant="light" color={color} radius="md" size="lg">
          <Icon size={20} />
        </ThemeIcon>
      </Group>
      {loading ? (
        <>
          <Skeleton height={28} width="60%" mb={6} />
          <Skeleton height={16} width="40%" />
        </>
      ) : (
        children
      )}
    </Card>
  );
}

// --- Main component ---

export function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<DashboardLayout[]>(DEFAULT_LAYOUT);
  const [containerWidth, setContainerWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  // Measure container width so GridLayout knows how wide to render
  const onResize = useCallback((entries: ResizeObserverEntry[]) => {
    const width = entries[0]?.contentRect.width;
    if (width) setContainerWidth(width);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(onResize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [onResize]);

  // Load saved layout from localStorage after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    setLayout(loadLayout());
    setAppSettings(loadSettings());
  }, []);

  useEffect(() => {
    Promise.all([fetchInvoices(), fetchMembers(), fetchSuppliers()])
      .then(([inv, mem, sup]) => {
        setInvoices(inv);
        setMembers(mem);
        setSuppliers(sup);
      })
      .catch(() => {
        // Partial failures are silently handled — cards will show zero/empty
      })
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();

  // Build a 3-month breakdown of the 3 months BEFORE the current one: [3 months ago, 2 months ago, last month]
  const monthSlots = [3, 2, 1].map((offset) => {
    const m = ((thisMonth - offset) % 12 + 12) % 12;
    const y = thisYear + Math.floor((thisMonth - offset) / 12);
    const inv = filterInvoicesByRange(invoices, startOfMonth(y, m), endOfMonth(y, m));
    const label = new Date(y, m, 1).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
    return { label, invoices: inv };
  });

  const allPrevInvoices = monthSlots.flatMap((s) => s.invoices);

  const thisMonthInvoices = filterInvoicesByRange(
    invoices,
    startOfMonth(thisYear, thisMonth),
    endOfMonth(thisYear, thisMonth)
  );
  const thisMonthName = now.toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  // Build 12-month chart data (12 months preceding the current month)
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const offset = 12 - i; // 12 = oldest, 1 = last month
    const m = ((thisMonth - offset) % 12 + 12) % 12;
    const y = thisYear + Math.floor((thisMonth - offset) / 12);
    const inv = filterInvoicesByRange(invoices, startOfMonth(y, m), endOfMonth(y, m));
    const label = new Date(y, m, 1).toLocaleDateString("it-IT", { month: "short", year: "2-digit" });
    return { mese: label, Totale: Math.round(sumTotal(inv) * 100) / 100 };
  });

  const nextBirthday = getNextBirthday(members);

  // Only update state on layout changes (do NOT save here — onLayoutChange fires on mount
  // and would overwrite localStorage before the load useEffect can restore saved positions)
  function handleLayoutChange(newLayout: DashboardLayout[]): void {
    setLayout(newLayout);
  }

  // Save only when the user explicitly finishes a drag or resize
  function handleInteractionStop(newLayout: DashboardLayout[]): void {
    setLayout(newLayout);
    saveLayout(newLayout);
  }

  function isVisible(cardKey: string): boolean {
    if (!appSettings) return true;
    return appSettings.dashboard.visibleCards[cardKey as keyof typeof appSettings.dashboard.visibleCards] ?? true;
  }

  // Only pass layout entries for visible cards to GridLayout
  const visibleLayout = layout.filter((item) => isVisible(item.i));

  return (
    <Stack gap="md">
      <Title order={2}>Dashboard</Title>

      <div ref={containerRef} style={{ width: "100%" }}>
      <GridLayout
        layout={visibleLayout}
        width={containerWidth}
        cols={12}
        rowHeight={30}
        margin={[8, 8]}
        containerPadding={[0, 0]}
        draggableHandle=".drag-handle"
        onLayoutChange={handleLayoutChange}
        onDragStop={handleInteractionStop}
        onResizeStop={handleInteractionStop}
        style={{ minHeight: 200 }}
      >
        {/* Fatture mese corrente */}
        {isVisible("fatture-mese") && (
        <div key="fatture-mese">
          <StatCard icon={IconFileInvoice} color="blue" label={`Fatture — ${thisMonthName}`} loading={loading}>
            <Text fw={700} size="xl">
              <NumberFormatter
                value={sumTotal(thisMonthInvoices)}
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                fixedDecimalScale
                suffix=" €"
              />
            </Text>
            <Text size="sm" c="dimmed">
              {thisMonthInvoices.length} {thisMonthInvoices.length === 1 ? "fattura" : "fatture"}
            </Text>
          </StatCard>
        </div>
        )}

        {/* Fatture 3 mesi precedenti */}
        {isVisible("fatture-prev") && (
        <div key="fatture-prev">
          <StatCard icon={IconFileInvoice} color="indigo" label="Fatture — 3 mesi precedenti" loading={loading}>
            <Text fw={700} size="xl">
              <NumberFormatter
                value={sumTotal(allPrevInvoices)}
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                fixedDecimalScale
                suffix=" €"
              />
            </Text>
            <Text size="sm" c="dimmed" mb="xs">
              {allPrevInvoices.length} {allPrevInvoices.length === 1 ? "fattura" : "fatture"}
            </Text>
            <Divider mb="xs" />
            <Stack gap={4}>
              {monthSlots.map((slot) => (
                <Group key={slot.label} justify="space-between">
                  <Text size="xs" c="dimmed" style={{ textTransform: "capitalize" }}>{slot.label}</Text>
                  <Group gap="xs">
                    <Text size="xs" c="dimmed">{slot.invoices.length} fatt.</Text>
                    <Text size="xs" fw={500}>
                      <NumberFormatter
                        value={sumTotal(slot.invoices)}
                        thousandSeparator="."
                        decimalSeparator=","
                        decimalScale={2}
                        fixedDecimalScale
                        suffix=" €"
                      />
                    </Text>
                  </Group>
                </Group>
              ))}
            </Stack>
          </StatCard>
        </div>
        )}

        {/* Fornitori */}
        {isVisible("fornitori") && (
        <div key="fornitori">
          <StatCard icon={IconBuildingStore} color="teal" label="Fornitori" loading={loading}>
            <Text fw={700} size="xl">
              {suppliers.length}
            </Text>
            <Text size="sm" c="dimmed">
              totali registrati
            </Text>
          </StatCard>
        </div>
        )}

        {/* Soci */}
        {isVisible("soci") && (
        <div key="soci">
          <StatCard icon={IconUsers} color="green" label="Soci" loading={loading}>
            <Text fw={700} size="xl">
              {members.length}
            </Text>
            <Text size="sm" c="dimmed">
              totali registrati
            </Text>
          </StatCard>
        </div>
        )}

        {/* Prossimo compleanno */}
        {isVisible("compleanno") && (
        <div key="compleanno">
          <StatCard icon={IconCake} color="pink" label="Prossimo compleanno" loading={loading}>
            {nextBirthday ? (
              <>
                <Text fw={700} size="xl">
                  {nextBirthday.member.firstName} {nextBirthday.member.lastName} ({nextBirthday.turningAge} anni)
                </Text>
                <Text size="sm" c="dimmed">
                  {nextBirthday.nextDate.toLocaleDateString("it-IT", { weekday: "long" })} {formatDate(nextBirthday.member.birthDate!)}
                  {nextBirthday.days === 0
                    ? " — oggi! 🎂"
                    : nextBirthday.days === 1
                    ? " — domani"
                    : ` — tra ${nextBirthday.days} giorni`}
                </Text>
              </>
            ) : (
              <Text size="sm" c="dimmed">
                Nessuna data di nascita registrata
              </Text>
            )}
          </StatCard>
        </div>
        )}

        {/* Grafico — totali 12 mesi precedenti */}
        {isVisible("grafico") && (
        <div key="grafico">
          <Card
            withBorder
            shadow="sm"
            radius="md"
            padding="lg"
            style={{ height: "100%", boxSizing: "border-box" }}
          >
            <Group
              justify="space-between"
              align="flex-start"
              mb="md"
              className="drag-handle"
              style={{ cursor: "grab" }}
            >
              <Text size="sm" c="dimmed" fw={500}>Andamento fatture — ultimi 12 mesi</Text>
              <ThemeIcon variant="light" color="blue" radius="md" size="lg">
                <IconFileInvoice size={20} />
              </ThemeIcon>
            </Group>
            {loading ? (
              <Skeleton height={220} />
            ) : (
              <BarChart
                h={220}
                data={chartData}
                dataKey="mese"
                series={[{ name: "Totale", color: "blue" }]}
                withTooltip
                tooltipProps={{
                  formatter: (value: number) =>
                    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value),
                }}
                yAxisProps={{
                  tickFormatter: (v: number) =>
                    new Intl.NumberFormat("it-IT", { notation: "compact", maximumFractionDigits: 0 }).format(v),
                }}
              />
            )}
          </Card>
        </div>
        )}
      </GridLayout>
      </div>
    </Stack>
  );
}
