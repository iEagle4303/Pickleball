import { ref } from "vue";
export const notifications = ref<
  { id: number; message: string; kind: "success" | "error" }[]
>([]);
let id = 0;
export function notify(message: string, kind: "success" | "error" = "success") {
  const current = ++id;
  notifications.value.push({ id: current, message, kind });
  window.setTimeout(() => {
    notifications.value = notifications.value.filter(
      (item) => item.id !== current,
    );
  }, 6000);
}
export const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
