import { createContext, useEffect, useMemo, useState } from "react";
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
}: {
  children: React.ReactNode;
}) => {
  const [theme, setTheme] = useState<WidgetTheme>(DEFAULT_WIDGET_THEME);

  useEffect(() => {
    setTheme(readWidgetThemeFromStorage(window.localStorage));
  }, []);

  const value = useMemo<WidgetThemeContextValue>(
    () => ({
      theme,
      saveTheme: (nextTheme) => {
        setTheme(nextTheme);
        writeWidgetThemeToStorage(window.localStorage, nextTheme);
      },
    }),
    [theme]
  );

  return (
    <WidgetThemeContext.Provider value={value}>
      {children}
    </WidgetThemeContext.Provider>
  );
};
