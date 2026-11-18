import { defineStore } from "pinia";
import { ref } from "vue";
import type { AuthUser, PermissionName } from "@shared/types";
import { authApi } from "../api/authApi";
export const useAuthStore = defineStore("auth", () => {
  const user = ref<AuthUser | null>(null);
  const initialized = ref(false);
  let pending: Promise<void> | null = null;
  const can = (permission: PermissionName) =>
    !!user.value?.permissions.includes(permission);
  async function initialize() {
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
  async function login(value: unknown) {
    user.value = await authApi.login(value);
    initialized.value = true;
  }
  async function register(value: unknown) {
    user.value = await authApi.register(value);
    initialized.value = true;
  }
  async function logout() {
    await authApi.logout();
    user.value = null;
  }
  return { user, initialized, can, initialize, login, register, logout };
});
