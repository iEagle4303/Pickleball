<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "ghost" | "danger";
    busy?: boolean;
    type?: "button" | "submit" | "reset";
  }>(),
  { variant: "primary", type: "button" },
);
</script>
<template>
  <button
    :type="type"
    :disabled="busy"
    :class="['btn', 'btn-' + variant]"
    :aria-busy="busy"
  >
    <span v-if="busy" class="spinner size-4" aria-hidden="true"></span><slot />
  </button>
</template>
