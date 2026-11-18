/** JSON-only ID allocation. SQL adapters should use database-generated identities. */
export function nextID<T>(rows: readonly T[], key: keyof T): number {
  return (
    rows.reduce((largest, row) => Math.max(largest, Number(row[key])), 0) + 1
  );
}
