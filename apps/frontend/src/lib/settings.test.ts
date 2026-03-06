import { describe, expect, it, beforeEach } from "vitest";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from "./settings";

const SETTINGS_KEY = "assoincloud-settings-v1";

describe("loadSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return DEFAULT_SETTINGS when nothing is saved", () => {
    const result = loadSettings();
    expect(result).toEqual(DEFAULT_SETTINGS);
  });

  it("should return saved settings merged with defaults", () => {
    const partial = {
      dashboard: {
        visibleCards: { "fatture-mese": false },
      },
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(partial));
    const result = loadSettings();
    expect(result.dashboard.visibleCards["fatture-mese"]).toBe(false);
    // Other cards should keep default (true)
    expect(result.dashboard.visibleCards["soci"]).toBe(true);
  });

  it("should return defaults when saved data is invalid JSON", () => {
    localStorage.setItem(SETTINGS_KEY, "not-valid-json");
    const result = loadSettings();
    expect(result).toEqual(DEFAULT_SETTINGS);
  });
});

describe("saveSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should persist settings to localStorage", () => {
    const settings = { ...DEFAULT_SETTINGS };
    saveSettings(settings);
    const raw = localStorage.getItem(SETTINGS_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.dashboard).toBeDefined();
  });
});
