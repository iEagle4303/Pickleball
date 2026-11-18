<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  ArrowUpRight,
  ArrowRight,
  Users,
  Trophy,
  Activity,
  CalendarDays,
  MapPin,
  Sparkles,
  Swords,
} from "lucide-vue-next";
import { getHome } from "../api/homeApi";
import type { HomeData } from "@shared/types";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { errorMessage } from "@/lib/notifications";
import { formatDate } from "@/lib/format";
import AsyncState from "@/components/ui/AsyncState.vue";
import StatusBadge from "@/components/ui/StatusBadge.vue";
import TeamAvatar from "@/components/ui/TeamAvatar.vue";
import LeaderboardTable from "@/features/rankings/components/LeaderboardTable.vue";
import GamesTable from "@/features/games/components/GamesTable.vue";
const data = ref<HomeData>();
const loading = ref(true);
const error = ref("");
const auth = useAuthStore();
async function load() {
  loading.value = true;
  error.value = "";
  try {
    data.value = await getHome();
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
}
onMounted(load);
</script>
<template>
  <AsyncState :loading="loading" :error="error" @retry="load"
    ><template v-if="data">
      <div class="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="eyebrow mb-2">On the court. In the community.</p>
          <h1 class="page-title">
            {{
              auth.user
                ? "Hey, " +
                  auth.user.displayName.split(" ")[0] +
                  ". Ready to rally?"
                : "Welcome to the clubhouse."
            }}
          </h1>
          <p class="page-subtitle">
            Your next great game starts here. Let’s get you on the court.
          </p>
        </div>
        <RouterLink to="/tournaments" class="btn btn-secondary"
          >Explore tournaments <ArrowUpRight :size="16"
        /></RouterLink>
      </div>
      <section
        class="relative mb-7 overflow-hidden rounded-[22px] bg-[#183f38] p-7 text-white sm:p-9"
      >
        <div class="relative z-10 max-w-lg">
          <span
            class="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-medium tracking-wider text-[#d4f476]"
            ><span class="size-1.5 rounded-full bg-lime"></span> UW–STOUT
            PICKLEBALL CLUB</span
          >
          <h2
            class="text-[36px] font-semibold leading-[1.12] tracking-[-.04em] sm:text-[44px]"
          >
            A little competition.<br />A lot of community<span class="text-lime"
              >.</span
            >
          </h2>
          <p class="mt-4 max-w-sm text-sm leading-relaxed text-[#bdcfc7]">
            Find your partner, climb the ladder, and make every game count. All
            skill levels. One great club.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <RouterLink
              :to="
                data.active
                  ? '/tournaments/' + data.active.tournamentID
                  : '/tournaments'
              "
              class="btn !bg-lime !text-[#193b31] hover:!bg-[#e0ff91]"
              >{{ data.active ? "View the active league" : "Find your league"
              }}<ArrowUpRight :size="16" /></RouterLink
            ><RouterLink
              to="/teams"
              class="btn !border !border-white/20 !text-white hover:!bg-white/10"
              >Find a team <Users :size="15"
            /></RouterLink>
          </div>
        </div>
        <div
          class="pointer-events-none absolute -right-12 -top-6 hidden h-[370px] w-[460px] rotate-[-18deg] opacity-80 xl:block"
          role="img"
          aria-label="Illustration of a pickleball court"
        >
          <div
            class="absolute left-6 top-12 h-[280px] w-[400px] rounded-lg border-2 border-[#abcbb3]/25 bg-[#265147] p-5"
          >
            <div class="relative h-full border-2 border-[#c6e0c9]/60">
              <div
                class="absolute left-1/2 top-0 h-full border-l-2 border-[#c6e0c9]/60"
              ></div>
              <div
                class="absolute left-0 top-1/2 w-full border-t-2 border-[#c6e0c9]/60"
              ></div>
              <div
                class="absolute left-[32%] top-0 h-full w-[36%] border-x-2 border-[#c6e0c9]/60 bg-[#3c6a53]"
              ></div>
              <div
                class="absolute left-1/2 top-[-10%] h-[120%] border-l-4 border-dashed border-white/70"
              ></div>
            </div>
          </div>
          <div
            class="absolute right-2 top-9 flex size-20 items-center justify-center rounded-full bg-lime shadow-xl shadow-black/15"
          >
            <div class="grid grid-cols-3 gap-2">
              <i
                v-for="i in 9"
                :key="i"
                class="size-2 rounded-full bg-[#91ac48]"
              ></i>
            </div>
          </div>
          <span
            class="absolute bottom-9 left-12 rounded-full border border-white/20 bg-[#31574b] px-4 py-2 text-xs text-white/70"
            >See you in the kitchen.</span
          >
        </div>
      </section>
      <div class="mb-8 grid grid-cols-2 gap-3 xl:grid-cols-4 sm:gap-5">
        <div
          v-for="stat in [
            {
              label: 'Club members',
              value: data.stats.members,
              icon: Users,
              note: 'A growing community',
            },
            {
              label: 'Teams on the court',
              value: data.stats.teams,
              icon: Swords,
              note: 'Better with a partner',
            },
            {
              label: 'Games in the books',
              value: data.stats.games,
              icon: Activity,
              note: 'Every rally counts',
            },
            {
              label: 'Tournaments',
              value: data.stats.tournaments,
              icon: Trophy,
              note: 'Across the semesters',
            },
          ]"
          :key="stat.label"
          class="panel p-4 sm:p-5"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs text-muted">{{ stat.label }}</span
            ><component :is="stat.icon" :size="17" class="text-muted" />
          </div>
          <p class="mb-1 mt-3 text-3xl font-semibold tracking-tight">
            {{ stat.value }}
          </p>
          <p class="text-[10px] text-muted">{{ stat.note }}</p>
        </div>
      </div>
      <div class="grid items-start gap-6 xl:grid-cols-[1.65fr_1fr]">
        <div class="min-w-0 space-y-6">
          <section class="panel overflow-hidden">
            <div
              class="flex items-center justify-between gap-3 border-b border-line p-5"
            >
              <div>
                <p class="eyebrow mb-1">The climb continues</p>
                <h2 class="text-lg font-bold">Ladder leaderboard</h2>
              </div>
              <RouterLink
                :to="
                  data.active
                    ? '/rankings?tournament=' + data.active.tournamentID
                    : '/rankings'
                "
                class="flex items-center gap-1 text-xs font-semibold"
                >Full standings <ArrowUpRight :size="15"
              /></RouterLink>
            </div>
            <LeaderboardTable :rows="data.rankings" compact />
            <div class="border-t border-line px-5 py-3 text-[10px] text-muted">
              {{ data.active?.name || "No active league" }} · Standings update
              with every result
            </div>
          </section>
          <section class="panel overflow-hidden">
            <div
              class="flex items-center justify-between border-b border-line p-5"
            >
              <h2 class="text-lg font-bold">Fresh off the court</h2>
              <RouterLink
                to="/games"
                class="flex items-center gap-1 text-xs font-semibold"
                >All results <ArrowUpRight :size="15"
              /></RouterLink>
            </div>
            <GamesTable :games="data.recentGames.slice(0, 3)" compact />
          </section>
        </div>
        <div class="min-w-0 space-y-6">
          <section v-if="data.active" class="panel p-6">
            <div class="mb-5 flex items-center justify-between">
              <p class="eyebrow">In the spotlight</p>
              <StatusBadge :status="data.active.status" />
            </div>
            <span
              class="mb-4 flex size-11 items-center justify-center rounded-xl bg-canvas text-forest dark:text-lime"
              ><Trophy :size="23" :stroke-width="1.5"
            /></span>
            <h2 class="text-xl font-bold">{{ data.active.name }}</h2>
            <p class="mt-2 text-xs leading-relaxed text-muted">
              {{ data.active.semester }} · {{ data.active.teamCount }} teams.
              One way up.
            </p>
            <div class="mt-5 space-y-3 text-xs text-muted">
              <p class="flex items-center gap-2">
                <CalendarDays :size="15" />{{
                  formatDate(data.active.startDate)
                }}
                – {{ formatDate(data.active.endDate) }}
              </p>
              <p class="flex items-start gap-2">
                <MapPin :size="15" class="shrink-0" />{{ data.active.location }}
              </p>
            </div>
            <RouterLink
              :to="'/tournaments/' + data.active.tournamentID"
              class="btn btn-secondary mt-6 w-full"
              >League details <ArrowRight :size="15"
            /></RouterLink>
          </section>
          <section class="panel p-6">
            <div class="mb-1 flex items-center gap-2">
              <Sparkles :size="17" class="text-muted" />
              <h2 class="text-base font-bold">Your next rally</h2>
            </div>
            <p class="mb-5 text-xs text-muted">
              Suggested pairings for the active league.
            </p>
            <div
              v-if="data.matchups.matchups[0]"
              class="rounded-xl border border-line p-4"
            >
              <p class="eyebrow mb-4">Suggested matchup · Court 1</p>
              <div class="flex items-center justify-between gap-2">
                <div class="flex flex-col items-center gap-2 text-center">
                  <TeamAvatar
                    :name="data.matchups.matchups[0].teamA.team.name"
                    :color="data.matchups.matchups[0].teamA.team.color"
                  /><span class="max-w-24 text-xs font-semibold">{{
                    data.matchups.matchups[0].teamA.team.name
                  }}</span>
                </div>
                <span class="text-[10px] font-bold text-muted">VS</span>
                <div class="flex flex-col items-center gap-2 text-center">
                  <TeamAvatar
                    :name="data.matchups.matchups[0].teamB.team.name"
                    :color="data.matchups.matchups[0].teamB.team.color"
                  /><span class="max-w-24 text-xs font-semibold">{{
                    data.matchups.matchups[0].teamB.team.name
                  }}</span>
                </div>
              </div>
            </div>
            <p v-else class="py-4 text-center text-xs text-muted">
              Pairings appear when a league has two or more teams.
            </p>
            <RouterLink
              to="/matchups"
              class="mt-5 flex items-center justify-between text-xs font-bold"
              >See all matchups <ArrowUpRight :size="15"
            /></RouterLink>
          </section>
        </div>
      </div> </template
  ></AsyncState>
</template>
