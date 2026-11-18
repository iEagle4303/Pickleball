<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Pencil,
  Users,
  Plus,
  ArrowUpRight,
  Trash2,
  Trophy,
  Activity,
} from "lucide-vue-next";
import type { GameView } from "@shared/types";
import { tournamentApi } from "../api/tournamentApi";
import { gameApi } from "@/features/games/api/gameApi";
import { useResource } from "@/lib/useResource";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { formatDate } from "@/lib/format";
import { notify, errorMessage } from "@/lib/notifications";
import { confirmAction } from "@/lib/confirmation";
import AsyncState from "@/components/ui/AsyncState.vue";
import StatusBadge from "@/components/ui/StatusBadge.vue";
import TeamAvatar from "@/components/ui/TeamAvatar.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import TournamentEditor from "../components/TournamentEditor.vue";
import ParticipantEditor from "../components/ParticipantEditor.vue";
import TournamentCard from "../components/TournamentCard.vue";
import RankingsPanel from "@/features/rankings/components/RankingsPanel.vue";
import MatchupsPanel from "@/features/matchups/components/MatchupsPanel.vue";
import GamesTable from "@/features/games/components/GamesTable.vue";
import GameEditor from "@/features/games/components/GameEditor.vue";
const id = Number(useRoute().params.id);
const router = useRouter();
const auth = useAuthStore();
const { data, loading, error, reload } = useResource(async () => {
  const [detail, all] = await Promise.all([
    tournamentApi.get(id),
    tournamentApi.list(),
  ]);
  return { detail, all };
});
const tab = ref("Overview");
const tabs = ["Overview", "Rankings", "Teams", "Games", "Matchups"];
/**
 * Moves focus and selection through tournament tabs using the arrow, Home, and End keys.
 *
 * @param event - Keyboard event used to close navigation or move between tabs.
 * @returns No result value.
 */
function moveTab(event: KeyboardEvent): void {
  let index = tabs.indexOf(tab.value);
  if (event.key === "ArrowRight") index = (index + 1) % tabs.length;
  else if (event.key === "ArrowLeft")
    index = (index + tabs.length - 1) % tabs.length;
  else if (event.key === "Home") index = 0;
  else if (event.key === "End") index = tabs.length - 1;
  else return;
  event.preventDefault();
  tab.value = tabs[index];
  (event.currentTarget as HTMLElement)
    .querySelector<HTMLButtonElement>("#tab-" + tab.value)
    ?.focus();
}
const edit = ref(false);
const participants = ref(false);
const gameEditor = ref(false);
const editedGame = ref<GameView>();
/**
 * Confirms and deletes a result, then reloads the tournament details.
 *
 * @param game - Completed game selected for editing or deletion.
 * @returns Resolves after the action completes; no result value is returned.
 */
async function removeGame(game: GameView): Promise<void> {
  if (
    !(await confirmAction(
      "Delete this result?",
      "The result will be permanently removed and standings will update.",
    ))
  )
    return;
  try {
    await gameApi.remove(game.gameID);
    notify("Game result deleted.");
    reload();
  } catch (e) {
    notify(errorMessage(e), "error");
  }
}
/**
 * Confirms and deletes an eligible tournament, then returns to the tournament list.
 *
 * @returns Resolves after the action completes; no result value is returned.
 */
