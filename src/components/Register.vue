<script setup lang="ts">
import { ref, computed } from "vue";
import axios from "axios";

// defineProps<{ msg: string }>()

interface RegisteredData {
  id: number;
  roomId: number;
  body: string;
  selfUnread: boolean;
}

const registeredData = ref<RegisteredData[]>([]);
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

async function getRegisteredData() {
  const dataArray: RegisteredData[] = [];
  await axios
    .get("/api/db_get_all")
    .then((response: any) => {
      const data = JSON.parse(JSON.stringify(response.data));
      if (data.length > 0) {
        data.forEach((x: any) => {
          dataArray.push({
            id: x.id,
            roomId: x.room_id,
            body: x.body,
            selfUnread: x.self_unread,
          });
        });
      }
    })
    .catch((err) => {
      throw err;
    });
  return dataArray;
}

registeredData.value = await getRegisteredData();
</script>

<template>
  <div>
    <input v-model="roomUrl" />
    <textarea v-model="body"></textarea>
    <button @click="chat()">chat</button>
    <button @click="addDB()">addDB</button>

    <table>
      <thead>
        <tr>
          <th>チャット部屋ID</th>
          <th>投稿予定文</th>
          <th>投稿者にとっても未読にするか</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="d in registeredData" :key="d.id">
          <td>{{ d.roomId }}</td>
          <td>{{ d.body }}</td>
          <td>{{ d.selfUnread }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
