<script setup lang="ts">
import { ref, computed } from "vue";
import axios from "axios";

// defineProps<{ msg: string }>()

interface InputData {
  roomInfo: string;
  body: string;
  selfUnread: boolean;
}
interface RegisteredData {
  id: number;
  roomId: number;
  body: string;
  selfUnread: boolean;
}

const inputData = ref<InputData>({
  roomInfo: "https://www.chatwork.com/#!rid335028121",
  body: import.meta.env.VITE_APP_TITLE,
  selfUnread: false,
});
const registeredData = ref<RegisteredData[]>([]);

const roomId = computed((): number => {
  const roomInfo = inputData.value.roomInfo;
  if (roomInfo.startsWith("https://www.chatwork.com/#!rid")) {
    // チャット部屋のURLを指定していた場合はID部分を抽出
    return Number(roomInfo.replace(/.*rid([0-9]+)$/, "$1"));
  } else if (!roomInfo.match(/[^0-9]+/)) {
    // 部屋IDを直接指定していたらそのまま扱う
    return Number(roomInfo);
  } else {
    throw new Error('Error: Invalid input "roomInfo"');
  }
});
const sortedRegisteredData = computed(() => registeredData.value.sort((a: any, b: any) => (a.id < b.id ? 1 : -1)));

async function updateRegisteredData() {
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
  registeredData.value = dataArray;
}

function register() {
  axios
    .post("/api/db_add", {
      room_id: roomId.value,
      body: inputData.value.body,
      self_unread: inputData.value.selfUnread,
    })
    .then(() => {
      updateRegisteredData();
    })
    .catch((err) => {
      throw err;
    });
}

// 表示するための情報を集める
updateRegisteredData();
</script>

<template>
  <div>
    <table>
      <thead>
        <tr>
          <th>チャット部屋ID</th>
          <th>投稿予定文</th>
          <th>投稿者にとっても未読にするか</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><input v-model="inputData.roomInfo" /></td>
          <td><textarea v-model="inputData.body"></textarea></td>
          <td><input type="checkbox" v-model="inputData.selfUnread" /></td>
          <td><button @click="register">新規登録</button></td>
        </tr>
        <tr v-for="d in sortedRegisteredData" :key="d.id">
          <td>{{ d.roomId }}</td>
          <td>{{ d.body }}</td>
          <td>{{ d.selfUnread }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
