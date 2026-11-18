<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import { rankingApi } from "../api/rankingApi";
import { useResource } from "@/lib/useResource";
import AsyncState from "@/components/ui/AsyncState.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import RankingsPanel from "../components/RankingsPanel.vue";
const selected = ref(Number(useRoute().query.tournament) || 0);
const { data, loading, error, reload } = useResource(async () => {
  const result = await rankingApi.tournaments();
  if (!result.some((row) => row.tournamentID === selected.value))
    selected.value =
      result.find((row) => row.status === "active")?.tournamentID ||
      result[0]?.tournamentID ||
      0;
  return result;
});
</script>
<template>
  <div class="mb-8">
    <p class="eyebrow mb-2">One rally at a time</p>
    <h1 class="page-title">The ladder</h1>
    <p class="page-subtitle">
      Find your place. Set your sights. Keep climbing.
    </p>
  </div>
  <AsyncState :loading="loading" :error="error" @retry="reload"
    ><div
      class="panel mb-6 flex flex-wrap items-center justify-between gap-4 p-5"
    >
      <div>
        <h2 class="text-sm font-semibold">Tournament standings</h2>
        <p class="mt-1 text-xs text-muted">
          Choose a league to explore its leaderboard.
        </p>
      </div>
      <label class="w-full max-w-sm"
        ><span class="sr-only">Select a tournament</span
        ><select v-model="selected">
          <option
            v-for="item in data"
            :key="item.tournamentID"
            :value="item.tournamentID"
          >
            {{ item.name }} · {{ item.semester }}
          </option>
        </select></label
      >
    </div>
    <RankingsPanel
      v-if="selected"
      :key="selected"
      :tournamentID="selected" /><EmptyState
      v-else
      title="No tournaments yet"
      description="The ladder will appear when the club creates its first tournament."
  /></AsyncState>
</template>
