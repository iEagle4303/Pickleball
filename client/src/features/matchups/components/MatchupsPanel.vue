<script setup lang="ts">
import { ref } from "vue";
import { RefreshCw, Plus, Swords } from "lucide-vue-next";
import { matchupApi } from "../api/matchupApi";
import { useResource } from "@/lib/useResource";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { notify, errorMessage } from "@/lib/notifications";
import type { Matchup } from "@shared/types";
import TeamAvatar from "@/components/ui/TeamAvatar.vue";
import AsyncState from "@/components/ui/AsyncState.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import UiButton from "@/components/ui/UiButton.vue";
import GameEditor from "@/features/games/components/GameEditor.vue";
const props = defineProps<{ tournamentID: number }>();
const auth = useAuthStore();
const round = ref(0);
const busy = ref(false);
const editor = ref(false);
const pair = ref<Matchup>();
const { data, loading, error, reload } = useResource(() =>
  matchupApi.get(props.tournamentID),
);
/**
 * Requests the next pairing round and updates the displayed matchups.
 *
 * @returns Resolves after the action completes; no result value is returned.
 */
async function regenerate(): Promise<void> {
  busy.value = true;
  try {
    data.value = await matchupApi.regenerate(
      props.tournamentID,
      round.value + 1,
    );
    round.value++;
    notify("Fresh pairings are ready.");
  } catch (e) {
    notify(errorMessage(e), "error");
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
    <p class="max-w-lg text-sm leading-relaxed text-muted">
      Friendly competition, well matched. Suggested opponents are close on the
      ladder, with a preference for fresh pairings.
    </p>
    <UiButton
      v-if="auth.can('EDIT_TOURNAMENT')"
      variant="secondary"
      :busy="busy"
      @click="regenerate"
      ><RefreshCw :size="15" />Refresh pairings</UiButton
    >
  </div>
  <AsyncState :loading="loading" :error="error" @retry="reload"
    ><div v-if="data?.matchups.length" class="grid gap-5 md:grid-cols-2">
      <article
        v-for="item in data.matchups"
        :key="item.court"
        class="panel overflow-hidden"
      >
        <div
          class="flex items-center justify-between border-b border-line bg-canvas/50 px-5 py-3"
        >
          <span class="eyebrow">Suggested · Court {{ item.court }}</span
          ><Swords :size="16" class="text-muted" />
        </div>
        <div class="flex items-center justify-between gap-3 p-6">
          <div class="flex flex-1 flex-col items-center gap-3 text-center">
            <TeamAvatar
              :name="item.teamA.team.name"
              :color="item.teamA.team.color"
              large
            /><RouterLink
              :to="'/teams/' + item.teamA.team.teamID"
              class="text-sm font-bold hover:underline"
              >{{ item.teamA.team.name }}</RouterLink
            ><span class="text-[11px] text-muted"
              >Rank #{{ item.teamA.rank }} · {{ item.teamA.wins }}W –
              {{ item.teamA.losses }}L</span
            >
          </div>
          <span
            class="flex size-8 shrink-0 items-center justify-center rounded-full bg-canvas text-[10px] font-bold text-muted"
            >VS</span
          >
          <div class="flex flex-1 flex-col items-center gap-3 text-center">
            <TeamAvatar
              :name="item.teamB.team.name"
              :color="item.teamB.team.color"
              large
            /><RouterLink
              :to="'/teams/' + item.teamB.team.teamID"
              class="text-sm font-bold hover:underline"
              >{{ item.teamB.team.name }}</RouterLink
            ><span class="text-[11px] text-muted"
              >Rank #{{ item.teamB.rank }} · {{ item.teamB.wins }}W –
              {{ item.teamB.losses }}L</span
            >
          </div>
        </div>
        <div
          class="flex items-center justify-between gap-3 border-t border-line px-5 py-3"
        >
          <span class="text-[10px] text-muted">{{
            item.recentlyPlayed ? "A familiar rivalry" : "A fresh matchup"
          }}</span><button
            v-if="auth.can('ADD_GAME_RESULT')"
            class="flex items-center gap-1 text-xs font-semibold"
            @click="
              pair = item;
              editor = true;
            "
          >
            <Plus :size="14" />Record result
          </button>
        </div>
      </article>
    </div>
    <EmptyState
      v-else
      title="Waiting for a worthy opponent"
      description="A tournament needs at least two teams to suggest a matchup."
    />
    <div v-if="data?.bye" class="panel mt-5 p-5 text-sm">
      <span class="font-semibold">{{ data.bye.team.name }}</span><span
        class="text-muted"
      >
        has a bye this round. They'll be back in the mix next time.</span
      >
    </div>
    <p class="mt-5 text-xs text-muted">
      Pairings are recommendations. Confirm a time with your opponents before
      heading to the court.
    </p></AsyncState
  ><GameEditor
    :open="editor"
    :tournamentID="tournamentID"
    :teamAID="pair?.teamA.team.teamID"
    :teamBID="pair?.teamB.team.teamID"
    @close="editor = false"
    @saved="reload"
  />
</template>
