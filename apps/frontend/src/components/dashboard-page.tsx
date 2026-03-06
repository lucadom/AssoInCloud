"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const _rgl = require("react-grid-layout");
// react-grid-layout is a CJS module. Turbopack may wrap it under `.default`.
// Named exports (Responsive) live on the raw require result, not under `.default`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _rglBase: any = _rgl.default ?? _rgl;
// `Responsive` is a named export — check the raw module first, then the base class
const Responsive = (_rgl.Responsive ?? _rglBase.Responsive) as React.ComponentType<Record<string, unknown>>;
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
  Badge,
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
import {
  type DashboardLayout,
  type ResponsiveLayouts,
  DEFAULT_LAYOUTS,
  DASHBOARD_LAYOUT_RESET_EVENT,
  loadLayouts,
  saveLayouts,
} from "@/lib/dashboard-layout";

// --- Grid layout setup ---

// (WidthProvider removed — we measure width manually via ResizeObserver)

const MOBILE_BREAKPOINT = 768;

const CARD_ORDER = [
  "fatture-mese",
  "fatture-prev",
  "fornitori",
  "soci",
  "compleanno",
  "grafico",
] as const;

// Breakpoints and column counts for the Responsive grid (desktop only, ≥ MOBILE_BREAKPOINT)
const BREAKPOINTS = { lg: 1200, md: MOBILE_BREAKPOINT };
const COLS = { lg: 18, md: 12 };

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
  const todayMidnight = new Date(todayY, today.getMonth(), today.getDate());
  const bday = new Date(birthDate);

  let next = new Date(todayY, bday.getMonth(), bday.getDate());
  if (next < todayMidnight) {
    next = new Date(todayY + 1, bday.getMonth(), bday.getDate());
  }

  return Math.round((next.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
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

// --- Chart tooltip ---

interface TooltipEntry { name: string; value: number; color?: string; fill?: string; }

function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const nonZero = payload.filter((e) => e.value !== 0);
  if (!nonZero.length) return null;
  const total = nonZero.reduce((sum, e) => sum + e.value, 0);
  const fmt = (v: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(v);
  return (
    <Card withBorder shadow="sm" padding="xs" radius="sm" style={{ minWidth: 180 }}>
      <Text size="xs" fw={600} mb={4}>{label}</Text>
      {nonZero.map((entry) => (
        <Group key={entry.name} justify="space-between" gap="md" wrap="nowrap">
          <Group gap={4} wrap="nowrap">
            <div style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, backgroundColor: entry.fill ?? entry.color }} />
            <Text size="xs">{entry.name}</Text>
          </Group>
          <Text size="xs" fw={500}>{fmt(entry.value)}</Text>
        </Group>
      ))}
      {nonZero.length > 1 && (
        <>
          <Divider my={4} />
          <Group justify="space-between" wrap="nowrap">
            <Text size="xs" fw={600}>Totale</Text>
            <Text size="xs" fw={700}>{fmt(total)}</Text>
          </Group>
        </>
      )}
    </Card>
  );
}

