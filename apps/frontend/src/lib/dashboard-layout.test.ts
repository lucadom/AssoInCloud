import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  LAYOUT_STORAGE_KEY,
  DASHBOARD_LAYOUT_RESET_EVENT,
  DEFAULT_LAYOUTS,
  loadLayouts,
  saveLayouts,
  resetLayouts,
} from "./dashboard-layout";

describe("loadLayouts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return DEFAULT_LAYOUTS when nothing is saved", () => {
    const result = loadLayouts();
    expect(result).toEqual(DEFAULT_LAYOUTS);
  });

  it("should merge saved layouts with defaults", () => {
    const saved = {
      lg: [{ i: "fatture-mese", x: 1, y: 2, w: 4, h: 5 }],
    };
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(saved));
    const result = loadLayouts();
    // The saved item should be merged into the lg layout
    const fattureMese = result.lg.find((l) => l.i === "fatture-mese");
    expect(fattureMese?.x).toBe(1);
    expect(fattureMese?.y).toBe(2);
    expect(fattureMese?.w).toBe(4);
    expect(fattureMese?.h).toBe(5);
  });

  it("should use default layout for breakpoints not in saved", () => {
    const saved = { lg: DEFAULT_LAYOUTS.lg };
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(saved));
    const result = loadLayouts();
    expect(result.md).toEqual(DEFAULT_LAYOUTS.md);
  });

  it("should return defaults when saved data is invalid JSON", () => {
    localStorage.setItem(LAYOUT_STORAGE_KEY, "not-json");
    const result = loadLayouts();
    expect(result).toEqual(DEFAULT_LAYOUTS);
  });
});

describe("saveLayouts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should save layouts to localStorage", () => {
    saveLayouts(DEFAULT_LAYOUTS);
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.lg).toBeDefined();
    expect(parsed.md).toBeDefined();
  });
});

describe("resetLayouts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should remove layout from localStorage", () => {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(DEFAULT_LAYOUTS));
    resetLayouts();
    expect(localStorage.getItem(LAYOUT_STORAGE_KEY)).toBeNull();
  });

  it("should dispatch the reset custom event", () => {
    const handler = vi.fn();
    window.addEventListener(DASHBOARD_LAYOUT_RESET_EVENT, handler);
    resetLayouts();
    window.removeEventListener(DASHBOARD_LAYOUT_RESET_EVENT, handler);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
