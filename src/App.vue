<script setup lang="ts">
import { ref } from "vue";
import SignIn from "./components/SignIn.vue";
import Register from "./components/Register.vue";

const APP_TITLE = `${import.meta.env.VITE_APP_TITLE} version ${__APP_VERSION__}`;

const apiToken = ref("");
</script>

<template>
  <div class="card">
    <div class="card-header">
      <h1 class="text-center">{{ APP_TITLE }}</h1>
    </div>
    <div class="card-body">
      <SignIn @onUpdateApiToken="apiToken = $event" />
      <Suspense>
        <Register :apiToken="apiToken" />
      </Suspense>
    </div>
  </div>
</template>
