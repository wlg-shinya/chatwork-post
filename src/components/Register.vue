<script setup lang="ts">
import { ref } from "vue";

// defineProps<{ msg: string }>()

const APP_TITLE = ref(import.meta.env.VITE_APP_TITLE);
</script>

<template>
  <dev>{{ APP_TITLE }}</dev>
</template>
