import { safeLocalStorage } from "./safe-local-storage";

export const TIMEZONE_STORAGE_KEY = "todo-app-timezone";

let _tz: string | undefined;

export function getTimezone(): string {
  if (_tz !== undefined) return _tz;
  if (typeof window === "undefined") return "UTC";
  _tz =
    safeLocalStorage.getItem(TIMEZONE_STORAGE_KEY) ??
    Intl.DateTimeFormat().resolvedOptions().timeZone;
  return _tz;
}

export function setTimezone(tz: string): void {
  _tz = tz;
  safeLocalStorage.setItem(TIMEZONE_STORAGE_KEY, tz);
}

export function readStoredTimezone(): string {
  if (typeof window === "undefined") return "UTC";
  return (
    safeLocalStorage.getItem(TIMEZONE_STORAGE_KEY) ??
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
}

export const COMMON_TIMEZONES = [
  { label: "UTC +0", value: "UTC" },
  { label: "New York −5/−4", value: "America/New_York" },
  { label: "Chicago −6/−5", value: "America/Chicago" },
  { label: "Denver −7/−6", value: "America/Denver" },
  { label: "Los Angeles −8/−7", value: "America/Los_Angeles" },
  { label: "São Paulo −3", value: "America/Sao_Paulo" },
  { label: "London +0/+1", value: "Europe/London" },
  { label: "Casablanca +0/+1", value: "Africa/Casablanca" },
  { label: "Paris / Berlin +1/+2", value: "Europe/Paris" },
  { label: "Helsinki +2/+3", value: "Europe/Helsinki" },
  { label: "Moscow +3", value: "Europe/Moscow" },
  { label: "Dubai +4", value: "Asia/Dubai" },
  { label: "Karachi +5", value: "Asia/Karachi" },
  { label: "India +5:30", value: "Asia/Kolkata" },
  { label: "Dhaka +6", value: "Asia/Dhaka" },
  { label: "Bangkok +7", value: "Asia/Bangkok" },
  { label: "Shanghai / Beijing +8", value: "Asia/Shanghai" },
  { label: "Tokyo +9", value: "Asia/Tokyo" },
  { label: "Sydney +10/+11", value: "Australia/Sydney" },
  { label: "Auckland +12/+13", value: "Pacific/Auckland" },
] as const;
