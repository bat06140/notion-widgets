import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_WIDGET_THEME,
  formatThemeInputValue,
  formatRgbaString,
  getContrastTextColor,
  normalizeThemeStorageColor,
  parseWidgetThemeStorageValue,
  parseWidgetThemeColor,
  readWidgetThemeFromStorage,
  rgbaToHex,
  serializeWidgetThemeStorageValue,
  getWidgetThemeStorageKey,
  writeWidgetThemeToStorage,
  withOpacity,
} from "../src/lib/widget-theme.js";

const createStorage = (initialValues: Record<string, string> = {}): Storage => {
  const values = new Map(Object.entries(initialValues));

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
};

test("serializeWidgetThemeStorageValue stores the two colors as encoded json", () => {
  const serialized = serializeWidgetThemeStorageValue({
    color1: "#123456",
    color2: "#abcdef",
  });

  assert.match(serialized, /%7B/);
  assert.match(serialized, /123456/i);
  assert.match(serialized, /abcdef/i);
});

test("parseWidgetThemeStorageValue restores a valid encoded theme", () => {
  const parsed = parseWidgetThemeStorageValue(
    serializeWidgetThemeStorageValue({
      color1: "#123456",
      color2: "#abcdef",
    })
  );

  assert.deepEqual(parsed, {
    color1: "#123456",
    color2: "#abcdef",
  });
});

test("parseWidgetThemeStorageValue falls back to default for invalid colors", () => {
  const parsed = parseWidgetThemeStorageValue(
    encodeURIComponent(JSON.stringify({ color1: "red", color2: "#abcdef" }))
  );

  assert.deepEqual(parsed, DEFAULT_WIDGET_THEME);
});

test("readWidgetThemeFromStorage reads widgetTheme from widget-specific localStorage", () => {
  const storage = createStorage({
    [getWidgetThemeStorageKey("calendar")]: serializeWidgetThemeStorageValue({
      color1: "#123456",
      color2: "#abcdef",
    }),
  });

  assert.deepEqual(readWidgetThemeFromStorage(storage, "calendar"), {
    color1: "#123456",
    color2: "#abcdef",
  });
});

test("readWidgetThemeFromStorage does not share themes across widgets", () => {
  const storage = createStorage({
    [getWidgetThemeStorageKey("calendar")]: serializeWidgetThemeStorageValue({
      color1: "#123456",
      color2: "#abcdef",
    }),
  });

  assert.deepEqual(
    readWidgetThemeFromStorage(storage, "clock"),
    DEFAULT_WIDGET_THEME
  );
});

test("writeWidgetThemeToStorage writes widgetTheme to widget-specific localStorage", () => {
  const storage = createStorage();

  writeWidgetThemeToStorage(storage, "deadline", {
    color1: "#123456",
    color2: "#abcdef",
  });

  assert.equal(
    storage.getItem(getWidgetThemeStorageKey("deadline")),
    serializeWidgetThemeStorageValue({
      color1: "#123456",
      color2: "#abcdef",
    })
  );
});

test("writeWidgetThemeToStorage ignores unavailable localStorage", () => {
  const storage: Pick<Storage, "setItem"> = {
    setItem: () => {
      throw new Error("Storage unavailable");
    },
  };

  assert.doesNotThrow(() =>
    writeWidgetThemeToStorage(storage, "clock", {
      color1: "#123456",
      color2: "#abcdef",
    })
  );
});

test("withOpacity converts a hex color into rgba", () => {
  assert.equal(withOpacity("#123456", 0.25), "rgba(18, 52, 86, 0.25)");
});

test("getContrastTextColor returns white for dark colors and black for light colors", () => {
  assert.equal(getContrastTextColor("#111111"), "#FFFFFF");
  assert.equal(getContrastTextColor("#f5f5f5"), "#111111");
});

test("parseWidgetThemeColor parses rgba strings", () => {
  assert.deepEqual(parseWidgetThemeColor("rgba(18, 52, 86, 0.5)"), {
    r: 18,
    g: 52,
    b: 86,
    a: 0.5,
  });
});

test("formatRgbaString produces a normalized rgba string", () => {
  assert.equal(
    formatRgbaString({ r: 18, g: 52, b: 86, a: 0.5 }),
    "rgba(18, 52, 86, 0.5)"
  );
});

test("rgbaToHex ignores alpha and returns the rgb hex value", () => {
  assert.equal(rgbaToHex({ r: 18, g: 52, b: 86, a: 0.5 }), "#123456");
});

test("formatThemeInputValue exposes the selected color in rgba mode", () => {
  assert.equal(
    formatThemeInputValue("#123456", "rgba"),
    "rgba(18, 52, 86, 1)"
  );
});

test("normalizeThemeStorageColor returns normalized colors only when input is valid", () => {
  assert.equal(normalizeThemeStorageColor("rgba(18, 52, 86, 1)"), "#123456");
  assert.equal(normalizeThemeStorageColor("#123456"), "#123456");
  assert.equal(normalizeThemeStorageColor("#123"), undefined);
});
