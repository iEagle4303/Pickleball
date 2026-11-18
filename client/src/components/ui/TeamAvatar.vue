<script setup lang="ts">
import { initials } from "@/lib/format";
withDefaults(defineProps<{ name: string; color?: string; large?: boolean }>(), {
  color: "lime",
});
</script>
<template>
  <span
    :class="[
      'team-avatar',
      'avatar-' + color,
      large ? 'size-14 text-lg' : 'size-10 text-xs',
    ]"
    aria-hidden="true"
    >{{ initials(name) }}</span
  >
</template>
