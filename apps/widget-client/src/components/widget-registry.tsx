import Calendar from "./Calendar.js";
import { Deadline } from "./Deadline.js";
import FlipClock from "./FlipClock.js";
import { DEFAULT_WIDGET_PURCHASE_URL } from "../lib/widget-access.js";
import { AppLocale, getTranslationSet } from "../lib/locale.js";
import { WidgetKey, WidgetLayout } from "../lib/view-config.js";

export const getWidgetOptions = (
  locale: AppLocale
): Array<{ value: WidgetKey; label: string }> => {
  const translations = getTranslationSet(locale);

  return [
    { value: "calendar", label: translations.widgetOptions.calendar },
    { value: "deadline", label: translations.widgetOptions.deadline },
    { value: "clock", label: translations.widgetOptions.clock },
  ];
};

export const renderWidget = ({
  widget,
  layout,
  accessGranted = false,
  allowThemeEditor = true,
  purchaseUrl = DEFAULT_WIDGET_PURCHASE_URL,
  onLayoutChange,
}: {
  widget: WidgetKey;
  layout: WidgetLayout;
  accessGranted?: boolean;
  allowThemeEditor?: boolean;
  purchaseUrl?: string;
  onLayoutChange?: (layout: WidgetLayout) => void;
}) => {
  switch (widget) {
    case "calendar":
      return (
        <Calendar
          layout={layout}
          accessGranted={accessGranted}
          allowThemeEditor={allowThemeEditor}
          purchaseUrl={purchaseUrl}
          onLayoutChange={onLayoutChange}
        />
      );
    case "deadline":
      return (
        <Deadline
          layout={layout}
          accessGranted={accessGranted}
          allowThemeEditor={allowThemeEditor}
          purchaseUrl={purchaseUrl}
          onLayoutChange={onLayoutChange}
        />
      );
    case "clock":
      return (
        <FlipClock
          layout={layout}
          accessGranted={accessGranted}
          allowThemeEditor={allowThemeEditor}
          purchaseUrl={purchaseUrl}
          onLayoutChange={onLayoutChange}
        />
      );
    default:
      return (
        <Calendar
          layout={layout}
          accessGranted={accessGranted}
          allowThemeEditor={allowThemeEditor}
          purchaseUrl={purchaseUrl}
          onLayoutChange={onLayoutChange}
        />
      );
  }
};
