export const LAYOUT_STORAGE_KEY = "assoincloud-dashboard-layout-v4";

/** Custom event dispatched when the layout is reset to defaults (same-tab notification). */
export const DASHBOARD_LAYOUT_RESET_EVENT = "assoincloud:dashboard-layout-reset";

export interface DashboardLayout {
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

export type ResponsiveLayouts = Record<string, DashboardLayout[]>;

// lg default: 18 columns
export const DEFAULT_LG_LAYOUT: DashboardLayout[] = [
  { i: "fatture-mese", x: 0,  y: 0,  w: 6,  h: 6,  minW: 1, minH: 1 },
  { i: "fatture-prev", x: 6,  y: 0,  w: 6,  h: 12, minW: 1, minH: 1 },
  { i: "fornitori",    x: 0,  y: 6,  w: 6,  h: 6,  minW: 1, minH: 1 },
  { i: "soci",         x: 12, y: 0,  w: 6,  h: 6,  minW: 1, minH: 1 },
  { i: "compleanno",   x: 12, y: 6,  w: 6,  h: 6,  minW: 1, minH: 1 },
  { i: "grafico",      x: 0,  y: 12, w: 18, h: 14, minW: 1, minH: 1 },
];

// md default: 12 columns
export const DEFAULT_MD_LAYOUT: DashboardLayout[] = [
  { i: "fatture-mese", x: 0, y: 0,  w: 4,  h: 10, minW: 1, minH: 1 },
  { i: "fatture-prev", x: 4, y: 0,  w: 4,  h: 16, minW: 1, minH: 1 },
  { i: "fornitori",    x: 8, y: 0,  w: 4,  h: 10, minW: 1, minH: 1 },
  { i: "soci",         x: 0, y: 10, w: 4,  h: 10, minW: 1, minH: 1 },
  { i: "compleanno",   x: 8, y: 10, w: 4,  h: 10, minW: 1, minH: 1 },
  { i: "grafico",      x: 0, y: 20, w: 12, h: 22, minW: 1, minH: 1 },
];

export const DEFAULT_LAYOUTS: ResponsiveLayouts = {
  lg: DEFAULT_LG_LAYOUT,
  md: DEFAULT_MD_LAYOUT,
};

function mergeWithDefaults(defaults: DashboardLayout[], saved: DashboardLayout[]): DashboardLayout[] {
  return defaults.map((def) => {
    const s = saved.find((l) => l.i === def.i);
    return s ? { ...def, x: s.x, y: s.y, w: s.w, h: s.h } : def;
  });
}

export function loadLayouts(): ResponsiveLayouts {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (raw) {
      const parsed: ResponsiveLayouts = JSON.parse(raw);
      return Object.fromEntries(
        Object.entries(DEFAULT_LAYOUTS).map(([bp, defLayout]) => [
          bp,
          parsed[bp] ? mergeWithDefaults(defLayout, parsed[bp]) : defLayout,
        ])
      );
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_LAYOUTS };
}

export function saveLayouts(layouts: ResponsiveLayouts): void {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
  } catch {
    // ignore
  }
}

/**
 * Removes the saved layout from localStorage and notifies the DashboardPage
 * (same tab) via a custom event so it can reset its state immediately.
 */
export function resetLayouts(): void {
  try {
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(DASHBOARD_LAYOUT_RESET_EVENT));
}
