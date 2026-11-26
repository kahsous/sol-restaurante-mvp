import { describe, expect, it } from "vitest";
import { getRestaurantWeekdayPrefix, productMatchesRestaurantDay } from "@/lib/restaurantDate";

describe("restaurant day menu filtering", () => {
  const cases = [
    ["2026-08-02T15:00:00Z", "domingo"],  // Aug 2, 2026 is Sunday
    ["2026-08-03T15:00:00Z", "segunda"],  // Aug 3, 2026 is Monday
    ["2026-08-04T15:00:00Z", "terça"],    // Aug 4, 2026 is Tuesday
    ["2026-08-05T15:00:00Z", "quarta"],   // Aug 5, 2026 is Wednesday
    ["2026-08-06T15:00:00Z", "quinta"],   // Aug 6, 2026 is Thursday
    ["2026-08-07T15:00:00Z", "sexta"],    // Aug 7, 2026 is Friday
    ["2026-08-08T15:00:00Z", "sábado"],   // Aug 8, 2026 is Saturday
  ] as const;

  it.each(cases)("maps %s to %s in restaurant timezone", (isoDate, weekday) => {
    expect(getRestaurantWeekdayPrefix(new Date(isoDate))).toBe(weekday);
    expect(productMatchesRestaurantDay(`${weekday}-feira | prato especial`, new Date(isoDate))).toBe(true);
  });

  it("keeps the previous local day before midnight in São Paulo", () => {
    // 2026-08-04T02:30:00Z is before São Paulo midnight, so it's still the previous day (segunda)
    expect(getRestaurantWeekdayPrefix(new Date("2026-08-04T02:30:00Z"))).toBe("segunda");
    expect(productMatchesRestaurantDay("segunda-feira | virada", new Date("2026-08-04T02:30:00Z"))).toBe(true);
    expect(productMatchesRestaurantDay("terça-feira | não carregar", new Date("2026-08-04T02:30:00Z"))).toBe(false);
  });
});
