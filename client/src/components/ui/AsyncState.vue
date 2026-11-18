<script setup lang="ts">
import { LoaderCircle, AlertCircle } from "lucide-vue-next";
defineProps<{ loading?: boolean; error?: string }>();
defineEmits<{ retry: [] }>();
</script>
<template>
  <div
    v-if="loading"
    class="flex min-h-48 items-center justify-center gap-3 text-muted"
    role="status"
  >
    <LoaderCircle class="animate-spin" :size="20" /> Loading the clubhouse…
  </div>
  <div v-else-if="error" class="panel p-8 text-center" role="alert">
    <AlertCircle class="mx-auto mb-3 text-rose-500" />
    <p class="mb-4">{{ error }}</p>
    <button class="btn btn-secondary" @click="$emit('retry')">Try again</button>
  </div>
  <slot v-else />
</template>
