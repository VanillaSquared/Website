export const EUROPEAN_LOCALE = "en-GB";

export function formatEuropeanDateTime(value, options = { dateStyle: "medium", timeStyle: "short" }, fallback = "Unknown time") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(EUROPEAN_LOCALE, options).format(date);
}

export function formatEuropeanTime(value, fallback = "") {
  return formatEuropeanDateTime(value, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }, fallback);
}
