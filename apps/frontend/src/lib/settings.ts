// Generic app settings stored in localStorage.
// Add new settings sections here as the app grows.

const SETTINGS_KEY = "assoincloud-settings-v1";

export type DashboardCardKey =
  | "fatture-mese"
  | "fatture-prev"
  | "fornitori"
  | "soci"
  | "compleanno"
  | "grafico";

export interface AppSettings {
  dashboard: {
    visibleCards: Record<DashboardCardKey, boolean>;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  dashboard: {
    visibleCards: {
      "fatture-mese": true,
      "fatture-prev": true,
      "fornitori": true,
      "soci": true,
      "compleanno": true,
      "grafico": true,
    },
  },
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed: Partial<AppSettings> = JSON.parse(raw);
      // Deep merge: defaults win for missing keys
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        dashboard: {
          ...DEFAULT_SETTINGS.dashboard,
          ...parsed.dashboard,
          visibleCards: {
            ...DEFAULT_SETTINGS.dashboard.visibleCards,
            ...parsed.dashboard?.visibleCards,
          },
        },
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
