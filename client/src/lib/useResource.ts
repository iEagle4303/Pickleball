import { shallowRef, ref, onMounted } from "vue";
import { errorMessage } from "./notifications";
export function useResource<T>(loader: () => Promise<T>) {
  const data = shallowRef<T>();
  const loading = ref(true);
  const error = ref("");
  let request = 0;
  async function reload() {
    const current = ++request;
    loading.value = true;
    error.value = "";
    try {
      const result = await loader();
      if (current === request) data.value = result;
    } catch (e) {
      if (current === request) error.value = errorMessage(e);
    } finally {
      if (current === request) loading.value = false;
    }
  }
  onMounted(reload);
  return { data, loading, error, reload };
}
