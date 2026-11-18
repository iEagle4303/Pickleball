<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { ArrowLeft, Pencil, UserPlus, UserMinus, Users } from "lucide-vue-next";
import type { PublicUser } from "@shared/types";
import { teamApi } from "../api/teamApi";
import { useResource } from "@/lib/useResource";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { notify, errorMessage } from "@/lib/notifications";
import { confirmAction } from "@/lib/confirmation";
import AsyncState from "@/components/ui/AsyncState.vue";
import TeamAvatar from "@/components/ui/TeamAvatar.vue";
import UiButton from "@/components/ui/UiButton.vue";
import GamesTable from "@/features/games/components/GamesTable.vue";
import TournamentCard from "@/features/tournaments/components/TournamentCard.vue";
import TeamEditor from "../components/TeamEditor.vue";
const id = Number(useRoute().params.id);
const auth = useAuthStore();
const { data, loading, error, reload } = useResource(() => teamApi.get(id));
const editor = ref(false);
const busy = ref(false);
const players = ref<PublicUser[]>([]);
const selected = ref(0);
const rosterError = ref("");
const canManage = computed(
  () =>
    auth.can("MANAGE_TEAMS") ||
    data.value?.createdByUserID === auth.user?.userID,
);
const isMember = computed(() =>
  data.value?.members.some((member) => member.userID === auth.user?.userID),
);
const options = computed(() =>
  players.value.filter(
    (player) =>
      !data.value?.members.some((member) => member.userID === player.userID),
  ),
);
/**
 * Loads the public member directory for roster management.
 *
 * @returns Resolves after the action completes; no result value is returned.
 */
async function loadPlayers(): Promise<void> {
  try {
    players.value = await teamApi.users();
    rosterError.value = "";
  } catch (e) {
    rosterError.value = errorMessage(e);
  }
}
/**
 * Adds a player to the roster and reloads the team profile.
 *
 * @param userID - Primary key of the member to add, remove, or update.
 * @returns Resolves after the action completes; no result value is returned.
 */
async function add(userID: number): Promise<void> {
  busy.value = true;
  try {
    await teamApi.join(id, userID);
    notify("Player added to the roster.");
    selected.value = 0;
    reload();
  } catch (e) {
    notify(errorMessage(e), "error");
  } finally {
    busy.value = false;
  }
}
/**
 * Confirms membership removal and reloads the team profile after success.
 *
 * @param userID - Primary key of the member to add, remove, or update.
 * @returns Resolves after the action completes; no result value is returned.
 */
