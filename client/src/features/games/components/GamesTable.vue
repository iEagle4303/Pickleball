<script setup lang="ts">
import type { GameView } from "@shared/types";
import { formatDate } from "@/lib/format";
import { Pencil, Trash2 } from "lucide-vue-next";
import { useAuthStore } from "@/features/auth/stores/authStore";
import TeamAvatar from "@/components/ui/TeamAvatar.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
defineProps<{ games: GameView[]; editable?: boolean; compact?: boolean }>();
defineEmits<{ edit: [game: GameView]; remove: [game: GameView] }>();
const auth = useAuthStore();
</script>
<template>
  <EmptyState
    v-if="!games.length"
    title="No results yet"
    description="Completed games will appear here. Try another filter or record the first result."
  />
  <div v-else class="table-scroll">
    <table class="data-table">
      <thead>
        <tr>
          <th>Match</th>
          <th class="text-center">Score</th>
          <th v-if="!compact">Tournament</th>
          <th>Date</th>
          <th v-if="editable"><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="game in games" :key="game.gameID">
          <td>
            <div class="flex items-center gap-3">
              <TeamAvatar :name="game.winner.name" :color="game.winner.color" />
              <div>
                <RouterLink
                  :to="'/teams/' + game.winnerTeamID"
                  class="font-semibold hover:underline"
                  >{{ game.winner.name }}</RouterLink
                >
                <p class="mt-1 text-xs text-muted">
                  vs
                  <RouterLink
                    :to="'/teams/' + game.loserTeamID"
                    class="hover:underline"
                    >{{ game.loser.name }}</RouterLink
                  >
                </p>
              </div>
            </div>
          </td>
          <td class="text-center">
            <span class="font-bold">{{ game.scoreWinner }}</span
            ><span class="mx-2 text-muted">–</span
            ><span class="text-muted">{{ game.scoreLoser }}</span>
          </td>
          <td v-if="!compact">
            <RouterLink
              :to="'/tournaments/' + game.tournamentID"
              class="text-xs hover:underline"
              >{{ game.tournament.name
              }}<span class="mt-1 block text-muted">{{
                game.tournament.semester
              }}</span></RouterLink
            >
          </td>
          <td class="text-xs text-muted">
            {{
              formatDate(game.playedAt, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            }}
          </td>
          <td v-if="editable">
            <div class="flex">
              <button
                v-if="auth.can('EDIT_GAME_RESULT')"
                class="icon-btn"
                :aria-label="'Edit game ' + game.gameID"
                @click="$emit('edit', game)"
              >
                <Pencil :size="16" /></button
              ><button
                v-if="auth.can('DELETE_GAME_RESULT')"
                class="icon-btn hover:!text-rose-600"
                :aria-label="'Delete game ' + game.gameID"
                @click="$emit('remove', game)"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
