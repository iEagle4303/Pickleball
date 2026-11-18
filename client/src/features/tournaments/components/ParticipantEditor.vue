<script setup lang="ts">
import { ref, watch } from "vue";
import type { TeamView } from "@shared/types";
import { tournamentApi } from "../api/tournamentApi";
import { errorMessage, notify } from "@/lib/notifications";
import UiDialog from "@/components/ui/UiDialog.vue";
import UiButton from "@/components/ui/UiButton.vue";
import AsyncState from "@/components/ui/AsyncState.vue";
const props = defineProps<{
  open: boolean;
  tournamentID: number;
  selectedIDs: number[];
}>();
const emit = defineEmits<{ close: []; saved: [] }>();
const teams = ref<TeamView[]>([]);
const selected = ref<number[]>([]);
const loading = ref(false);
const busy = ref(false);
const error = ref("");
/**
 * Loads teams available for tournament participation management.
 *
 * @returns Resolves after the action completes; no result value is returned.
 */
async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    teams.value = await tournamentApi.teams();
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
}
watch(
  () => props.open,
  (value) => {
    if (value) {
      selected.value = [...props.selectedIDs];
      load();
    }
  },
);
/**
 * Saves participating team IDs and notifies the tournament page.
 *
 * @returns Resolves after the action completes; no result value is returned.
 */
async function save(): Promise<void> {
  busy.value = true;
  error.value = "";
  try {
    await tournamentApi.participants(props.tournamentID, selected.value);
    notify("Participating teams updated.");
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
    title="Manage participating teams"
    @close="emit('close')"
    ><p class="mb-5 text-sm text-muted">
      Select teams for this tournament. Teams with recorded results must remain
      in the league.
    </p>
    <div v-if="error && !loading" class="error-box mb-4" role="alert">
      {{ error }}
    </div>
    <AsyncState :loading="loading"
      ><div class="max-h-80 space-y-2 overflow-y-auto">
        <label
          v-for="team in teams"
          :key="team.teamID"
          class="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3"
          ><input
            v-model="selected"
            type="checkbox"
            :value="team.teamID"
          /><span
            >{{ team.name
            }}<span class="mt-1 block text-xs font-normal text-muted">{{
              team.members.map((row) => row.displayName).join(" & ") ||
              "No members"
            }}</span></span
          ></label
        >
      </div></AsyncState
    >
    <div class="mt-6 flex justify-end gap-3">
      <UiButton variant="secondary" @click="emit('close')">Cancel</UiButton
      ><UiButton :busy="busy" :disabled="loading" @click="save"
        >Save teams ({{ selected.length }})</UiButton
      >
    </div></UiDialog
  >
</template>
