import test from "node:test";
import assert from "node:assert/strict";
import { getCalendarDayAppearance } from "../src/lib/calendar-theme.js";

const theme = {
  color1: "#D12D2D",
  color2: "#F4ECDD",
};

test("weekday header cells use a filled color1 background with color2 text and no hover", () => {
  const appearance = getCalendarDayAppearance(theme, {
    isWeekdayHeader: true,
  });

  assert.equal(appearance.backgroundColor, theme.color1);
  assert.equal(appearance.textColor, theme.color2);
  assert.equal(appearance.hoverBorderStyle, "none");
  assert.equal(appearance.interactive, false);
});

test("today cell uses a filled color1 background with color2 text and a solid border", () => {
  const appearance = getCalendarDayAppearance(theme, {
    isToday: true,
  });

  assert.equal(appearance.backgroundColor, theme.color1);
  assert.equal(appearance.textColor, theme.color2);
  assert.equal(appearance.borderColor, theme.color1);
  assert.equal(appearance.borderStyle, "solid");
});

test("regular day cells use a dashed hover border in color1", () => {
  const appearance = getCalendarDayAppearance(theme);

  assert.equal(appearance.hoverBorderColor, theme.color1);
  assert.equal(appearance.hoverBorderStyle, "dashed");
  assert.equal(appearance.hoverBackgroundColor, "transparent");
});

test("other-month day cells keep the same theme color with reduced opacity", () => {
  const appearance = getCalendarDayAppearance(theme, {
    isOtherMonth: true,
  });

  assert.equal(appearance.textColor, "rgba(209, 45, 45, 0.25)");
});
