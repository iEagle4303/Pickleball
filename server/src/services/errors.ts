/**
 * An expected application failure with an HTTP status safe to report to the client.
 */
export class HttpError extends Error {
  /**
   * Creates the HttpError with its required dependencies.
   *
   * @param status - HTTP status to report if the operation fails.
   * @param message - Human-readable error message safe to display to the user.
   */
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
/**
 * Narrows a required condition or throws an application error with the supplied status and message.
 *
 * @param condition - Condition that must hold for execution to continue.
 * @param status - HTTP status to report if the operation fails.
 * @param message - Human-readable error message safe to display to the user.
 * @returns Returns normally only after the condition has been established.
 */
export function ensure(
  condition: unknown,
  status: number,
  message: string,
): asserts condition {
  if (!condition) throw new HttpError(status, message);
}
