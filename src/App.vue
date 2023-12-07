<script setup lang="ts">
import { ref } from "vue";
import SignIn from "./components/SignIn.vue";
import Register from "./components/Register.vue";

const APP_TITLE = `${import.meta.env.VITE_APP_TITLE} version ${__APP_VERSION__}`;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

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
    <div class="card-footer">
      <ul>
        <li>〇〇って条件で投稿したい！</li>
        <li>〇〇な機能に対応してほしい！</li>
      </ul>
      <span>ご要望は Chatwork 上で {{ ADMIN_EMAIL }} にコンタクトください</span>
    </div>
  </div>
</template>
