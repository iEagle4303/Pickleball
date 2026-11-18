<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from "vue";
import { X } from "lucide-vue-next";
const props = defineProps<{ open: boolean; title: string }>();
const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement>();
watch(
  () => props.open,
  async (value) => {
    await nextTick();
    if (value && !dialog.value?.open) dialog.value?.showModal();
    else if (!value && dialog.value?.open) dialog.value.close();
  },
);
onBeforeUnmount(() => dialog.value?.close());
</script>
<template>
  <dialog
    ref="dialog"
    class="modal"
    :aria-label="title"
    @cancel.prevent="emit('close')"
    @click="
      (event) => {
        if (event.target === dialog) emit('close');
      }
    "
  >
    <div
      class="flex items-center justify-between gap-4 border-b border-line px-6 py-5"
    >
      <h2 class="text-xl font-bold">{{ title }}</h2>
      <button
        class="icon-btn"
        type="button"
        aria-label="Close dialog"
        @click="emit('close')"
      >
        <X :size="20" />
      </button>
    </div>
    <div class="p-6"><slot /></div>
  </dialog>
</template>
