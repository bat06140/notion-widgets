import type { AppLocale } from "./locale.js";

const getDeadlinePrefix = (locale: AppLocale) =>
  locale === "fr" ? "J-" : "D-";

export const formatDeadlineLabel = (
  daysUntilDeadline: number | undefined,
  locale: AppLocale = "fr"
) => {
  const prefix = getDeadlinePrefix(locale);

  if (daysUntilDeadline == null || daysUntilDeadline < 0) {
    return `${prefix}?`;
  }

  return `${prefix}${daysUntilDeadline}`;
};

export const getDeadlineFontScale = (label: string) => {
  if (label.length >= 6) {
    return 0.8;
  }

  if (label.length >= 5) {
    return 0.86;
  }

  return 0.94;
};
