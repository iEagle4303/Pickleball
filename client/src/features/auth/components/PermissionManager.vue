<script setup lang="ts">
import { ref, watch } from "vue";
import type { AuthUser } from "@shared/types";
import { authApi } from "../api/authApi";
import { useAuthStore } from "../stores/authStore";
import { useResource } from "@/lib/useResource";
import { notify, errorMessage } from "@/lib/notifications";
import AsyncState from "@/components/ui/AsyncState.vue";
import UiButton from "@/components/ui/UiButton.vue";
const auth = useAuthStore();
const selected = ref(0);
const selectedIDs = ref<number[]>([]);
const busy = ref(false);
const errorSave = ref("");
const { data, loading, error, reload } = useResource(async () => {
  const [users, permissions] = await Promise.all([
    authApi.users(),
    authApi.permissions(),
  ]);
  return { users, permissions };
});
function sync() {
  const user = data.value?.users.find((user) => user.userID === selected.value);
  selectedIDs.value =
    data.value?.permissions
      .filter((permission) =>
        user?.permissions.includes(permission.description),
      )
      .map((permission) => permission.permissionID) || [];
  errorSave.value = "";
}
watch(selected, sync);
async function save() {
  busy.value = true;
  errorSave.value = "";
  try {
    const user = await authApi.setPermissions(
      selected.value,
      selectedIDs.value,
    );
    if (auth.user?.userID === user.userID) auth.user = user;
    const current = data.value?.users.findIndex(
      (row) => row.userID === user.userID,
    );
    if (current !== undefined && current >= 0 && data.value)
      data.value.users[current] = user;
    notify("Member permissions updated.");
  } catch (e) {
    errorSave.value = errorMessage(e);
  } finally {
    busy.value = false;
  }
}
const label = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (value) => value.toUpperCase());
</script>
<template>
  <section class="panel mt-6 p-6">
    <h2 class="text-lg font-bold">Club permissions</h2>
    <p class="mb-5 mt-1 text-sm text-muted">
      Give club coordinators the access they need.
    </p>
    <AsyncState :loading="loading" :error="error" @retry="reload"
      ><label class="field mb-5"
        >Club member<select v-model="selected">
          <option :value="0" disabled>Select a member</option>
          <option
            v-for="user in data?.users"
            :key="user.userID"
            :value="user.userID"
          >
            {{ user.displayName }} (@{{ user.username }})
          </option>
        </select></label
      >
      <form v-if="selected" @submit.prevent="save">
        <div v-if="errorSave" class="error-box mb-4" role="alert">
          {{ errorSave }}
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <label
            v-for="permission in data?.permissions"
            :key="permission.permissionID"
            class="flex items-center gap-3 rounded-xl border border-line p-3 text-xs"
            ><input
              v-model="selectedIDs"
              type="checkbox"
              :value="permission.permissionID"
            />{{ label(permission.description) }}</label
          >
        </div>
        <UiButton :busy="busy" type="submit" class="mt-5"
          >Save permissions</UiButton
        >
      </form></AsyncState
    >
  </section>
</template>
