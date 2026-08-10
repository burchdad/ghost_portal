export const defaultTimezone = "America/Chicago";

export const commonTimezones = [
  "America/Chicago",
  "America/New_York",
  "America/Los_Angeles",
  "America/Denver",
  "America/Phoenix",
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "Australia/Sydney",
  "UTC"
] as const;

const fallbackTimezones = [
  ...commonTimezones,
  "America/Anchorage",
  "America/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Bogota",
  "America/Sao_Paulo",
  "Europe/Dublin",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Hong_Kong",
  "Asia/Seoul",
  "Pacific/Auckland"
];

export function getSupportedTimezones() {
  const supportedValuesOf = Intl.supportedValuesOf as ((key: "timeZone") => string[]) | undefined;
  const timezones = supportedValuesOf ? supportedValuesOf("timeZone") : fallbackTimezones;
  return Array.from(new Set([...commonTimezones, ...timezones])).sort((first, second) => first.localeCompare(second));
}

export function isValidTimezone(timezone: string) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: normalizeTimezone(timezone) });
    return true;
  } catch {
    return false;
  }
}

export function normalizeTimezone(timezone: string) {
  return timezone
    .trim()
    .split("/")
    .map((part) => part.trim().replaceAll(" ", "_"))
    .join("/");
}

export function safeTimezone(timezone: string) {
  const normalized = normalizeTimezone(timezone);
  return isValidTimezone(normalized) ? normalized : defaultTimezone;
}

export function timezoneLabel(timezone: string) {
  return normalizeTimezone(timezone).replaceAll("_", " ");
}
