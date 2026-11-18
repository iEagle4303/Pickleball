<script setup lang="ts">
import { ref, computed } from "vue";
import { getHistory } from "../api/historyApi";
import { useResource } from "@/lib/useResource";
import AsyncState from "@/components/ui/AsyncState.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import TournamentCard from "@/features/tournaments/components/TournamentCard.vue";
const { data, loading, error, reload } = useResource(getHistory);
const semester = ref("");
const semesters = computed(() => [
  ...new Set(data.value?.map((row) => row.semester) || []),
]);
const filtered = computed(() =>
  (data.value || []).filter(
    (row) => !semester.value || row.semester === semester.value,
  ),
);
</script>
<template>
  <div class="mb-8 flex flex-wrap items-end justify-between gap-5">
    <div>
      <p class="eyebrow mb-2">Good games live on</p>
      <h1 class="page-title">The club archives.</h1>
      <p class="page-subtitle">
        Past semesters. Final standings. The rallies that got us here.
      </p>
    </div>
    <label class="w-full max-w-xs"
      ><span class="sr-only">Filter past semesters</span
      ><select v-model="semester">
        <option value="">All past semesters</option>
        <option v-for="item in semesters" :key="item">{{ item }}</option>
      </select></label
    >
  </div>
  <AsyncState :loading="loading" :error="error" @retry="reload"
    ><div
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
      title="History is in the making"
      description="Completed tournaments will appear here with their standings, teams, and results."
  /></AsyncState>
</template>
