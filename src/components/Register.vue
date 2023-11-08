<script setup lang="ts">
import { ref } from "vue";
import axios from "axios";

// defineProps<{ msg: string }>()

const body = ref("");
function chat() {
  axios
    .post("/api/chatwork_post_messages", {
      room_id: "335028121",
      body: body.value,
    })
    .catch((err) => {
      throw err;
    });
}
function addDB() {
  axios
    .post("/api/db_add", {
      room_id: "335028121",
      body: body.value,
    })
    .catch((err) => {
      throw err;
    });
}
</script>

<template>
  <dev>
    <textarea v-model="body"></textarea>
    <button @click="chat()">chat</button>
    <button @click="addDB()">addDB</button>
  </dev>
</template>
