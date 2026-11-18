<script setup lang="ts">
import type { RankedTeam } from "@shared/types";
import TeamAvatar from "@/components/ui/TeamAvatar.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import { Trophy } from "lucide-vue-next";
defineProps<{ rows: RankedTeam[]; compact?: boolean }>();
</script>
<template>
  <EmptyState
    v-if="!rows.length"
    title="The ladder is waiting"
    description="Add teams to this tournament to start the standings."
  />
  <div v-else class="table-scroll">
    <table class="data-table">
      <thead>
        <tr>
          <th class="!w-14">Rank</th>
          <th>Team</th>
          <th class="text-center">W</th>
          <th class="text-center">L</th>
          <th v-if="!compact" class="text-center">Played</th>
          <th class="text-right">Win %</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.team.teamID">
          <td>
            <span
              v-if="row.rank === 1"
              class="flex size-7 items-center justify-center rounded-lg bg-lime/60 text-[#536f2c]"
              ><Trophy :size="15" /></span
            ><span v-else class="pl-2 font-semibold text-muted">{{
              row.rank.toString().padStart(2, "0")
            }}</span>
          </td>
          <td>
            <RouterLink
              :to="'/teams/' + row.team.teamID"
              class="flex items-center gap-3 hover:underline"
              ><TeamAvatar :name="row.team.name" :color="row.team.color" />
              <div>
                <span class="font-semibold">{{ row.team.name }}</span>
                <p class="mt-1 text-[11px] font-normal text-muted">
                  {{
                    row.players
                      .map((player) => player.displayName)
                      .join(" & ") || "No players yet"
                  }}
                </p>
              </div></RouterLink
            >
          </td>
          <td class="text-center font-bold">{{ row.wins }}</td>
          <td class="text-center text-muted">{{ row.losses }}</td>
          <td v-if="!compact" class="text-center text-muted">
            {{ row.gamesPlayed }}
          </td>
          <td class="text-right font-semibold">
            {{ row.winPercentage.toFixed(0)
            }}<span class="text-xs font-normal text-muted">%</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
