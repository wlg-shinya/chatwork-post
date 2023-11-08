<script setup lang="ts">
import { ref, computed } from "vue";
import axios from "axios";

// defineProps<{ msg: string }>()

const roomUrl = ref("https://www.chatwork.com/#!rid335028121");
const body = ref(import.meta.env.VITE_APP_TITLE);

const roomId = computed(() => roomUrl.value.replace(/.*rid([0-9]+)$/, "$1"));

function chat() {
  axios
    .post("/api/chatwork_post_message", {
      room_id: roomId.value,
      body: body.value,
    })
    .catch((err) => {
      throw err;
    });
}
function addDB() {
  axios
    .post("/api/db_add", {
      room_id: roomId.value,
      body: body.value,
    })
    .catch((err) => {
      throw err;
    });
}
</script>

<template>
  <dev>
    <input v-model="roomUrl" />
    <textarea v-model="body"></textarea>
    <button @click="chat()">chat</button>
    <button @click="addDB()">addDB</button>
  </dev>
</template>
