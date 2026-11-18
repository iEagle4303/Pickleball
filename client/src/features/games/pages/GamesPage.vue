<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { Plus } from "lucide-vue-next";
import type { GameView } from "@shared/types";
import { gameApi } from "../api/gameApi";
import { useResource } from "@/lib/useResource";
import { confirmAction } from "@/lib/confirmation";
import { notify, errorMessage } from "@/lib/notifications";
import { useAuthStore } from "@/features/auth/stores/authStore";
import AsyncState from "@/components/ui/AsyncState.vue";
import GamesTable from "../components/GamesTable.vue";
import GameEditor from "../components/GameEditor.vue";
const route = useRoute();
const auth = useAuthStore();
const tournament = ref(Number(route.query.tournament) || 0);
const team = ref(0);
const sort = ref("newest");
const editor = ref(false);
const edited = ref<GameView>();
const { data, loading, error, reload } = useResource(async () => {
  const [games, tournaments, teams] = await Promise.all([
    gameApi.list(),
    gameApi.tournaments(),
    gameApi.teams(),
  ]);
  return { games, tournaments, teams };
});
const filtered = computed(() => {
  const result = (data.value?.games || []).filter(
    (game) =>
      (!tournament.value || game.tournamentID === tournament.value) &&
      (!team.value ||
        game.winnerTeamID === team.value ||
        game.loserTeamID === team.value),
  );
  return result.sort((a, b) =>
    sort.value === "highest"
      ? b.scoreWinner - a.scoreWinner || b.scoreLoser - a.scoreLoser
      : sort.value === "oldest"
        ? a.playedAt.localeCompare(b.playedAt)
        : b.playedAt.localeCompare(a.playedAt),
  );
});
async function remove(game: GameView) {
  if (
    !(await confirmAction(
      "Delete game result?",
      "This removes the result and recalculates the tournament standings. This action cannot be undone.",
    ))
  )
    return;
  try {
    await gameApi.remove(game.gameID);
    notify("Result deleted. Standings updated.");
    reload();
  } catch (e) {
    notify(errorMessage(e), "error");
  }
}
</script>
<template>
  <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="eyebrow mb-2">Every rally has a story</p>
      <h1 class="page-title">Game results</h1>
      <p class="page-subtitle">
        The scores, the wins, and everything that moves the ladder.
      </p>
    </div>
    <button
      v-if="auth.can('ADD_GAME_RESULT')"
      class="btn btn-primary"
      @click="
        edited = undefined;
        editor = true;
      "
    >
      <Plus :size="17" />Record a result
    </button>
  </div>
  <div class="panel mb-6 grid gap-3 p-4 sm:grid-cols-3">
    <label class="field"
      ><span class="sr-only">Filter by tournament</span
      ><select v-model="tournament">
        <option :value="0">All tournaments</option>
        <option
          v-for="item in data?.tournaments"
          :key="item.tournamentID"
          :value="item.tournamentID"
        >
          {{ item.name }} · {{ item.semester }}
        </option>
      </select></label
    ><label class="field"
      ><span class="sr-only">Filter by team</span
      ><select v-model="team">
        <option :value="0">All teams</option>
        <option
          v-for="item in data?.teams"
          :key="item.teamID"
          :value="item.teamID"
        >
          {{ item.name }}
        </option>
      </select></label
    ><label class="field"
      ><span class="sr-only">Sort results</span
      ><select v-model="sort">
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="highest">Highest score first</option>
      </select></label
    >
  </div>
  <AsyncState :loading="loading" :error="error" @retry="reload"
    ><section class="panel overflow-hidden">
      <div class="border-b border-line px-5 py-4 text-xs text-muted">
        {{ filtered.length }} completed games
      </div>
      <GamesTable
        :games="filtered"
        editable
        @edit="
          (game) => {
            edited = game;
            editor = true;
          }
        "
        @remove="remove"
      /></section></AsyncState
  ><GameEditor
    :open="editor"
    :game="edited"
    :tournamentID="tournament || undefined"
    @close="editor = false"
    @saved="reload"
  />
</template>
