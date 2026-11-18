import { defineStore } from "pinia";
import { ref } from "vue";
import type { Ref } from "vue";
import type { AuthUser, PermissionName } from "@shared/types";
import { authApi } from "../api/authApi";
/** Reactive authentication state and actions exposed by the Pinia setup store. */
export interface AuthStoreSetup {
  /**
   * Current sanitized account, or null when signed out.
   */
  user: Ref<AuthUser | null>;
  /**
   * Whether the initial account lookup completed successfully.
   */
  initialized: Ref<boolean>;
  /**
   * Checks the signed-in account's current permission names.
   *
   * @param permission - Authorization capability to check on the signed-in account.
   * @returns Whether the requested condition holds.
   */
  can(permission: PermissionName): boolean;
  /**
   * Loads the current account once and shares an in-flight lookup between callers.
   *
   * @returns Resolves after the action completes; no result value is returned.
   */
  initialize(): Promise<void>;
  /**
   * Authenticates credentials and stores the sanitized account in Pinia.
   *
   * @param value - Username/email and password submitted to the login API.
   * @returns Resolves after the action completes; no result value is returned.
   */
  login(value: unknown): Promise<void>;
  /**
   * Creates an account and stores the signed-in account returned by the API.
   *
   * @param value - New account identity fields and password submitted to registration.
   * @returns Resolves after the action completes; no result value is returned.
   */
  register(value: unknown): Promise<void>;
  /**
   * Ends the API session and clears the local signed-in account.
   *
   * @returns Resolves after the action completes; no result value is returned.
   */
  logout(): Promise<void>;
}
/** Shared signed-in account state; session credentials remain in HttpOnly cookies. */
export const useAuthStore = defineStore("auth", (): AuthStoreSetup => {
  const user = ref<AuthUser | null>(null);
  const initialized = ref(false);
  let pending: Promise<void> | null = null;
  /**
   * Checks the signed-in account's current permission names.
   *
   * @param permission - Authorization capability to check on the signed-in account.
   * @returns Whether the requested condition holds.
   */
  const can = (permission: PermissionName): boolean =>
    !!user.value?.permissions.includes(permission);
  /**
   * Loads the current account once and shares an in-flight lookup between callers.
   *
   * @returns Resolves after the action completes; no result value is returned.
   */
  async function initialize(): Promise<void> {
    if (initialized.value) return;
    if (!pending)
      pending = authApi
        .me()
        .then((value) => {
          user.value = value;
          initialized.value = true;
        })
        .finally(() => {
          pending = null;
        });
    await pending;
  }
  /**
   * Authenticates credentials and stores the sanitized account in Pinia.
   *
   * @param value - Username/email and password submitted to the login API.
   * @returns Resolves after the action completes; no result value is returned.
   */
  async function login(value: unknown): Promise<void> {
    user.value = await authApi.login(value);
    initialized.value = true;
  }
  /**
   * Creates an account and stores the signed-in account returned by the API.
   *
   * @param value - New account identity fields and password submitted to registration.
   * @returns Resolves after the action completes; no result value is returned.
   */
  async function register(value: unknown): Promise<void> {
    user.value = await authApi.register(value);
    initialized.value = true;
  }
  /**
   * Ends the API session and clears the local signed-in account.
   *
   * @returns Resolves after the action completes; no result value is returned.
   */
  async function logout(): Promise<void> {
    await authApi.logout();
    user.value = null;
  }
  return { user, initialized, can, initialize, login, register, logout };
});
