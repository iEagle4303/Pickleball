<script setup lang="ts">
import { reactive, ref, watch, computed } from "vue";
import type { GameView, TournamentView, TeamView } from "@shared/types";
import { gameApi } from "../api/gameApi";
import { errorMessage, notify } from "@/lib/notifications";
import UiDialog from "@/components/ui/UiDialog.vue";
import UiButton from "@/components/ui/UiButton.vue";
const props = defineProps<{
  open: boolean;
  game?: GameView;
  tournamentID?: number;
  teamAID?: number;
  teamBID?: number;
}>();
const emit = defineEmits<{ close: []; saved: [] }>();
const tournaments = ref<TournamentView[]>([]);
const teams = ref<TeamView[]>([]);
const busy = ref(false);
const loadingTeams = ref(false);
const error = ref("");
const draft = reactive({
  tournamentID: 0,
  winnerTeamID: 0,
  loserTeamID: 0,
  scoreWinner: 11,
  scoreLoser: 0,
  playedAt: "",
});
let request = 0;
/**
 * Loads participating teams for the selected tournament and ignores stale responses.
 *
 * @param id - Primary key of the feature's team, tournament, or result.
 * @returns Resolves after the action completes; no result value is returned.
 */
async function loadTeams(id: number): Promise<void> {
  const current = ++request;
  teams.value = [];
  if (!id) return;
  loadingTeams.value = true;
  try {
    const result = await gameApi.tournament(id);
    if (current === request) teams.value = result.teams;
  } catch (e) {
    if (current === request) error.value = errorMessage(e);
  } finally {
    if (current === request) loadingTeams.value = false;
  }
}
watch(
  () => draft.tournamentID,
  (value, old) => {
    if (value !== old) {
      draft.winnerTeamID = 0;
      draft.loserTeamID = 0;
    }
    loadTeams(value);
  },
);
watch(
  () => props.open,
  async (value) => {
    if (!value) return;
    error.value = "";
    try {
      tournaments.value = await gameApi.tournaments();
      const id =
        props.game?.tournamentID ||
        props.tournamentID ||
        tournaments.value.find((row) => row.status === "active")
          ?.tournamentID ||
        0;
      draft.tournamentID = id;
      await loadTeams(id);
      Object.assign(draft, {
        tournamentID: id,
        winnerTeamID: props.game?.winnerTeamID || props.teamAID || 0,
        loserTeamID: props.game?.loserTeamID || props.teamBID || 0,
        scoreWinner: props.game?.scoreWinner ?? 11,
        scoreLoser: props.game?.scoreLoser ?? 0,
        playedAt: localDate(props.game?.playedAt || new Date().toISOString()),
      });
    } catch (e) {
      error.value = errorMessage(e);
    }
  },
);
/**
 * Converts an ISO timestamp to the local datetime-local input format.
 *
 * @param value - ISO date or timestamp to format for display or a local datetime input.
 * @returns A local YYYY-MM-DDTHH:mm value suitable for a datetime-local input.
 */
function localDate(value: string): string {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
const available = computed(() =>
  tournaments.value.filter((row) => row.status !== "upcoming"),
);
/**
 * Validates score ordering and submits a completed result to the API.
 *
 * @returns Resolves after the action completes; no result value is returned.
 */
async function save(): Promise<void> {
  busy.value = true;
  error.value = "";
  try {
    if (draft.winnerTeamID === draft.loserTeamID)
      throw new Error("Choose two different teams.");
    if (draft.scoreWinner <= draft.scoreLoser)
      throw new Error(
        "The winning score must be greater than the losing score.",
      );
    await gameApi.save(
      { ...draft, playedAt: new Date(draft.playedAt).toISOString() },
      props.game?.gameID,
    );
    notify("Result saved. The standings are up to date.");
    emit("saved");
    emit("close");
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <UiDialog
    :open="open"
    :title="game ? 'Edit game result' : 'Record a game result'"
    @close="emit('close')"
    ><form class="space-y-4" @submit.prevent="save">
      <p class="text-sm text-muted">
        Good game? Make it official. Results update the tournament ladder.
      </p>
      <div v-if="error" class="error-box" role="alert">{{ error }}</div>
      <label class="field"
        >Tournament<select v-model="draft.tournamentID" required>
          <option :value="0" disabled>Select a tournament</option>
          <option
            v-for="tournament in available"
            :key="tournament.tournamentID"
            :value="tournament.tournamentID"
          >
            {{ tournament.name }} · {{ tournament.semester }}
          </option>
        </select></label
      >
      <div class="grid grid-cols-[1fr_5rem] gap-3">
        <label class="field"
          >Winning team<select
            v-model="draft.winnerTeamID"
            :disabled="loadingTeams"
            required
          >
            <option :value="0" disabled>
              {{ loadingTeams ? "Loading teams…" : "Select winner" }}
            </option>
            <option
              v-for="team in teams"
              :key="team.teamID"
              :value="team.teamID"
            >
              {{ team.name }}
            </option>
          </select></label
        ><label class="field"
          >Score<input
            v-model.number="draft.scoreWinner"
            type="number"
            min="0"
            max="999"
            step="1"
            required /></label
        ><label class="field"
          >Losing team<select
            v-model="draft.loserTeamID"
            :disabled="loadingTeams"
            required
          >
            <option :value="0" disabled>Select opponent</option>
            <option
              v-for="team in teams"
              :key="team.teamID"
              :value="team.teamID"
            >
              {{ team.name }}
            </option>
          </select></label
        ><label class="field"
          >Score<input
            v-model.number="draft.scoreLoser"
            type="number"
            min="0"
            max="999"
            step="1"
            required
        /></label>
      </div>
      <p
        v-if="!loadingTeams && draft.tournamentID && !teams.length"
        class="text-xs text-muted"
      >
        Add participating teams on the tournament page first.
      </p>
      <label class="field"
        >Played at<input
          v-model="draft.playedAt"
          type="datetime-local"
          required
          :max="localDate(new Date().toISOString())"
      /></label>
      <div class="flex justify-end gap-3 pt-3">
        <UiButton variant="secondary" @click="emit('close')">Cancel</UiButton
        ><UiButton
          type="submit"
          :busy="busy"
          :disabled="loadingTeams || !draft.winnerTeamID || !draft.loserTeamID"
          >{{ game ? "Save changes" : "Save result" }}</UiButton
        >
      </div>
    </form></UiDialog
  >
</template>
