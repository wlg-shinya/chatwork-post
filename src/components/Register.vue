<script setup lang="ts">
import { ref } from "vue";

// defineProps<{ msg: string }>()

const body = ref("");
</script>

<template>
  <dev>
    <textarea v-model="body"></textarea>
  </dev>
</template>