async function remove(userID: number): Promise<void> {
  if (
    !(await confirmAction(
      "Remove player from team?",
      "The team’s recorded results will remain in its history.",
    ))
  )
    return;
  busy.value = true;
  try {
    await teamApi.leave(id, userID);
    notify("Team roster updated.");
    reload();
  } catch (e) {
    notify(errorMessage(e), "error");
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <RouterLink
    to="/teams"
    class="mb-6 inline-flex items-center gap-2 text-xs text-muted hover:text-ink"
    ><ArrowLeft :size="14" />All teams</RouterLink
  ><AsyncState :loading="loading" :error="error" @retry="reload"
    ><template v-if="data"
      ><section class="panel mb-6 p-6 sm:p-8">
        <div class="flex flex-wrap items-center justify-between gap-5">
          <div class="flex items-center gap-5">
            <TeamAvatar :name="data.name" :color="data.color" large />
            <div>
              <p class="eyebrow mb-2">Team profile</p>
              <h1 class="page-title">{{ data.name }}</h1>
            </div>
          </div>
          <button
            v-if="canManage"
            class="btn btn-secondary"
            @click="editor = true"
          >
            <Pencil :size="15" />Edit team
          </button>
        </div>
        <div class="mt-8 grid grid-cols-4 gap-3 border-t border-line pt-6">
          <div
            v-for="stat in [
              { label: 'Wins', value: data.wins },
              { label: 'Losses', value: data.losses },
              { label: 'Games played', value: data.gamesPlayed },
              { label: 'Win rate', value: data.winPercentage.toFixed(0) + '%' },
            ]"
            :key="stat.label"
          >
            <p class="text-2xl font-bold">{{ stat.value }}</p>
            <p class="mt-1 text-[11px] text-muted">{{ stat.label }}</p>
          </div>
        </div>
      </section>
      <section class="panel mb-8 p-6">
        <h2 class="mb-4 text-lg font-bold">The people behind the paddles</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <div
            v-for="member in data.members"
            :key="member.userID"
            class="flex items-center gap-3 rounded-xl bg-canvas p-4"
          >
            <span
              class="flex size-10 items-center justify-center rounded-full bg-surface text-muted"
              ><Users :size="18"
            /></span>
            <div class="flex-1">
              <p class="text-sm font-semibold">{{ member.displayName }}</p>
              <p class="text-xs text-muted">@{{ member.username }}</p>
            </div>
            <button
              v-if="
                auth.user && (canManage || member.userID === auth.user.userID)
              "
              class="icon-btn"
              :disabled="busy"
              :aria-label="'Remove ' + member.displayName"
              @click="remove(member.userID)"
            >
              <UserMinus :size="16" />
            </button>
          </div>
          <div
            v-if="data.members.length < 2"
            class="rounded-xl border border-dashed border-line p-4"
          >
            <p class="text-sm font-medium">There’s room for a partner.</p>
            <p class="mt-1 text-xs text-muted">
              {{ 2 - data.members.length }} open spot{{
                data.members.length === 0 ? "s" : ""
              }}
              on this doubles team.
            </p>
            <UiButton
              v-if="auth.user && !isMember"
              variant="secondary"
              class="mt-3"
              :busy="busy"
              @click="add(auth.user.userID)"
              ><UserPlus :size="15" />Join this team</UiButton
            ><RouterLink
              v-if="!auth.user"
              to="/login"
              class="btn btn-secondary mt-3"
              >Sign in to join</RouterLink
            >
          </div>
        </div>
        <div
          v-if="canManage && data.members.length < 2"
          class="mt-5 border-t border-line pt-5"
        >
          <button
            v-if="!players.length"
            class="btn btn-secondary"
            @click="loadPlayers"
          >
            Choose a club member to add
          </button>
          <div v-else class="flex flex-wrap gap-3">
            <label class="min-w-48 flex-1"
              ><span class="sr-only">Choose a player</span
              ><select v-model="selected">
                <option :value="0" disabled>Select a club member</option>
                <option
                  v-for="player in options"
                  :key="player.userID"
                  :value="player.userID"
                >
                  {{ player.displayName }}
                </option>
              </select></label
            ><UiButton :busy="busy" :disabled="!selected" @click="add(selected)"
              >Add player</UiButton
            >
          </div>
          <p v-if="rosterError" class="mt-2 text-sm text-rose-600" role="alert">
            {{ rosterError }}
          </p>
        </div>
      </section>
      <h2 class="mb-4 text-lg font-bold">Tournament appearances</h2>
      <div
        v-if="data.tournaments.length"
        class="mb-8 grid gap-5 md:grid-cols-2 2xl:grid-cols-3"
      >
        <TournamentCard
          v-for="tournament in data.tournaments"
          :key="tournament.tournamentID"
          :tournament="tournament"
        />
      </div>
      <p v-else class="panel mb-8 p-6 text-sm text-muted">
        This team hasn’t joined a tournament yet. A club coordinator can add it
        to an upcoming league.
      </p>
      <section class="panel overflow-hidden">
        <h2 class="border-b border-line p-5 text-lg font-bold">Game history</h2>
        <GamesTable :games="data.games" />
      </section>
      <TeamEditor
        :open="editor"
        :team="data"
        @close="editor = false"
        @saved="reload" /></template
  ></AsyncState>
</template>
