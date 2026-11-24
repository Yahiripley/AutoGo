export function formatCurrency(cents, { currency = "MXN", lang = "es" } = {}) {
  const amount = Number(cents || 0) / 100;
  const locale = lang === "en" ? "en-US" : "es-MX";
  const hasFraction = Math.abs(Math.round(Number(cents || 0)) % 100) > 0;
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${currency}`;
}

export function centsToCurrencyInput(cents) {
  if (!Number.isFinite(Number(cents))) return "";
  return String(Number(cents) / 100);
}

export function currencyInputToCents(amount) {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed * 100);
}

export function calculateRentalDays(start, end) {
  if (!start || !end || end <= start) return 0;
  const diffMs = new Date(end) - new Date(start);
  if (!Number.isFinite(diffMs) || diffMs <= 0) return 0;
  return Math.max(1, Math.ceil(diffMs / 86400000));
}

export function formatDateTime(value, lang = "es") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const locale = lang === "en" ? "en-US" : "es-MX";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function toDateTimeLocalInput(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getPresetDates(days = 2, baseDate = new Date()) {
  const start = new Date(baseDate.getTime());
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);

  const end = new Date(start.getTime());
  end.setDate(end.getDate() + Math.max(1, days));
  return {
    start: toDateTimeLocalInput(start),
    end: toDateTimeLocalInput(end),
  };
}
