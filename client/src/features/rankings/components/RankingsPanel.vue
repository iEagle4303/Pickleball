<script setup lang="ts">
import { rankingApi } from "../api/rankingApi";
import { useResource } from "@/lib/useResource";
import AsyncState from "@/components/ui/AsyncState.vue";
import LeaderboardTable from "./LeaderboardTable.vue";
defineOptions({ inheritAttrs: false });
const props = defineProps<{ tournamentID: number }>();
const { data, loading, error, reload } = useResource(() =>
  rankingApi.list(props.tournamentID),
);
</script>
<template>
  <AsyncState :loading="loading" :error="error" @retry="reload"
    ><section class="panel overflow-hidden">
      <LeaderboardTable :rows="data || []" />
      <p class="border-t border-line px-5 py-4 text-xs text-muted">
        Standings use wins, then win percentage. Ties are ordered consistently.
        Every saved result updates the ladder.
      </p>
    </section></AsyncState
  >
</template>
