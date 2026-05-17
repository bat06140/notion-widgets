import test from "node:test";
import assert from "node:assert/strict";
import {
  formatClockMonthLabel,
  getCalendarMonthLabels,
  getCalendarWeekdayLabels,
  getLocaleFromLanguage,
  getTranslationSet,
} from "../src/lib/locale.js";

test("getLocaleFromLanguage uses French only when the browser language starts with fr", () => {
  assert.equal(getLocaleFromLanguage("fr-FR"), "fr");
  assert.equal(getLocaleFromLanguage("fr-CA"), "fr");
  assert.equal(getLocaleFromLanguage("en-US"), "en");
  assert.equal(getLocaleFromLanguage("de-DE"), "en");
  assert.equal(getLocaleFromLanguage(undefined), "en");
});

test("calendar weekday labels stay Monday-first and match the active locale", () => {
  assert.deepEqual(getCalendarWeekdayLabels("fr"), [
    "LUN",
    "MAR",
    "MER",
    "JEU",
    "VEN",
    "SAM",
    "DIM",
  ]);
  assert.deepEqual(getCalendarWeekdayLabels("en"), [
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
    "SAT",
    "SUN",
  ]);
});

test("calendar month labels are localized", () => {
  const frenchMonths = getCalendarMonthLabels("fr");
  const englishMonths = getCalendarMonthLabels("en");

  assert.equal(frenchMonths[0], "janvier");
  assert.equal(frenchMonths[7], "août");
  assert.equal(englishMonths[0], "january");
  assert.equal(englishMonths[7], "august");
});

test("clock month labels use localized short month names without trailing punctuation", () => {
  const sampleDate = new Date(2026, 3, 22);

  assert.equal(formatClockMonthLabel(sampleDate, "fr"), "AVR");
  assert.equal(formatClockMonthLabel(sampleDate, "en"), "APR");
});

test("translation set localizes visible copy and keeps the J- widget label in both locales", () => {
  const french = getTranslationSet("fr");
  const english = getTranslationSet("en");

  assert.equal(french.widgetOptions.calendar, "Calendrier");
  assert.equal(french.widgetOptions.deadline, "J-");
  assert.equal(french.widgetOptions.clock, "Horloge");
  assert.equal(english.widgetOptions.calendar, "Calendar");
  assert.equal(english.widgetOptions.deadline, "J-");
  assert.equal(english.widgetOptions.clock, "Clock");
  assert.equal(french.themeEditor.title, "Choisir une couleur");
  assert.equal(english.themeEditor.title, "Choose a color");
});
