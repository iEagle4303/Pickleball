/**
 * Allocates the next numeric ID for the JSON adapter; SQL stores should use generated database identities.
 *
 * @typeParam T - Result type returned by the supplied operation.
 * @param rows - Existing records in the JSON table.
 * @param key - Property holding each record's numeric primary key.
 * @returns One greater than the table's maximum existing numeric ID, or 1 for an empty table.
 */
export function nextID<T>(rows: readonly T[], key: keyof T): number {
  return (
    rows.reduce((largest, row) => Math.max(largest, Number(row[key])), 0) + 1
  );
}
