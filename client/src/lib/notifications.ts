import { ref } from "vue";
/** A dismissible application notification, removed automatically after six seconds. */
export interface Notification {
  /** Monotonically increasing key used to dismiss this notification. */
  id: number;
  /** Human-readable message displayed in the toast. */
  message: string;
  /** Visual treatment and icon used by the notification. */
  kind: "success" | "error";
}
/** Shared toast queue rendered by the application shell. */
export const notifications = ref<Notification[]>([]);
let id = 0;
/**
 * Adds a toast to the shared queue and removes it automatically after six seconds.
 *
 * @param message - Human-readable text displayed to the user.
 * @param kind - Success or error visual treatment for the toast.
 * @returns No result value.
 */
export function notify(
  message: string,
  kind: "success" | "error" = "success",
): void {
  const current = ++id;
  notifications.value.push({ id: current, message, kind });
  window.setTimeout(() => {
    notifications.value = notifications.value.filter(
      (item) => item.id !== current,
    );
  }, 6000);
}
/**
 * Converts an unknown failure to a message suitable for display.
 *
 * @param error - Unknown failure to convert to a displayable message.
 * @returns The exception message, or a fallback when the value is not an Error.
 */
export const errorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
