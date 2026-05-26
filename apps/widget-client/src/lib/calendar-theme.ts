import { WidgetTheme, withOpacity } from "./widget-theme.js";

export interface CalendarDayAppearanceOptions {
  isWeekdayHeader?: boolean;
  isToday?: boolean;
  isOtherMonth?: boolean;
}

export interface CalendarDayAppearance {
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  borderStyle: "solid" | "dashed" | "none";
  hoverBorderColor: string;
  hoverBorderStyle: "solid" | "dashed" | "none";
  hoverBackgroundColor: string;
  hoverTextColor: string;
  interactive: boolean;
}

export const getCalendarDayAppearance = (
  theme: WidgetTheme,
  {
    isWeekdayHeader = false,
    isToday = false,
    isOtherMonth = false,
  }: CalendarDayAppearanceOptions = {}
): CalendarDayAppearance => {
  if (isWeekdayHeader) {
    return {
      textColor: theme.color2,
      backgroundColor: theme.color1,
      borderColor: "transparent",
      borderStyle: "none",
      hoverBorderColor: "transparent",
      hoverBorderStyle: "none",
      hoverBackgroundColor: theme.color1,
      hoverTextColor: theme.color2,
      interactive: false,
    };
  }

  if (isToday) {
    return {
      textColor: theme.color2,
      backgroundColor: theme.color1,
      borderColor: theme.color1,
      borderStyle: "solid",
      hoverBorderColor: theme.color1,
      hoverBorderStyle: "dashed",
      hoverBackgroundColor: theme.color1,
      hoverTextColor: theme.color2,
      interactive: true,
    };
  }

  return {
    textColor: isOtherMonth ? withOpacity(theme.color1, 0.25) : theme.color1,
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderStyle: "solid",
    hoverBorderColor: theme.color1,
    hoverBorderStyle: "dashed",
    hoverBackgroundColor: "transparent",
    hoverTextColor: theme.color1,
    interactive: true,
  };
};
