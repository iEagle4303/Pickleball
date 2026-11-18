/**
 * Formats an ISO date or timestamp for display; date-only values are anchored at local noon.
 *
 * @param value - ISO date or timestamp to format for display or a local datetime input.
 * @param options - Intl.DateTimeFormat options controlling the display format.
 * @returns The localized display date.
 */
export const formatDate = (
  value: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
): string =>
  new Intl.DateTimeFormat("en-US", options).format(
    new Date(value.length === 10 ? value + "T12:00:00" : value),
  );
/**
 * Builds up to two uppercase initials for a team or member avatar.
 *
 * @param name - Name from which avatar initials are derived.
 * @returns At most two uppercase initials.
 */
export const initials = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
