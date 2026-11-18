<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { Plus, Search, SlidersHorizontal } from "lucide-vue-next";
import { tournamentApi } from "../api/tournamentApi";
import { useResource } from "@/lib/useResource";
import { useAuthStore } from "@/features/auth/stores/authStore";
import AsyncState from "@/components/ui/AsyncState.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import TournamentCard from "../components/TournamentCard.vue";
import TournamentEditor from "../components/TournamentEditor.vue";
const { data, loading, error, reload } = useResource(tournamentApi.list);
const auth = useAuthStore();
const query = ref(String(useRoute().query.q || ""));
const status = ref("");
const semester = ref("");
const editor = ref(false);
const semesters = computed(() => [
  ...new Set(data.value?.map((row) => row.semester) || []),
]);
const filtered = computed(() =>
  (data.value || []).filter(
    (row) =>
      (!status.value || row.status === status.value) &&
      (!semester.value || row.semester === semester.value) &&
      row.name.toLowerCase().includes(query.value.toLowerCase()),
  ),
);
</script>
<template>
  <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="eyebrow mb-2">Find your next challenge</p>
      <h1 class="page-title">Tournaments</h1>
      <p class="page-subtitle">
        A new semester. A fresh ladder. Your next chance to climb.
      </p>
    </div>
    <button
      v-if="auth.can('CREATE_TOURNAMENT')"
      class="btn btn-primary"
      @click="editor = true"
    >
      <Plus :size="17" />Create tournament
    </button>
  </div>
  <div class="panel mb-6 flex flex-wrap items-center gap-3 p-4">
    <label class="relative min-w-44 flex-1"
      ><span class="sr-only">Search tournaments</span
      ><Search class="absolute left-3 top-3 text-muted" :size="16" /><input
        v-model="query"
        class="!pl-10"
        placeholder="Find a tournament…" /></label
    ><label class="min-w-40"
      ><span class="sr-only">Filter by semester</span
      ><select v-model="semester">
        <option value="">All semesters</option>
        <option v-for="item in semesters" :key="item">{{ item }}</option>
      </select></label
    ><label class="min-w-40"
      ><span class="sr-only">Filter by status</span
      ><select v-model="status">
        <option value="">All statuses</option>
        <option value="active">In progress</option>
        <option value="upcoming">Coming soon</option>
        <option value="completed">Completed</option>
      </select></label
    >
  </div>
  <AsyncState :loading="loading" :error="error" @retry="reload"
    ><div class="mb-4 text-xs text-muted">
      {{ filtered.length }} tournament{{ filtered.length !== 1 ? "s" : "" }}
    </div>
    <div
      v-if="filtered.length"
      class="grid gap-5 md:grid-cols-2 2xl:grid-cols-3"
    >
      <TournamentCard
        v-for="item in filtered"
        :key="item.tournamentID"
        :tournament="item"
      />
    </div>
    <EmptyState
      v-else
      title="No tournaments found"
      description="Try another semester, status, or search."
      ><button
        class="btn btn-secondary"
        @click="
          query = '';
          status = '';
          semester = '';
        "
      >
        Clear filters
      </button></EmptyState
    ></AsyncState
  ><TournamentEditor
    :open="editor"
    :tournaments="data || []"
    @close="editor = false"
    @saved="reload"
  />
</template>
