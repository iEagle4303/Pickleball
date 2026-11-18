<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRoute, RouterLink, RouterView } from "vue-router";
import {
  LayoutDashboard,
  Trophy,
  ChartNoAxesColumnIncreasing,
  Users,
  History,
  Swords,
  ArrowUpRight,
  Menu,
  X,
  Moon,
  Sun,
  ChevronRight,
  LogIn,
  UserRound,
  CheckCircle2,
  AlertCircle,
} from "lucide-vue-next";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { notifications, notify, errorMessage } from "@/lib/notifications";
import { confirmation, resolveConfirmation } from "@/lib/confirmation";
import UiDialog from "@/components/ui/UiDialog.vue";
import UiButton from "@/components/ui/UiButton.vue";
const route = useRoute();
const auth = useAuthStore();
const menu = ref(false);
const desktop = ref(matchMedia("(min-width: 1024px)").matches);
const sidebar = ref<HTMLElement>();
const menuButton = ref<HTMLButtonElement>();
const viewport = matchMedia("(min-width: 1024px)");
const updateViewport = () => {
  desktop.value = viewport.matches;
  if (desktop.value) menu.value = false;
};
watch(menu, async (value) => {
  if (desktop.value) return;
  await nextTick();
  if (value) sidebar.value?.querySelector<HTMLAnchorElement>("nav a")?.focus();
  else menuButton.value?.focus();
});
const dark = ref(
  localStorage.getItem("stout-theme") === "dark" ||
    (!localStorage.getItem("stout-theme") &&
      matchMedia("(prefers-color-scheme: dark)").matches),
);
const navigation = [
  { to: "/", label: "Clubhouse", icon: LayoutDashboard },
  { to: "/tournaments", label: "Tournaments", icon: Trophy },
  { to: "/rankings", label: "Rankings", icon: ChartNoAxesColumnIncreasing },
  { to: "/teams", label: "Teams", icon: Users },
  { to: "/games", label: "Game results", icon: History },
  { to: "/matchups", label: "Matchups", icon: Swords },
];
watch(
  dark,
  (value) => {
    document.documentElement.classList.toggle("dark", value);
    localStorage.setItem("stout-theme", value ? "dark" : "light");
  },
  { immediate: true },
);
watch(
  () => route.fullPath,
  () => {
    menu.value = false;
  },
);
const escape = (event: KeyboardEvent) => {
  if (event.key === "Escape") menu.value = false;
};
onMounted(() => {
  auth.initialize().catch((error) => notify(errorMessage(error), "error"));
  window.addEventListener("keydown", escape);
  viewport.addEventListener("change", updateViewport);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", escape);
  viewport.removeEventListener("change", updateViewport);
});
</script>
<template>
  <a
    href="#main"
    class="sr-only z-50 rounded bg-lime p-3 text-forest focus:not-sr-only focus:fixed"
    >Skip to content</a
  >
  <div
    v-if="menu"
    class="fixed inset-0 z-30 bg-black/40 lg:hidden"
    @click="menu = false"
  ></div>
  <aside
    ref="sidebar"
    :inert="!menu && !desktop"
    :class="[
      'fixed inset-y-0 left-0 z-40 flex w-60 flex-col overflow-y-auto border-r border-line bg-surface px-5 py-7 transition-transform lg:translate-x-0',
      menu ? 'translate-x-0' : '-translate-x-full',
    ]"
    aria-label="Club navigation"
  >
    <RouterLink
      to="/"
      class="mb-10 flex items-center gap-3 px-1"
      aria-label="Stout Pickleball home"
      ><span
        class="flex size-11 items-center justify-center rounded-2xl bg-forest text-lime"
        ><Swords :size="24" /></span
      ><span class="leading-tight"
        ><strong class="block text-lg tracking-tight"
          >stout<span class="text-muted">.</span></strong
        ><span
          class="text-[10px] font-semibold uppercase tracking-[.18em] text-muted"
          >Pickleball Club</span
        ></span
      ></RouterLink
    >
    <button
      v-if="!desktop"
      class="icon-btn absolute right-1 top-1"
      aria-label="Close navigation"
      @click="menu = false"
    >
      <X :size="17" />
    </button>
    <p class="eyebrow mb-3 px-3">Your club, connected</p>
    <nav class="space-y-1">
      <RouterLink
        v-for="item in navigation"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition',
          route.path === item.to ||
          (item.to !== '/' && route.path.startsWith(item.to + '/'))
            ? 'bg-forest text-white dark:bg-lime dark:text-forest'
            : 'text-muted hover:bg-canvas hover:text-ink',
        ]"
        ><component :is="item.icon" :size="18" :stroke-width="1.8" />{{
          item.label
        }}</RouterLink
      >
    </nav>
    <div class="my-5 border-t border-line"></div>
    <RouterLink
      to="/history"
      :class="[
        'flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium',
        route.path === '/history'
          ? 'bg-forest text-white dark:bg-lime dark:text-forest'
          : 'text-muted hover:bg-canvas',
      ]"
      ><History :size="18" /> Tournament history</RouterLink
    >
    <div class="mt-auto pt-8">
      <div class="rounded-2xl bg-canvas p-4">
        <span
          class="mb-3 inline-flex size-8 items-center justify-center rounded-lg bg-lime text-forest"
          ><Users :size="17"
        /></span>
        <p class="text-sm font-semibold">Better together.</p>
        <p class="mt-1 text-xs leading-relaxed text-muted">
          Find a partner. Meet your people. Make the next game yours.
        </p>
        <RouterLink
          :to="auth.user ? '/teams' : '/register'"
          class="mt-4 flex items-center justify-between text-xs font-bold"
          >{{ auth.user ? "Explore teams" : "Join the club"
          }}<ArrowUpRight :size="16"
        /></RouterLink>
      </div>
      <p class="mt-5 text-center text-[10px] text-muted">
        UNIVERSITY OF WISCONSIN–STOUT
      </p>
    </div>
  </aside>
  <div :inert="menu && !desktop" class="min-h-screen lg:pl-60">
    <header
      class="flex h-20 items-center justify-between gap-3 border-b border-line bg-surface px-5 sm:px-9"
    >
      <div class="flex items-center gap-3">
        <button
          ref="menuButton"
          class="icon-btn lg:hidden"
          aria-label="Open navigation"
          :aria-expanded="menu"
          @click="menu = !menu"
        >
          <Menu :size="21" /></button
        ><span class="hidden text-xs text-muted sm:inline"
          >Stout Pickleball</span
        ><ChevronRight class="hidden text-muted sm:block" :size="13" /><span
          class="text-sm font-semibold"
          >{{ route.meta.title }}</span
        >
      </div>
      <div class="flex items-center gap-3">
        <span
          class="hidden items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[11px] text-muted md:inline-flex"
          ><span class="size-1.5 rounded-full bg-emerald-500"></span> The club
          is in session</span
        ><button
          class="icon-btn"
          :aria-label="dark ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="dark = !dark"
        >
          <Sun v-if="dark" :size="18" /><Moon v-else :size="18" /></button
        ><RouterLink
          v-if="auth.user"
          to="/profile"
          class="flex items-center gap-2 border-l border-line pl-4 text-sm font-semibold"
          ><span
            class="flex size-9 items-center justify-center rounded-full bg-lime text-forest"
            ><UserRound :size="17" /></span
          ><span class="hidden sm:block">{{
            auth.user.displayName.split(" ")[0]
          }}</span></RouterLink
        ><RouterLink v-else to="/login" class="btn btn-secondary !px-3 !py-2"
          ><LogIn :size="15" /><span>Sign in</span></RouterLink
        >
      </div>
    </header>
    <main id="main" class="mx-auto max-w-[1600px] p-5 sm:p-9">
      <RouterView :key="route.path" />
    </main>
    <footer
      class="mx-5 flex flex-wrap items-center justify-between gap-3 border-t border-line py-6 text-[11px] text-muted sm:mx-9"
    >
      <span>© 2026 Stout Pickleball Club</span
      ><span>More rallies. More community.</span>
    </footer>
  </div>
  <div
    class="fixed bottom-5 right-5 z-50 flex max-w-sm flex-col gap-2"
    aria-live="polite"
    aria-atomic="true"
  >
    <div
      v-for="item in notifications"
      :key="item.id"
      class="flex items-start gap-3 rounded-xl border border-line bg-surface p-4 text-sm shadow-xl"
    >
      <CheckCircle2
        v-if="item.kind === 'success'"
        class="shrink-0 text-emerald-600"
        :size="19"
      /><AlertCircle v-else class="shrink-0 text-rose-500" :size="19" /><span>{{
        item.message
      }}</span
      ><button
        class="text-muted"
        aria-label="Dismiss notification"
        @click="
          notifications = notifications.filter((row) => row.id !== item.id)
        "
      >
        <X :size="15" />
      </button>
    </div>
  </div>
  <UiDialog
    :open="!!confirmation"
    :title="confirmation?.title || 'Confirm action'"
    @close="resolveConfirmation(false)"
    ><p class="text-sm leading-relaxed text-muted">
      {{ confirmation?.message }}
    </p>
    <div class="mt-6 flex justify-end gap-3">
      <UiButton variant="secondary" @click="resolveConfirmation(false)"
        >Cancel</UiButton
      ><UiButton variant="danger" @click="resolveConfirmation(true)"
        >Confirm</UiButton
      >
    </div></UiDialog
  >
</template>
