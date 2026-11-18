export const formatDate = (
  value: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
) =>
  new Intl.DateTimeFormat("en-US", options).format(
    new Date(value.length === 10 ? value + "T12:00:00" : value),
  );
export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