const CHART_SERIES: { name: string; color: string }[] = [
  { name: "Contanti", color: "green" },
  { name: "Bonifico", color: "blue" },
  { name: "Addebito diretto", color: "orange" },
  { name: "Non specificato", color: "gray" },
];

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
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(DEFAULT_LAYOUTS);
  const [containerWidth, setContainerWidth] = useState(1280);
  const containerRef = useRef<HTMLDivElement>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>("lg");
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = useState(220);

  function toggleSeries(name: string) {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  // Detect mobile breakpoint (below 768px → plain Stack, no grid overhead)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Listen for layout reset triggered from the Settings page
  useEffect(() => {
    const handler = () => setLayouts({ ...DEFAULT_LAYOUTS });
    window.addEventListener(DASHBOARD_LAYOUT_RESET_EVENT, handler);
    return () => window.removeEventListener(DASHBOARD_LAYOUT_RESET_EVENT, handler);
  }, []);

  // Measure container width so GridLayout knows how wide to render
  const onResize = useCallback((entries: ResizeObserverEntry[]) => {
    const width = entries[0]?.contentRect.width;
    if (width) requestAnimationFrame(() => setContainerWidth(width));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(onResize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [onResize]);

  useEffect(() => {
    const el = chartWrapperRef.current;
    if (!el) return;
    const h = el.getBoundingClientRect().height;
    if (h > 0) setChartHeight(h);
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height;
      if (height && height > 0) requestAnimationFrame(() => setChartHeight(height));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Load saved layout from localStorage after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    setLayouts(loadLayouts());
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

  // Build 18-month chart data (18 months preceding the current month)
  const chartData = Array.from({ length: 18 }, (_, i) => {
    const offset = 18 - i; // 18 = oldest, 1 = last month
    const m = ((thisMonth - offset) % 12 + 12) % 12;
    const y = thisYear + Math.floor((thisMonth - offset) / 12);
    const inv = filterInvoicesByRange(invoices, startOfMonth(y, m), endOfMonth(y, m));
    const label = new Date(y, m, 1).toLocaleDateString("it-IT", { month: "short", year: "2-digit" });
    const byMethod = (method: string | null) =>
      Math.round(sumTotal(inv.filter((i) => (i.supplier.paymentMethod ?? null) === method)) * 100) / 100;
    return {
      mese: label,
      Contanti: byMethod("CASH"),
      Bonifico: byMethod("BANK_TRANSFER"),
      "Addebito diretto": byMethod("DIRECT_DEBIT"),
      "Non specificato": byMethod(null),
    };
  });

  const nextBirthday = getNextBirthday(members);

  // Responsive onLayoutChange fires with (currentLayout, allLayouts) — update all breakpoints
  // Do NOT save here: this also fires on mount and would overwrite localStorage before loadLayouts restores data.
  function handleLayoutChange(_current: DashboardLayout[], allLayouts: ResponsiveLayouts): void {
    setLayouts(allLayouts);
  }

  // Save all breakpoint layouts when the user finishes dragging or resizing
  function handleInteractionStop(newLayout: DashboardLayout[]): void {
    const updated = { ...layouts, [currentBreakpoint]: newLayout };
    setLayouts(updated);
    saveLayouts(updated);
  }

  function handleBreakpointChange(bp: string): void {
    setCurrentBreakpoint(bp);
  }

  function isVisible(cardKey: string): boolean {
    if (!appSettings) return true;
    return appSettings.dashboard.visibleCards[cardKey as keyof typeof appSettings.dashboard.visibleCards] ?? true;
  }

  // Filter out hidden cards for each breakpoint layout passed to Responsive
  const visibleLayouts: ResponsiveLayouts = Object.fromEntries(
    Object.entries(layouts).map(([bp, bpLayout]) => [
      bp,
      bpLayout.filter((item) => isVisible(item.i)),
    ])
  );

  // Card contents — defined once, used in both mobile (Stack) and desktop (GridLayout)
  const cardNodes: Record<string, React.ReactNode> = {
    "fatture-mese": (
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
    ),
    "fatture-prev": (
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
    ),
    "fornitori": (
      <StatCard icon={IconBuildingStore} color="teal" label="Fornitori" loading={loading}>
        <Text fw={700} size="xl">{suppliers.length}</Text>
        <Text size="sm" c="dimmed">totali registrati</Text>
      </StatCard>
    ),
    "soci": (
      <StatCard icon={IconUsers} color="green" label="Soci" loading={loading}>
        <Text fw={700} size="xl">{members.length}</Text>
        <Text size="sm" c="dimmed">totali registrati</Text>
      </StatCard>
    ),
    "compleanno": (
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
          <Text size="sm" c="dimmed">Nessuna data di nascita registrata</Text>
        )}
      </StatCard>
    ),
    "grafico": (
      <Card withBorder shadow="sm" radius="md" padding="lg" style={{ height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <Group justify="space-between" align="flex-start" mb="md" className="drag-handle" style={{ cursor: isMobile ? "default" : "grab" }}>
          <Group gap="xs" align="center" wrap="wrap">
            <Text size="sm" c="dimmed" fw={500}>Andamento fatture — ultimi 18 mesi</Text>
            <Group gap={4} wrap="wrap">
              {CHART_SERIES.map((s) => (
                <Badge
                  key={s.name}
                  variant={hiddenSeries.has(s.name) ? "outline" : "light"}
                  color={s.color}
                  size="xs"
                  style={{ cursor: "pointer", opacity: hiddenSeries.has(s.name) ? 0.4 : 1, userSelect: "none" }}
                  onClick={(e) => { e.stopPropagation(); toggleSeries(s.name); }}
                >
                  {s.name}
                </Badge>
              ))}
            </Group>
          </Group>
          <ThemeIcon variant="light" color="blue" radius="md" size="lg">
            <IconFileInvoice size={20} />
          </ThemeIcon>
        </Group>
        <div ref={chartWrapperRef} style={{ flex: 1, minHeight: 0 }}>
          {loading ? (
            <Skeleton height={chartHeight} />
          ) : (
            <BarChart
              h={chartHeight}
              data={chartData}
            dataKey="mese"
            type="stacked"
            series={CHART_SERIES.filter((s) => !hiddenSeries.has(s.name))}
            withTooltip
            tooltipProps={{
              content: (props) => <ChartTooltipContent {...(props as unknown as { active?: boolean; payload?: TooltipEntry[]; label?: string })} />,
            }}
              yAxisProps={{
                tickFormatter: (v: number) =>
                  new Intl.NumberFormat("it-IT", { notation: "compact", maximumFractionDigits: 0 }).format(v),
              }}
            />
          )}
        </div>
      </Card>
    ),
  };

  const visibleCards = CARD_ORDER.filter((key) => isVisible(key));

  return (
    <Stack gap="md">
      <Title order={2}>Dashboard</Title>

      {isMobile ? (
        // --- Mobile: plain vertical stack, no drag/resize ---
        <Stack gap="md">
          {visibleCards.map((key) => (
            <div key={key}>{cardNodes[key]}</div>
          ))}
        </Stack>
      ) : (
        // --- Desktop: responsive drag & resize grid (lg ≥ 1200px: 18 cols, md 768-1199px: 12 cols) ---
        <div ref={containerRef} style={{ width: "100%" }}>
          <Responsive
            layouts={visibleLayouts}
            width={containerWidth}
            breakpoints={BREAKPOINTS}
            cols={COLS}
            rowHeight={15}
            margin={[8, 8]}
            containerPadding={[0, 0]}
            draggableHandle=".drag-handle"
            onLayoutChange={handleLayoutChange}
            onBreakpointChange={handleBreakpointChange}
            onDragStop={handleInteractionStop}
            onResizeStop={handleInteractionStop}
            style={{ minHeight: 200 }}
          >
            {visibleCards.map((key) => (
              <div key={key}>{cardNodes[key]}</div>
            ))}
          </Responsive>
        </div>
      )}
    </Stack>
  );
}
