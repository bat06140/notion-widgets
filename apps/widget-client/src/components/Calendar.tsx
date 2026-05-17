import { useRef, useState } from "react";
import CalendarHeader from "./CalendarHeader.js";
import { Day } from "./Day.js";
import { css } from "@emotion/react";
import { SquareContainer } from "./SquareContainer.js";
import { cn } from "../lib/utils.js";
import { WidgetLayout } from "../lib/view-config.js";
import { WidgetFooter } from "./WidgetFooter.js";
import { WidgetThemeEditor } from "./WidgetThemeEditor.js";
import { useWidgetTheme } from "../hook/useWidgetTheme.js";
import { DEFAULT_WIDGET_THEME, withOpacity } from "../lib/widget-theme.js";
import {
  DEFAULT_WIDGET_PURCHASE_URL,
  getThemeEditorMode,
  shouldShowWidgetBranding,
} from "../lib/widget-access.js";
import { getBrowserLocale, getCalendarWeekdayLabels } from "../lib/locale.js";

const Calendar = ({
  onDateSelected,
  layout = "full",
  accessGranted = false,
  allowThemeEditor = true,
  showBranding,
  purchaseUrl = DEFAULT_WIDGET_PURCHASE_URL,
  onLayoutChange,
}: {
  onDateSelected?: (event: React.MouseEvent, date: Date) => void;
  layout?: WidgetLayout;
  accessGranted?: boolean;
  allowThemeEditor?: boolean;
  showBranding?: boolean;
  purchaseUrl?: string;
  onLayoutChange?: (layout: WidgetLayout) => void;
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const { theme } = useWidgetTheme();
  const effectiveTheme = accessGranted ? theme : DEFAULT_WIDGET_THEME;
  const editorMode = getThemeEditorMode(accessGranted, allowThemeEditor);
  const shouldRenderBranding = shouldShowWidgetBranding(
    accessGranted,
    showBranding
  );
  const locale = getBrowserLocale();

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const daysOfWeek = getCalendarWeekdayLabels(locale);

  function generateCalendar(month: number, year: number) {
    setCurrentMonth(month);
    setCurrentYear(year);
  }

  function getDaysFromPreviousMonth(month: number, year: number) {
    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1; // Ajuster si la semaine commence le lundi
    // Calculer le nombre de jours à afficher pour le mois précédent
    const daysFromPrevMonth = firstDay;
    const prevMonthDays = new Date(year, month, 0).getDate();
    const prevMonthDaysInCalendar = [];
    for (let i = daysFromPrevMonth; i > 0; i--) {
      prevMonthDaysInCalendar.push(prevMonthDays - i + 1);
    }
    return prevMonthDaysInCalendar;
  }

  function getDaysFromCurrentMonth(month: number, year: number) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInMonthInCalendar = [];
    for (let i = 1; i <= daysInMonth; i++) {
      daysInMonthInCalendar[i - 1] = i;
    }
    return daysInMonthInCalendar;
  }
  function getDaysFromNextMonth(
    daysFromPreviousMonth: number,
    daysFromCurrentMonth: number
  ) {
    const daysInNextMonthCount =
      42 - daysFromPreviousMonth - daysFromCurrentMonth;
    const daysInNextMonth = [];
    for (let i = 1; i <= daysInNextMonthCount; i++) {
      daysInNextMonth[i - 1] = i;
    }
    return daysInNextMonth;
  }

  function changeMonth(month: number) {
    let newMonth = currentMonth + month;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      setCurrentMonth(newMonth);
      newYear = currentYear - 1;
      setCurrentYear(newYear);
    } else if (newMonth > 11) {
      newMonth = 0;
      setCurrentMonth(newMonth);
      newYear = currentYear + 1;
      setCurrentYear(newYear);
    } else {
      setCurrentMonth(newMonth);
    }
  }

  const daysFromPreviousMonth = getDaysFromPreviousMonth(
    currentMonth,
    currentYear
  );
  const daysFromCurrentMonth = getDaysFromCurrentMonth(
    currentMonth,
    currentYear
  );
  const daysFromNextMonth = getDaysFromNextMonth(
    daysFromPreviousMonth.length,
    daysFromCurrentMonth.length
  );

  return (
    <SquareContainer
      layout={layout}
      className={cn(
        "group relative gap-[2px]",
        layout === "full" && "rounded-[8px] p-[2px]"
      )}
      style={{
        backgroundColor: effectiveTheme.color2,
      }}
    >
      <WidgetThemeEditor
        mode={editorMode}
        purchaseUrl={purchaseUrl}
        layout={layout}
        onLayoutChange={onLayoutChange}
      />
      <CalendarHeader
        currentMonth={currentMonth}
        currentYear={currentYear}
        generateCalendar={generateCalendar}
        changeMonth={changeMonth}
        theme={effectiveTheme}
      />
      <div
        ref={gridRef}
        css={css`
          grid-template-rows: repeat(7, minmax(0, 1fr));
        `}
        className={cn(
          "grid w-full min-h-0 grid-cols-7 gap-[2px] rounded-[8px]   box-border",
          shouldRenderBranding ? "flex-[1_1_0]" : "flex-1"
        )}
        style={{
          borderColor: withOpacity(effectiveTheme.color1, 0.12),
          color: effectiveTheme.color1,
        }}
      >
        {daysOfWeek.map((day, index) => (
          <Day key={index} theme={effectiveTheme} isWeekdayHeader={true}>
            {day}
          </Day>
        ))}
        {daysFromPreviousMonth.map((day, index) => (
          <Day
            key={index}
            theme={effectiveTheme}
            isOtherMonth={true}
            onClick={(e: React.MouseEvent) => {
              onDateSelected?.(e, new Date(currentYear, currentMonth - 1, day));
            }}
          >
            {day.toString()}
          </Day>
        ))}
        {daysFromCurrentMonth.map((day, index) => {
          const isToday =
            day === new Date().getDate() &&
            currentMonth === new Date().getMonth() &&
            currentYear === new Date().getFullYear();
          return (
            <Day
              key={index}
              theme={effectiveTheme}
              isToday={isToday}
              onClick={(e: React.MouseEvent) => {
                onDateSelected?.(e, new Date(currentYear, currentMonth, day));
              }}
            >
              {day.toString()}
            </Day>
          );
        })}
        {daysFromNextMonth.map((day, index) => (
          <Day
            key={index}
            theme={effectiveTheme}
            isOtherMonth={true}
            onClick={(e: React.MouseEvent) => {
              onDateSelected?.(e, new Date(currentYear, currentMonth + 1, day));
            }}
          >
            {day.toString()}
          </Day>
        ))}
      </div>
      {shouldRenderBranding && <WidgetFooter theme={effectiveTheme} />}
    </SquareContainer>
  );
};
export default Calendar;
