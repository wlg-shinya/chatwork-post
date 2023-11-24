<script setup lang="ts">
import { ref } from "vue";
import SignIn from "./components/SignIn.vue";
import Register from "./components/Register.vue";

const APP_TITLE = `${import.meta.env.VITE_APP_TITLE} version ${__APP_VERSION__}`;

const apiToken = ref("");
</script>

<template>
  <h1>{{ APP_TITLE }}</h1>
  <SignIn @onUpdateApiToken="apiToken = $event" />
  <Suspense>
    <Register :apiToken="apiToken" />
  </Suspense>
</template>
