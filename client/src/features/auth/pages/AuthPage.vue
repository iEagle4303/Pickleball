<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Swords, ArrowRight, Eye, EyeOff } from "lucide-vue-next";
import { useAuthStore } from "../stores/authStore";
import { notify, errorMessage } from "@/lib/notifications";
import UiButton from "@/components/ui/UiButton.vue";
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const register = computed(() => route.path === "/register");
const draft = reactive({
  username: "",
  displayName: "",
  email: "",
  password: "",
});
const busy = ref(false);
const error = ref("");
const visible = ref(false);
const development = import.meta.env.DEV;
async function submit() {
  busy.value = true;
  error.value = "";
  try {
    if (register.value) await auth.register(draft);
    else
      await auth.login({ username: draft.username, password: draft.password });
    notify(
      register.value
        ? "Welcome to the club. Let’s find your team!"
        : "Welcome back to the clubhouse.",
    );
    router.push("/");
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div
    class="mx-auto my-5 grid max-w-4xl overflow-hidden rounded-3xl border border-line bg-surface md:my-10 md:grid-cols-2"
  >
    <div
      class="relative flex flex-col justify-between overflow-hidden bg-[#183f38] p-9 text-white"
    >
      <Swords class="mb-10 text-lime" :size="40" :stroke-width="1.4" />
      <div>
        <p
          class="mb-4 text-[10px] font-semibold uppercase tracking-[.2em] text-lime"
        >
          UW–Stout Pickleball Club
        </p>
        <h1 class="text-4xl font-semibold leading-tight tracking-tight">
          Your people.<br />Your paddle.<br />Your next chapter<span
            class="text-lime"
            >.</span
          >
        </h1>
        <p class="mt-5 text-sm leading-relaxed text-[#bdcfc7]">
          Whether it’s your first serve or your hundredth win, there’s a place
          for you here.
        </p>
      </div>
      <p class="mt-12 text-xs text-white/50">
        All skill levels. One great club.
      </p>
    </div>
    <div class="p-7 sm:p-9">
      <h2 class="text-2xl font-bold">
        {{ register ? "Make yourself at home." : "Good to see you again." }}
      </h2>
      <p class="mb-7 mt-2 text-sm text-muted">
        {{
          register
            ? "Create your account and find your place on the court."
            : "Sign in and pick up where you left off."
        }}
      </p>
      <form class="space-y-4" @submit.prevent="submit">
        <div v-if="error" class="error-box" role="alert">{{ error }}</div>
        <label v-if="register" class="field"
          >Display name<input
            v-model="draft.displayName"
            autocomplete="name"
            required
            minlength="2"
            maxlength="80"
            placeholder="Your name" /></label
        ><label class="field"
          >{{ register ? "Username" : "Username or email"
          }}<input
            v-model="draft.username"
            autocomplete="username"
            required
            :minlength="register ? 3 : 1"
            :maxlength="register ? 30 : 254"
            :pattern="register ? '[a-zA-Z0-9_]+' : undefined"
            :placeholder="
              register ? 'e.g. jamie_chen' : 'Your username or email'
            " /></label
        ><label v-if="register" class="field"
          >Email<input
            v-model="draft.email"
            type="email"
            autocomplete="email"
            required
            maxlength="254"
            placeholder="you@example.edu" /></label
        ><label class="field"
          >Password<span class="relative block"
            ><input
              v-model="draft.password"
              :type="visible ? 'text' : 'password'"
              :autocomplete="register ? 'new-password' : 'current-password'"
              required
              :minlength="register ? 12 : 1"
              maxlength="128"
              class="!pr-12"
              :placeholder="
                register ? 'At least 12 characters' : 'Your password'
              " /><button
              class="absolute right-2 top-1.5 flex size-8 items-center justify-center text-muted"
              type="button"
              :aria-label="visible ? 'Hide password' : 'Show password'"
              @click="visible = !visible"
            >
              <EyeOff v-if="visible" :size="17" /><Eye
                v-else
                :size="17"
              /></button></span></label
        ><UiButton type="submit" :busy="busy" class="mt-2 w-full"
          >{{ register ? "Join the club" : "Sign in" }}<ArrowRight :size="16"
        /></UiButton>
      </form>
      <p class="mt-6 text-center text-xs text-muted">
        {{ register ? "Already part of the club?" : "New around here?" }}
        <RouterLink
          :to="register ? '/login' : '/register'"
          class="font-semibold text-ink underline underline-offset-4"
          >{{ register ? "Sign in" : "Create an account" }}</RouterLink
        >
      </p>
      <div
        v-if="development && !register"
        class="mt-7 rounded-xl bg-canvas p-4 text-xs text-muted"
      >
        <p class="mb-2 font-semibold text-ink">Try the development accounts</p>
        <p><strong>admin</strong> · Club administration</p>
        <p class="mt-1"><strong>scorer</strong> · Record and edit results</p>
        <p class="mt-1"><strong>jamie_chen</strong> · Club member</p>
        <p class="mt-2">
          Password: <code class="font-mono text-ink">Clubhouse2026!</code>
        </p>
      </div>
    </div>
  </div>
</template>
