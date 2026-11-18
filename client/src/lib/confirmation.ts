import { ref } from "vue";
export const confirmation = ref<{
  title: string;
  message: string;
  resolve: (value: boolean) => void;
} | null>(null);
export function confirmAction(title: string, message: string) {
  return new Promise<boolean>((resolve) => {
    confirmation.value = { title, message, resolve };
  });
}
export function resolveConfirmation(value: boolean) {
  confirmation.value?.resolve(value);
  confirmation.value = null;
}
