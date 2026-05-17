export const formatDeadlineLabel = (daysUntilDeadline: number | undefined) => {
  if (daysUntilDeadline == null || daysUntilDeadline < 0) {
    return "J-?";
  }

  return `J-${daysUntilDeadline}`;
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
