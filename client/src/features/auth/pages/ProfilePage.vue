<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { LogOut, UserRound, ShieldCheck } from "lucide-vue-next";
import { useAuthStore } from "../stores/authStore";
import { authApi } from "../api/authApi";
import { useResource } from "@/lib/useResource";
import { notify, errorMessage } from "@/lib/notifications";
import AsyncState from "@/components/ui/AsyncState.vue";
import UiButton from "@/components/ui/UiButton.vue";
import PermissionManager from "../components/PermissionManager.vue";
const auth = useAuthStore();
const router = useRouter();
const draft = reactive({ displayName: "", email: "" });
const busy = ref(false);
const savingError = ref("");
const { loading, error, reload } = useResource(async () => {
  await auth.initialize();
  if (!auth.user) {
    await router.replace("/login");
    return null;
  }
  Object.assign(draft, auth.user);
  return auth.user;
});
/**
 * Saves editable profile fields and updates the shared signed-in account.
 *
 * @returns Resolves after the action completes; no result value is returned.
 */
async function save(): Promise<void> {
  busy.value = true;
  savingError.value = "";
  try {
    auth.user = await authApi.profile(draft);
    notify("Your profile is up to date.");
  } catch (e) {
    savingError.value = errorMessage(e);
  } finally {
    busy.value = false;
  }
}
/**
 * Ends the session and returns the member to the clubhouse.
 *
 * @returns Resolves after the action completes; no result value is returned.
 */
async function logout(): Promise<void> {
  busy.value = true;
  try {
    await auth.logout();
    notify("You’re signed out. See you on the court.");
    router.push("/");
  } catch (e) {
    notify(errorMessage(e), "error");
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="mx-auto max-w-3xl">
    <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="eyebrow mb-2">Your corner of the club</p>
        <h1 class="page-title">Your profile</h1>
      </div>
      <UiButton variant="secondary" :busy="busy" @click="logout"
        ><LogOut :size="15" />Sign out</UiButton
      >
    </div>
    <AsyncState :loading="loading" :error="error" @retry="reload"
      ><template v-if="auth.user"
        ><section class="panel p-6">
          <div class="mb-6 flex items-center gap-4 border-b border-line pb-6">
            <span
              class="flex size-14 items-center justify-center rounded-2xl bg-lime text-forest"
              ><UserRound :size="25"
            /></span>
            <div>
              <h2 class="text-lg font-bold">{{ auth.user.displayName }}</h2>
              <p class="mt-1 text-xs text-muted">@{{ auth.user.username }}</p>
            </div>
          </div>
          <form class="space-y-5" @submit.prevent="save">
            <div v-if="savingError" class="error-box" role="alert">
              {{ savingError }}
            </div>
            <label class="field"
              >Display name<input
                v-model="draft.displayName"
                required
                minlength="2"
                maxlength="80"
                autocomplete="name" /></label
            ><label class="field"
              >Email address<input
                v-model="draft.email"
                type="email"
                required
                maxlength="254"
                autocomplete="email" /></label
            ><UiButton :busy="busy" type="submit">Save profile</UiButton>
          </form>
        </section>
        <section class="panel mt-6 p-6">
          <h2 class="flex items-center gap-2 text-base font-bold">
            <ShieldCheck :size="19" />Your club access
          </h2>
          <p
            v-if="!auth.user.permissions.length"
            class="mt-3 text-sm text-muted"
          >
            Club member · Create a team, find a partner, and follow every
            league.
          </p>
          <div v-else class="mt-4 flex flex-wrap gap-2">
            <span
              v-for="permission in auth.user.permissions"
              :key="permission"
              class="badge badge-completed !text-[10px]"
              >{{ permission.toLowerCase().replaceAll("_", " ") }}</span
            >
          </div>
        </section>
        <PermissionManager v-if="auth.can('MANAGE_PERMISSIONS')" /></template
    ></AsyncState>
  </div>
</template>
