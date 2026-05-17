import { useEffect, useState, MouseEvent } from "react";
import { CenteredPopover } from "./CenteredPopover.js";
import Calendar from "./Calendar.js";
import { WidgetLayout } from "../lib/view-config.js";
import {
  formatDeadlineLabel,
  getDeadlineFontScale,
} from "../lib/deadline.js";
import { DEFAULT_WIDGET_PURCHASE_URL } from "../lib/widget-access.js";

export const Deadline = ({
  layout = "full",
  accessGranted = false,
  allowThemeEditor = true,
  showBranding,
  purchaseUrl = DEFAULT_WIDGET_PURCHASE_URL,
  onLayoutChange,
}: {
  layout?: WidgetLayout;
  accessGranted?: boolean;
  allowThemeEditor?: boolean;
  showBranding?: boolean;
  purchaseUrl?: string;
  onLayoutChange?: (layout: WidgetLayout) => void;
}) => {
  const [showPop, setShowPop] = useState(false);
  const [targetDate, setTargetDate] = useState<Date>();
  const [daysUntilDeadline, setDaysUntilDeadline] = useState<number>();

  const onDateSelected = (event: MouseEvent, date: Date) => {
    event.preventDefault();
    event.stopPropagation();
    setTargetDate(date);
    localStorage.setItem("date", date.toDateString());
    setShowPop(false);
  };

  useEffect(() => {
    const updateDaysUntilDeadline = () => {
      if (!targetDate) {
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const target = new Date(targetDate);
      target.setHours(0, 0, 0, 0);

      const timeDiff = target.valueOf() - today.valueOf();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      setDaysUntilDeadline(daysDiff);
    };

    updateDaysUntilDeadline();

    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      updateDaysUntilDeadline();
      const dailyInterval = setInterval(updateDaysUntilDeadline, 86400000);
      return () => clearInterval(dailyInterval);
    }, timeUntilMidnight);

    return () => clearTimeout(midnightTimeout);
  }, [targetDate]);

  useEffect(() => {
    const savedDate = localStorage.getItem("date");
    if (savedDate) {
      const date = new Date(savedDate);
      if (!Number.isNaN(date.getTime())) {
        setTargetDate(date);
      }
    }
  }, []);

  const label = formatDeadlineLabel(daysUntilDeadline);

  return (
    <CenteredPopover
      textContent={label}
      textFontScale={getDeadlineFontScale(label)}
      showPop={showPop}
      layout={layout}
      accessGranted={accessGranted}
      allowThemeEditor={allowThemeEditor}
      showBranding={showBranding}
      purchaseUrl={purchaseUrl}
      onLayoutChange={onLayoutChange}
      onPopTrigger={(event: React.MouseEvent) => {
        event.preventDefault();
        if (!showPop) {
          setShowPop(true);
        }
      }}
      onClickOutside={() => setShowPop(false)}
    >
      <Calendar
        layout="full"
        accessGranted={accessGranted}
        allowThemeEditor={false}
        showBranding={false}
        purchaseUrl={purchaseUrl}
        onDateSelected={onDateSelected}
      />
    </CenteredPopover>
  );
};
