<script setup lang="ts">
import type { Tournament } from "@shared/types";
import { reactive, ref, watch, computed } from "vue";
import type { TournamentView } from "@shared/types";
import { tournamentApi } from "../api/tournamentApi";
import { errorMessage, notify } from "@/lib/notifications";
import UiDialog from "@/components/ui/UiDialog.vue";
import UiButton from "@/components/ui/UiButton.vue";
const props = defineProps<{
  open: boolean;
  tournament?: TournamentView;
  tournaments: TournamentView[];
}>();
const emit = defineEmits<{ close: []; saved: [tournament: TournamentView] }>();
/**
 * Creates the default editable tournament fields for a new tournament.
 *
 * @returns Editable tournament defaults without an ID, team count, or game count.
 */
const blank = (): Omit<Tournament, "tournamentID"> => ({
  name: "",
  type: "ladder" as "ladder" | "bracket" | "round-robin",
  parentTournamentID: null as number | null,
  semester: "Fall 2026",
  status: "upcoming" as "active" | "upcoming" | "completed",
  description: "",
  startDate: "2026-11-16",
  endDate: "2026-12-04",
  location: "Sports & Fitness Center · Courts 1–4",
});
const draft = reactive(blank());
const error = ref("");
const busy = ref(false);
const parents = computed(() =>
  props.tournaments.filter(
    (row) =>
      row.tournamentID !== props.tournament?.tournamentID &&
      row.semester === draft.semester,
  ),
);
watch(
  () => props.open,
  (value) => {
    if (value) {
      Object.assign(draft, blank(), props.tournament || {});
      error.value = "";
    }
  },
);
/**
 * Submits tournament fields and reports the saved record to the parent.
 *
 * @returns Resolves after the action completes; no result value is returned.
 */
async function save(): Promise<void> {
  busy.value = true;
  error.value = "";
  try {
    const result = await tournamentApi.save(
      draft,
      props.tournament?.tournamentID,
    );
    notify(
      props.tournament
        ? "Tournament updated."
        : "Tournament created. Add participating teams to get started.",
    );
    emit("saved", result);
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
    :title="tournament ? 'Edit tournament' : 'Create a tournament'"
    @close="emit('close')"
    ><form class="space-y-4" @submit.prevent="save">
      <div v-if="error" class="error-box" role="alert">{{ error }}</div>
      <label class="field"
        >Tournament name<input
          v-model="draft.name"
          required
          minlength="2"
          maxlength="80"
          placeholder="e.g. Fall Ladder League"
      /></label>
      <div class="grid grid-cols-2 gap-4">
        <label class="field"
          >Semester<input
            v-model="draft.semester"
            required
            maxlength="40"
            placeholder="Fall 2026" /></label
        ><label class="field"
          >Format<select v-model="draft.type">
            <option value="ladder">Ladder league</option>
            <option value="bracket">Bracket</option>
            <option value="round-robin">Round robin</option>
          </select></label
        >
      </div>
      <div class="grid grid-cols-2 gap-4">
        <label class="field"
          >Start date<input
            v-model="draft.startDate"
            type="date"
            required /></label
        ><label class="field"
          >End date<input
            v-model="draft.endDate"
            type="date"
            :min="draft.startDate"
            required
        /></label>
      </div>
      <label class="field"
        >Status<select v-model="draft.status">
          <option value="upcoming">Coming soon</option>
          <option value="active">In progress</option>
          <option value="completed">Completed</option>
        </select></label
      ><label class="field"
        >Parent tournament<select v-model="draft.parentTournamentID">
          <option :value="null">None · standalone tournament</option>
          <option
            v-for="parent in parents"
            :key="parent.tournamentID"
            :value="parent.tournamentID"
          >
            {{ parent.name }}
          </option></select
        ><span class="text-xs font-normal text-muted"
          >Optional. Choose a tournament in the same semester to create a
          division or stage.</span
        ></label
      ><label class="field"
        >Location<input
          v-model="draft.location"
          required
          maxlength="120" /></label
      ><label class="field"
        >Description<textarea
          v-model="draft.description"
          rows="3"
          maxlength="2000"
        ></textarea>
      </label>
      <div class="flex justify-end gap-3 pt-2">
        <UiButton variant="secondary" @click="emit('close')">Cancel</UiButton
        ><UiButton type="submit" :busy="busy">{{
          tournament ? "Save changes" : "Create tournament"
        }}</UiButton>
      </div>
    </form></UiDialog
  >
</template>
