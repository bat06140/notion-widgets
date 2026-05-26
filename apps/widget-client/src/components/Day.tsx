import { useMemo, useState } from "react";
import clsx from "clsx";
import { AutosizeText } from "./AutosizeText.js";
import { WidgetTheme } from "../lib/widget-theme.js";
import { getCalendarDayAppearance } from "../lib/calendar-theme.js";

export const Day = ({
  isWeekdayHeader = false,
  isToday = false,
  isOtherMonth = false,
  className,
  onClick,
  theme,
  children,
}: {
  isWeekdayHeader?: boolean;
  isToday?: boolean;
  isOtherMonth?: boolean;
  className?: string;
  hoverEnabled?: boolean;
  date?: Date;
  onClick?: React.MouseEventHandler<HTMLElement>;
  theme: WidgetTheme;
  children: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const appearance = getCalendarDayAppearance(theme, {
    isWeekdayHeader,
    isToday,
    isOtherMonth,
  });
  const resolvedAppearance = useMemo(
    () => ({
      textColor:
        appearance.interactive && isHovered
          ? appearance.hoverTextColor
          : appearance.textColor,
      backgroundColor:
        appearance.interactive && isHovered
          ? appearance.hoverBackgroundColor
          : appearance.backgroundColor,
      borderColor:
        appearance.interactive && isHovered
          ? appearance.hoverBorderColor
          : appearance.borderColor,
      borderStyle:
        appearance.interactive && isHovered
          ? appearance.hoverBorderStyle
          : appearance.borderStyle,
    }),
    [appearance, isHovered]
  );

  return (
    <div className="w-full h-full flex items-center justify-center">
      <AutosizeText
        wrapperTw={clsx(
          "h-full w-full rounded-[8px]",
          className,
          "border border-[var(--day-border)] bg-[var(--day-bg)] text-[var(--day-text)] transition-colors",
          resolvedAppearance.borderStyle === "none" && "border-transparent",
          resolvedAppearance.borderStyle === "solid" && "border-solid",
          resolvedAppearance.borderStyle === "dashed" && "border-dashed"
        )}
        wrapperStyle={{
          ["--day-bg" as string]: resolvedAppearance.backgroundColor,
          ["--day-text" as string]: resolvedAppearance.textColor,
          ["--day-border" as string]: resolvedAppearance.borderColor,
        }}
        heightRatio={isWeekdayHeader ? 0.46 : 0.7}
        onClick={onClick}
        onMouseEnter={() => {
          if (appearance.interactive) {
            setIsHovered(true);
          }
        }}
        onMouseLeave={() => {
          if (appearance.interactive) {
            setIsHovered(false);
          }
        }}
      >
        {children}
      </AutosizeText>
    </div>
  );
};