async function removeTournament(): Promise<void> {
  if (
    !(await confirmAction(
      "Delete tournament?",
      "This tournament and its participation list will be permanently removed.",
    ))
  )
    return;
  try {
    await tournamentApi.remove(id);
    notify("Tournament deleted.");
    router.push("/tournaments");
  } catch (e) {
    notify(errorMessage(e), "error");
  }
}
</script>
<template>
  <RouterLink
    to="/tournaments"
    class="mb-6 inline-flex items-center gap-2 text-xs text-muted hover:text-ink"
    ><ArrowLeft :size="14" />All tournaments</RouterLink
  ><AsyncState :loading="loading" :error="error" @retry="reload"
    ><template v-if="data"
      ><div class="mb-7">
        <div class="mb-3 flex items-center gap-3">
          <StatusBadge :status="data.detail.status" /><span
            class="text-xs text-muted"
            >{{ data.detail.semester }} · {{ data.detail.type }}</span
          >
        </div>
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 class="page-title">{{ data.detail.name }}</h1>
            <RouterLink
              v-if="data.detail.parent"
              :to="'/tournaments/' + data.detail.parent.tournamentID"
              class="mt-2 inline-flex items-center gap-1 text-xs text-muted hover:underline"
              >Division of {{ data.detail.parent.name
              }}<ArrowUpRight :size="13"
            /></RouterLink>
            <p class="page-subtitle max-w-2xl">{{ data.detail.description }}</p>
          </div>
          <div class="flex gap-2">
            <button
              v-if="auth.can('EDIT_TOURNAMENT')"
              class="btn btn-secondary"
              @click="edit = true"
            >
              <Pencil :size="15" />Edit</button
            ><button
              v-if="
                auth.can('ADD_GAME_RESULT') && data.detail.status !== 'upcoming'
              "
              class="btn btn-primary"
              @click="
                editedGame = undefined;
                gameEditor = true;
              "
            >
              <Plus :size="16" />Record result
            </button>
          </div>
        </div>
      </div>
      <div
        class="mb-7 flex gap-6 overflow-x-auto border-b border-line"
        role="tablist"
        aria-label="Tournament sections"
        @keydown="moveTab"
      >
        <button
          v-for="item in tabs"
          :key="item"
          :class="['tab', tab === item ? 'tab-active' : '']"
          role="tab"
          :tabindex="tab === item ? 0 : -1"
          :aria-selected="tab === item"
          :id="'tab-' + item"
          aria-controls="tournament-panel"
          @click="tab = item"
        >
          {{ item
          }}<span
            v-if="item === 'Teams' || item === 'Games'"
            class="ml-2 rounded bg-canvas px-1.5 py-0.5 text-[10px] text-muted"
            >{{
              item === "Teams" ? data.detail.teamCount : data.detail.gameCount
            }}</span
          >
        </button>
      </div>
      <div
        id="tournament-panel"
        role="tabpanel"
        :aria-labelledby="'tab-' + tab"
      >
        <template v-if="tab === 'Overview'"
          ><div class="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <section class="panel p-6">
              <p class="eyebrow mb-3">The game plan</p>
              <h2 class="mb-3 text-xl font-bold">
                A league worth showing up for.
              </h2>
              <p class="text-sm leading-relaxed text-muted">
                {{
                  data.detail.description ||
                  "Find your partner and make your way up the ladder."
                }}
              </p>
              <div class="mt-6 grid grid-cols-2 gap-4">
                <div class="rounded-xl bg-canvas p-5">
                  <Users class="mb-3 text-muted" :size="19" />
                  <p class="text-3xl font-bold">{{ data.detail.teamCount }}</p>
                  <p class="mt-1 text-xs text-muted">Participating teams</p>
                </div>
                <div class="rounded-xl bg-canvas p-5">
                  <Activity class="mb-3 text-muted" :size="19" />
                  <p class="text-3xl font-bold">{{ data.detail.gameCount }}</p>
                  <p class="mt-1 text-xs text-muted">Completed games</p>
                </div>
              </div>
            </section>
            <section class="panel p-6">
              <h2 class="mb-5 text-base font-bold">The details</h2>
              <div class="space-y-5 text-sm">
                <div class="flex gap-3">
                  <CalendarDays class="shrink-0 text-muted" :size="18" />
                  <div>
                    <p class="font-medium">
                      {{ formatDate(data.detail.startDate) }} –
                      {{ formatDate(data.detail.endDate) }}
                    </p>
                    <p class="mt-1 text-xs text-muted">
                      {{ data.detail.semester }}
                    </p>
                  </div>
                </div>
                <div class="flex gap-3">
                  <MapPin class="shrink-0 text-muted" :size="18" />
                  <p>{{ data.detail.location }}</p>
                </div>
                <div class="flex gap-3">
                  <Trophy class="shrink-0 text-muted" :size="18" />
                  <p class="capitalize">
                    {{ data.detail.type.replace("-", " ") }} format
                  </p>
                </div>
              </div>
              <button
                class="btn btn-secondary mt-6 w-full"
                @click="tab = 'Rankings'"
              >
                Explore the standings<ArrowUpRight :size="15" />
              </button>
            </section>
          </div>
          <div v-if="data.detail.children.length" class="mt-8">
            <h2 class="mb-4 text-lg font-bold">Divisions & stages</h2>
            <div class="grid gap-5 md:grid-cols-2">
              <TournamentCard
                v-for="child in data.detail.children"
                :key="child.tournamentID"
                :tournament="child"
              />
            </div>
          </div>
          <div
            v-if="
              auth.can('EDIT_TOURNAMENT') &&
              !data.detail.gameCount &&
              !data.detail.children.length
            "
            class="mt-8"
          >
            <button
              class="btn btn-ghost !text-rose-600"
              @click="removeTournament"
            >
              <Trash2 :size="15" />Delete tournament
            </button>
          </div></template
        >
        <RankingsPanel v-else-if="tab === 'Rankings'" :tournamentID="id" />
        <template v-else-if="tab === 'Teams'"
          ><div class="mb-5 flex items-center justify-between">
            <h2 class="text-lg font-bold">The lineup</h2>
            <button
              v-if="auth.can('EDIT_TOURNAMENT')"
              class="btn btn-secondary"
              @click="participants = true"
            >
              <Users :size="15" />Manage teams
            </button>
          </div>
          <div
            v-if="data.detail.teams.length"
            class="grid gap-4 md:grid-cols-2"
          >
            <RouterLink
              v-for="team in data.detail.teams"
              :key="team.teamID"
              :to="'/teams/' + team.teamID"
              class="panel flex items-center gap-4 p-5 transition hover:border-emerald-600/40"
              ><TeamAvatar :name="team.name" :color="team.color" />
              <div class="min-w-0 flex-1">
                <h3 class="truncate text-sm font-bold">{{ team.name }}</h3>
                <p class="mt-1 text-xs text-muted">
                  {{
                    team.members.map((row) => row.displayName).join(" & ") ||
                    "Roster open"
                  }}
                </p>
              </div>
              <span class="text-xs text-muted"
                >{{ team.wins }}W – {{ team.losses }}L</span
              ><ArrowUpRight class="text-muted" :size="16"
            /></RouterLink>
          </div>
          <EmptyState
            v-else
            title="The lineup starts here"
            description="A coordinator can add teams to this tournament."
        /></template>
        <section v-else-if="tab === 'Games'" class="panel overflow-hidden">
          <GamesTable
            :games="data.detail.games"
            editable
            @edit="
              (game) => {
                editedGame = game;
                gameEditor = true;
              }
            "
            @remove="removeGame"
          />
        </section>
        <MatchupsPanel v-else-if="tab === 'Matchups'" :tournamentID="id" />
      </div>
      <TournamentEditor
        :open="edit"
        :tournament="data.detail"
        :tournaments="data.all"
        @close="edit = false"
        @saved="reload" /><ParticipantEditor
        :open="participants"
        :tournamentID="id"
        :selectedIDs="data.detail.teams.map((team) => team.teamID)"
        @close="participants = false"
        @saved="reload" /><GameEditor
        :open="gameEditor"
        :game="editedGame"
        :tournamentID="id"
        @close="gameEditor = false"
        @saved="reload" /></template
  ></AsyncState>
</template>
