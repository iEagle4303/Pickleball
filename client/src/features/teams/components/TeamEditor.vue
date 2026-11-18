<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { TeamView } from "@shared/types";
import { teamApi } from "../api/teamApi";
import { notify, errorMessage } from "@/lib/notifications";
import UiDialog from "@/components/ui/UiDialog.vue";
import UiButton from "@/components/ui/UiButton.vue";
const props = defineProps<{ open: boolean; team?: TeamView }>();
const emit = defineEmits<{ close: []; saved: [team: TeamView] }>();
const draft = reactive({ name: "", color: "lime" });
const busy = ref(false);
const error = ref("");
watch(
  () => props.open,
  (value) => {
    if (value) {
      draft.name = props.team?.name || "";
      draft.color = props.team?.color || "lime";
      error.value = "";
    }
  },
);
/**
 * Submits team details and notifies the parent when the team has been saved.
 *
 * @returns Resolves after the action completes; no result value is returned.
 */
async function save(): Promise<void> {
  busy.value = true;
  error.value = "";
  try {
    const team = await teamApi.save(draft, props.team?.teamID);
    notify(
      props.team
        ? "Team updated."
        : "Your team is ready. Find your doubles partner!",
    );
    emit("saved", team);
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
    :title="team ? 'Edit your team' : 'Create your team'"
    @close="emit('close')"
    ><form class="space-y-5" @submit.prevent="save">
      <p v-if="!team" class="text-sm text-muted">
        It starts with a name. You’ll be added as your team’s first player.
      </p>
      <div v-if="error" class="error-box" role="alert">{{ error }}</div>
      <label class="field"
        >Team name<input
          v-model="draft.name"
          required
          minlength="2"
          maxlength="80"
          placeholder="Give your team a little personality" /></label
      ><label class="field"
        >Team color<select v-model="draft.color">
          <option value="lime">Court lime</option>
          <option value="blue">Sky blue</option>
          <option value="orange">Sunset orange</option>
          <option value="purple">Lilac</option>
          <option value="teal">Club teal</option>
          <option value="rose">Rose</option>
        </select></label
      >
      <div class="flex justify-end gap-3">
        <UiButton variant="secondary" @click="emit('close')">Cancel</UiButton
        ><UiButton :busy="busy" type="submit">{{
          team ? "Save changes" : "Create team"
        }}</UiButton>
      </div>
    </form></UiDialog
  >
</template>
