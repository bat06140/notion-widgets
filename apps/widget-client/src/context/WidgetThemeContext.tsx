import { createContext, useEffect, useMemo, useState } from "react";
import type { WidgetKey } from "@repo/shared";
import {
  DEFAULT_WIDGET_THEME,
  readWidgetThemeFromStorage,
  WidgetTheme,
  writeWidgetThemeToStorage,
} from "../lib/widget-theme.js";

export interface WidgetThemeContextValue {
  theme: WidgetTheme;
  saveTheme: (theme: WidgetTheme) => void;
}

export const WidgetThemeContext =
  createContext<WidgetThemeContextValue | null>(null);

export const WidgetThemeProvider = ({
  children,
  widget,
}: {
  children: React.ReactNode;
  widget: WidgetKey;
}) => {
  const [theme, setTheme] = useState<WidgetTheme>(DEFAULT_WIDGET_THEME);

  useEffect(() => {
    setTheme(readWidgetThemeFromStorage(window.localStorage, widget));
  }, [widget]);

  const value = useMemo<WidgetThemeContextValue>(
    () => ({
      theme,
      saveTheme: (nextTheme) => {
        setTheme(nextTheme);
        writeWidgetThemeToStorage(window.localStorage, widget, nextTheme);
      },
    }),
    [theme, widget]
  );

  return (
    <WidgetThemeContext.Provider value={value}>
      {children}
    </WidgetThemeContext.Provider>
  );
};
