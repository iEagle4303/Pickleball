import { shallowRef, ref, onMounted } from "vue";
import type { Ref, ShallowRef } from "vue";
import { errorMessage } from "./notifications";

/** Reactive state and reload action shared by API-backed pages. */
export interface ResourceState<T> {
  /** Latest successful response; undefined until the first successful load. */
  data: ShallowRef<T | undefined>;
  /** Whether the most recent request is still pending. */
  loading: Ref<boolean>;
  /** Displayable error for the most recent request, or an empty string. */
  error: Ref<string>;
  /**
   * Reloads the resource; only the latest request may update loading, error, and result state.
   *
   * @returns Resolves after the action completes; no result value is returned.
   */
  reload(): Promise<void>;
}

/**
 * Creates reusable resource state, loads on mount, and ignores stale request completions.
 *
 * @typeParam T - Data type supplied by the loader or API response.
 * @param loader - Asynchronous data loader; errors are captured in the returned resource state.
 * @returns Reactive response/loading/error state and a Promise<void> reload action.
 */
export function useResource<T>(loader: () => Promise<T>): ResourceState<T> {
  const data = shallowRef<T>();
  const loading = ref(true);
  const error = ref("");
  let request = 0;
  /**
   * Reloads the resource; only the latest request may update loading, error, and result state.
   *
   * @returns Resolves after the action completes; no result value is returned.
   */
  async function reload(): Promise<void> {
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
