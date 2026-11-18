<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import { matchupApi } from "../api/matchupApi";
import { useResource } from "@/lib/useResource";
import AsyncState from "@/components/ui/AsyncState.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import MatchupsPanel from "../components/MatchupsPanel.vue";
const selected = ref(Number(useRoute().query.tournament) || 0);
const { data, loading, error, reload } = useResource(async () => {
  const rows = (await matchupApi.tournaments()).filter(
    (row) => row.status === "active",
  );
  if (!rows.some((row) => row.tournamentID === selected.value))
    selected.value = rows[0]?.tournamentID || 0;
  return rows;
});
</script>
<template>
  <div class="mb-8 flex flex-wrap items-end justify-between gap-5">
    <div>
      <p class="eyebrow mb-2">Meet across the net</p>
      <h1 class="page-title">Your next matchups</h1>
      <p class="page-subtitle">
        A new opponent. A fresh rally. Let’s make a game of it.
      </p>
    </div>
    <label class="w-full max-w-sm"
      ><span class="sr-only">Active tournament</span
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
  <AsyncState :loading="loading" :error="error" @retry="reload"
    ><MatchupsPanel
      v-if="selected"
      :key="selected"
      :tournamentID="selected" /><EmptyState
      v-else
      title="The courts are taking a breather"
      description="Matchup recommendations will return when a tournament is active."
  /></AsyncState>
</template>
