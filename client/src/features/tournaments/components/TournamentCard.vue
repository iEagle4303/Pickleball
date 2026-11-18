<script setup lang="ts">
import type { TournamentView } from "@shared/types";
import {
  CalendarDays,
  Users,
  ArrowUpRight,
  MapPin,
  Trophy,
} from "lucide-vue-next";
import { formatDate } from "@/lib/format";
import StatusBadge from "@/components/ui/StatusBadge.vue";
defineProps<{ tournament: TournamentView }>();
</script>
<template>
  <RouterLink
    :to="'/tournaments/' + tournament.tournamentID"
    class="panel group block overflow-hidden transition hover:-translate-y-1 hover:border-emerald-600/40 hover:shadow-lg hover:shadow-emerald-950/5"
    ><div
      :class="[
        'flex h-28 items-center justify-between p-6',
        tournament.status === 'active'
          ? 'bg-forest text-lime'
          : tournament.status === 'upcoming'
            ? 'bg-[#e8eddd] text-[#587144]'
            : 'bg-[#e5ece9] text-[#70867d]',
      ]"
    >
      <Trophy :size="36" :stroke-width="1.3" />
      <div class="text-right">
        <p class="text-[10px] font-bold uppercase tracking-widest opacity-60">
          {{ tournament.semester }}
        </p>
        <p class="mt-1 text-2xl font-bold tracking-tight">
          {{
            tournament.type === "ladder"
              ? "The ladder."
              : tournament.type === "bracket"
                ? "The bracket."
                : "The round robin."
          }}
        </p>
      </div>
    </div>
    <div class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <StatusBadge :status="tournament.status" /><span
          v-if="tournament.parentTournamentID"
          class="text-[10px] text-muted"
          >Division</span
        ><ArrowUpRight
          :size="17"
          class="text-muted transition group-hover:text-ink"
        />
      </div>
      <h2 class="text-lg font-bold">{{ tournament.name }}</h2>
      <p class="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
        {{ tournament.description }}
      </p>
      <div class="mt-5 space-y-2 text-xs text-muted">
        <p class="flex items-center gap-2">
          <CalendarDays :size="14" />{{ formatDate(tournament.startDate) }} –
          {{ formatDate(tournament.endDate) }} · {{ tournament.semester }}
        </p>
        <p class="flex items-center gap-2">
          <MapPin :size="14" />{{ tournament.location }}
        </p>
      </div>
      <div
        class="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs"
      >
        <span class="flex items-center gap-2 text-muted"
          ><Users :size="14" />{{ tournament.teamCount }} teams</span
        ><span class="font-medium"
          >{{ tournament.gameCount }} games played</span
        >
      </div>
    </div></RouterLink
  >
</template>
