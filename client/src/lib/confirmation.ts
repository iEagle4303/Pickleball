import { ref } from "vue";
/** One pending confirmation shown by the application shell. */
export interface PendingConfirmation {
  /** Heading identifying the operation requiring confirmation. */
  title: string;
  /** Consequences shown before the user accepts or cancels. */
  message: string;
  /**
   * Settles the pending confirmation with the user's choice.
   *
   * @param value - Payload or value to serialize, format, or submit.
   * @returns No result value.
   */
  resolve(value: boolean): void;
}
/** Current confirmation, or null while no confirmation is pending. */
export const confirmation = ref<PendingConfirmation | null>(null);
/**
 * Opens the shared confirmation dialog and waits for the user's decision.
 *
 * @param title - Heading displayed in the confirmation dialog.
 * @param message - Human-readable text displayed to the user.
 * @returns True when the user confirms; false when cancelled or dismissed.
 */
export function confirmAction(
  title: string,
  message: string,
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    confirmation.value = { title, message, resolve };
  });
}
/**
 * Settles the pending confirmation and clears its dialog state.
 *
 * @param value - The user's confirmation decision.
 * @returns No result value.
 */
export function resolveConfirmation(value: boolean): void {
  confirmation.value?.resolve(value);
  confirmation.value = null;
}
