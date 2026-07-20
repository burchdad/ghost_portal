export function todayInTimezone(timezone: string) {
  return formatDatePartsInTimezone(new Date(), timezone);
}

export function dateInTimezone(date: Date | string | null | undefined, timezone: string) {
  if (!date) return "";
  return formatDatePartsInTimezone(new Date(date), timezone);
}

export function timeInTimezone(date: Date | string | null | undefined, timezone: string) {
  if (!date) return "";
  const parts = getParts(new Date(date), timezone);
  return `${parts.hour}:${parts.minute}`;
}

export function zonedDateTimeToUtcIso(dateValue: string, timeValue: string, timezone: string) {
  if (!dateValue || !timeValue) return "";
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) return "";

  const wantedUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let utc = wantedUtc;

  for (let index = 0; index < 3; index += 1) {
    const parts = getParts(new Date(utc), timezone);
    const zonedAsUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), 0, 0);
    utc -= zonedAsUtc - wantedUtc;
  }

  return new Date(utc).toISOString();
}

function formatDatePartsInTimezone(date: Date, timezone: string) {
  const parts = getParts(date, timezone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function getParts(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimezone(timezone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const entries = formatter.formatToParts(date).reduce<Record<string, string>>((accumulator, part) => {
    if (part.type !== "literal") accumulator[part.type] = part.value;
    return accumulator;
  }, {});

  return {
    year: entries.year,
    month: entries.month,
    day: entries.day,
    hour: entries.hour === "24" ? "00" : entries.hour,
    minute: entries.minute
  };
}

function safeTimezone(timezone: string) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return timezone;
  } catch {
    return "UTC";
  }
}
