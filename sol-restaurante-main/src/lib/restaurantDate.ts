export const RESTAURANT_TIME_ZONE = "America/Sao_Paulo";

export const WEEKDAY_PREFIXES = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
] as const;

export type RestaurantWeekday = (typeof WEEKDAY_PREFIXES)[number];

export const getRestaurantWeekdayIndex = (
  date: Date = new Date(),
  timeZone: string = RESTAURANT_TIME_ZONE,
): number => {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone }).format(date);
  const indexes: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return indexes[weekday] ?? 0;
};

export const getRestaurantWeekdayPrefix = (
  date: Date = new Date(),
  timeZone: string = RESTAURANT_TIME_ZONE,
): RestaurantWeekday => WEEKDAY_PREFIXES[getRestaurantWeekdayIndex(date, timeZone)];

export const getRestaurantLocalMinutes = (
  date: Date = new Date(),
  timeZone: string = RESTAURANT_TIME_ZONE,
): number => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
};

export const getRestaurantLocalDate = (
  date: Date = new Date(),
  timeZone: string = RESTAURANT_TIME_ZONE,
): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

export const productMatchesRestaurantDay = (
  description: string | null | undefined,
  date: Date = new Date(),
  timeZone: string = RESTAURANT_TIME_ZONE,
): boolean => {
  const prefix = getRestaurantWeekdayPrefix(date, timeZone);
  return (description || "").trim().toLowerCase().startsWith(prefix);
};
