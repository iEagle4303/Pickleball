<script setup lang="ts">
defineProps<{ status: string }>();
</script>
<template>
  <span
    :class="[
      'badge',
      status === 'active'
        ? 'badge-active'
        : status === 'upcoming'
          ? 'badge-upcoming'
          : 'badge-completed',
    ]"
    ><span
      v-if="status === 'active'"
      class="size-1.5 rounded-full bg-current"
    ></span
    >{{
      status === "active"
        ? "In progress"
        : status === "upcoming"
          ? "Coming soon"
          : "Completed"
    }}</span
  >
</template>
