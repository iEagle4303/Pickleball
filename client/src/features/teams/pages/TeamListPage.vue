<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { Plus, Search, ArrowUpRight, Users } from "lucide-vue-next";
import { teamApi } from "../api/teamApi";
import { useResource } from "@/lib/useResource";
import { useAuthStore } from "@/features/auth/stores/authStore";
import AsyncState from "@/components/ui/AsyncState.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import TeamAvatar from "@/components/ui/TeamAvatar.vue";
import TeamEditor from "../components/TeamEditor.vue";
const { data, loading, error, reload } = useResource(teamApi.list);
const auth = useAuthStore();
const router = useRouter();
const query = ref("");
const available = ref(false);
const editor = ref(false);
const filtered = computed(() =>
  (data.value || []).filter(
    (team) =>
      (!available.value || team.members.length < 2) &&
      [team.name, ...team.members.map((member) => member.displayName)]
        .join(" ")
        .toLowerCase()
        .includes(query.value.toLowerCase()),
  ),
);
</script>
<template>
  <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="eyebrow mb-2">Find your doubles partner</p>
      <h1 class="page-title">Better as a team.</h1>
      <p class="page-subtitle">
        Meet the duos making their mark. Or start a little dynasty of your own.
      </p>
    </div>
    <button v-if="auth.user" class="btn btn-primary" @click="editor = true">
      <Plus :size="17" />Create a team</button
    ><RouterLink v-else to="/register" class="btn btn-primary"
      ><Users :size="16" />Join the club</RouterLink
    >
  </div>
  <div class="panel mb-6 flex flex-wrap items-center gap-4 p-4">
    <label class="relative min-w-48 flex-1"
      ><span class="sr-only">Search teams or players</span
      ><Search class="absolute left-3 top-3 text-muted" :size="16" /><input
        v-model="query"
        class="!pl-10"
        placeholder="Search teams or players…" /></label
    ><label class="flex cursor-pointer items-center gap-2 text-xs"
      ><input v-model="available" type="checkbox" />Looking for a partner</label
    >
  </div>
  <AsyncState :loading="loading" :error="error" @retry="reload"
    ><div
      v-if="filtered.length"
      class="grid gap-5 md:grid-cols-2 2xl:grid-cols-3"
    >
      <RouterLink
        v-for="team in filtered"
        :key="team.teamID"
        :to="'/teams/' + team.teamID"
        class="panel group p-6 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5"
        ><div class="mb-5 flex justify-between">
          <TeamAvatar
            :name="team.name"
            :color="team.color"
            large
          /><ArrowUpRight class="text-muted group-hover:text-ink" :size="19" />
        </div>
        <h2 class="text-lg font-bold">{{ team.name }}</h2>
        <p class="mt-2 min-h-10 text-xs leading-relaxed text-muted">
          {{
            team.members.map((member) => member.displayName).join(" & ") ||
            "A new team, ready for players."
          }}
        </p>
        <span v-if="team.members.length < 2" class="badge badge-active mt-2"
          >Open spot · join this team</span
        >
        <div
          class="mt-5 grid grid-cols-3 border-t border-line pt-5 text-center"
        >
          <div>
            <p class="text-lg font-bold">{{ team.wins }}</p>
            <p class="mt-1 text-[10px] text-muted">Wins</p>
          </div>
          <div class="border-x border-line">
            <p class="text-lg font-bold">{{ team.losses }}</p>
            <p class="mt-1 text-[10px] text-muted">Losses</p>
          </div>
          <div>
            <p class="text-lg font-bold">
              {{ team.winPercentage.toFixed(0) }}<span class="text-xs">%</span>
            </p>
            <p class="mt-1 text-[10px] text-muted">Win rate</p>
          </div>
        </div></RouterLink
      >
    </div>
    <EmptyState
      v-else
      title="No teams found"
      description="Try another name, clear the filters, or create your own team."
      ><button
        class="btn btn-secondary"
        @click="
          query = '';
          available = false;
        "
      >
        Clear filters
      </button></EmptyState
    ></AsyncState
  ><TeamEditor
    :open="editor"
    @close="editor = false"
    @saved="(team) => router.push('/teams/' + team.teamID)"
  />
</template>
