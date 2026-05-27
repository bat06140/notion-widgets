import type { WidgetKey } from "@repo/shared";

export interface WidgetTheme {
  color1: string;
  color2: string;
}

export interface RgbaColorValue {
  r: number;
  g: number;
  b: number;
  a: number;
}

export type ThemeInputMode = "hex" | "rgba";

export const WIDGET_THEME_STORAGE_KEY = "widgetTheme";
export const getWidgetThemeStorageKey = (widget: WidgetKey): string =>
  `${WIDGET_THEME_STORAGE_KEY}:${widget}`;

export const DEFAULT_WIDGET_THEME: WidgetTheme = {
  color1: "#37352F",
  color2: "#FFFFFF",
};

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
const RGBA_COLOR_REGEX =
  /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|0?\.\d+|1))?\s*\)$/i;

export const isHexColor = (value: string): boolean => {
  return HEX_COLOR_REGEX.test(value);
};

const clampChannel = (value: number) => Math.min(255, Math.max(0, value));
const clampAlpha = (value: number) => Math.min(1, Math.max(0, value));

export const formatRgbaString = ({ r, g, b, a }: RgbaColorValue): string => {
  return `rgba(${clampChannel(r)}, ${clampChannel(g)}, ${clampChannel(
    b
  )}, ${clampAlpha(a)})`;
};

export const rgbaToHex = ({ r, g, b }: RgbaColorValue): string => {
  return `#${[r, g, b]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
};

export const formatThemeInputValue = (
  color: string,
  mode: ThemeInputMode
): string => {
  const parsed = parseWidgetThemeColor(color) ?? {
    r: 55,
    g: 53,
    b: 47,
    a: 1,
  };

  return mode === "hex" ? rgbaToHex(parsed) : formatRgbaString(parsed);
};

export const parseWidgetThemeColor = (
  value: string
): RgbaColorValue | undefined => {
  const trimmedValue = value.trim();

  if (isHexColor(trimmedValue)) {
    const { r, g, b } = hexToRgb(trimmedValue);
    return { r, g, b, a: 1 };
  }

  const match = trimmedValue.match(RGBA_COLOR_REGEX);

  if (!match) {
    return undefined;
  }

  const parsed = {
    r: Number.parseInt(match[1], 10),
    g: Number.parseInt(match[2], 10),
    b: Number.parseInt(match[3], 10),
    a: match[4] == null ? 1 : Number.parseFloat(match[4]),
  };

  if (
    Number.isNaN(parsed.r) ||
    Number.isNaN(parsed.g) ||
    Number.isNaN(parsed.b) ||
    Number.isNaN(parsed.a)
  ) {
    return undefined;
  }

  return {
    r: clampChannel(parsed.r),
    g: clampChannel(parsed.g),
    b: clampChannel(parsed.b),
    a: clampAlpha(parsed.a),
  };
};

export const normalizeThemeStorageColor = (
  value: string
): string | undefined => {
  const parsed = parseWidgetThemeColor(value);

  if (!parsed) {
    return undefined;
  }

  return parsed.a >= 0.999 ? rgbaToHex(parsed) : formatRgbaString(parsed);
};

const isThemeColor = (value: string): boolean => {
  return parseWidgetThemeColor(value) != null;
};

export const serializeWidgetThemeStorageValue = (theme: WidgetTheme): string => {
  return encodeURIComponent(JSON.stringify(theme));
};

export const parseWidgetThemeStorageValue = (
  value: string | undefined
): WidgetTheme => {
  if (!value) {
    return DEFAULT_WIDGET_THEME;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<WidgetTheme>;

    if (
      typeof parsed.color1 === "string" &&
      typeof parsed.color2 === "string" &&
      isThemeColor(parsed.color1) &&
      isThemeColor(parsed.color2)
    ) {
      return {
        color1: parsed.color1,
        color2: parsed.color2,
      };
    }
  } catch {
    return DEFAULT_WIDGET_THEME;
  }

  return DEFAULT_WIDGET_THEME;
};

export const readWidgetThemeFromStorage = (
  storage: Pick<Storage, "getItem">,
  widget: WidgetKey
): WidgetTheme => {
  try {
    return parseWidgetThemeStorageValue(
      storage.getItem(getWidgetThemeStorageKey(widget)) ?? undefined
    );
  } catch {
    return DEFAULT_WIDGET_THEME;
  }
};

export const writeWidgetThemeToStorage = (
  storage: Pick<Storage, "setItem">,
  widget: WidgetKey,
  theme: WidgetTheme
): void => {
  try {
    storage.setItem(
      getWidgetThemeStorageKey(widget),
      serializeWidgetThemeStorageValue(theme)
    );
  } catch {
    return;
  }
};

const hexToRgb = (hex: string) => {
  const normalizedHex = hex.replace("#", "");

  return {
    r: Number.parseInt(normalizedHex.slice(0, 2), 16),
    g: Number.parseInt(normalizedHex.slice(2, 4), 16),
    b: Number.parseInt(normalizedHex.slice(4, 6), 16),
  };
};

export const withOpacity = (color: string, opacity: number): string => {
  const rgba = parseWidgetThemeColor(color);

  if (!rgba) {
    return color;
  }

  return formatRgbaString({
    ...rgba,
    a: clampAlpha(rgba.a * opacity),
  });
};

export const getContrastTextColor = (color: string): string => {
  const rgba = parseWidgetThemeColor(color);

  if (!rgba) {
    return "#FFFFFF";
  }

  const { r, g, b } = rgba;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.65 ? "#111111" : "#FFFFFF";
};
