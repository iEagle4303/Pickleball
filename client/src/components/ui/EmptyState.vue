<script setup lang="ts">
import { CircleDashed } from "lucide-vue-next";
defineProps<{ title: string; description?: string }>();
</script>
<template>
  <div class="py-14 text-center">
    <CircleDashed class="mx-auto mb-3 text-muted" :size="32" />
    <h3 class="font-semibold">{{ title }}</h3>
    <p v-if="description" class="mx-auto mt-2 max-w-md text-sm text-muted">
      {{ description }}
    </p>
    <div class="mt-4"><slot /></div>
  </div>
</template>
