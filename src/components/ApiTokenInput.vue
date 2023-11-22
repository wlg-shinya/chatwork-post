<script setup lang="ts">
import { ref, watchEffect } from "vue";

const emit = defineEmits<{
  onInputApiToken: [token: string];
}>();

const apiToken = ref("");

watchEffect(() => {
  emit("onInputApiToken", apiToken.value);
});
</script>

<template>
  <label for="api-token">投稿したいアカウントの Chatwork API トークンを入力してください</label>
  <input id="api-token" v-model="apiToken" />
</template>
