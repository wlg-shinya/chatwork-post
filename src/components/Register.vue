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
  editableData: InputData;
  editing: boolean;
}

const newInputData = ref<InputData>({
  roomInfo: "https://www.chatwork.com/#!rid335028121",
  body: import.meta.env.VITE_APP_TITLE,
  selfUnread: false,
});
const registeredData = ref<RegisteredData[]>([]);

const sortedRegisteredData = computed(() => registeredData.value.sort((a: any, b: any) => (a.id < b.id ? 1 : -1)));

async function updateViewData() {
  registeredData.value = await getRegisteredData();
}

function getRoomId(roomInfo: string | number): number {
  if (typeof roomInfo === "number") {
    // 数値の場合はそのまま扱う
    return roomInfo;
  } else if (roomInfo.startsWith("https://www.chatwork.com/#!rid")) {
    // チャット部屋のURLを指定していた場合はID部分を抽出
    return Number(roomInfo.replace(/.*rid([0-9]+)$/, "$1"));
  } else if (!roomInfo.match(/[^0-9]+/)) {
    // 部屋IDを直接文字列指定していたらそのまま扱う
    return Number(roomInfo);
  } else {
    throw new Error('Invalid input "roomInfo"');
  }
}

function register() {
  axios
    .post("/api/db_register", {
      room_id: getRoomId(newInputData.value.roomInfo),
      body: newInputData.value.body,
      self_unread: newInputData.value.selfUnread,
    })
    .then(() => {
      updateViewData();
    })
    .catch((err) => {
      throw err;
    });
}

async function getRegisteredData(): Promise<RegisteredData[]> {
  const dataArray: RegisteredData[] = [];
  await axios
    .get("/api/db_register")
    .then((response: any) => {
      const data = JSON.parse(JSON.stringify(response.data));
      if (data.length > 0) {
        data.forEach((x: any) => {
          dataArray.push({
            id: x.id,
            editableData: {
              roomInfo: x.room_id,
              body: x.body,
              selfUnread: x.self_unread,
            },
            editing: false,
          });
        });
      }
    })
    .catch((err) => {
      throw err;
    });
  return dataArray;
}

function updateRegisteredData(data: RegisteredData) {
  axios
    .put("/api/db_register", {
      id: data.id,
      room_id: getRoomId(data.editableData.roomInfo),
      body: data.editableData.body,
      self_unread: data.editableData.selfUnread,
    })
    .then(() => {
      updateViewData();
    })
    .catch((err) => {
      throw err;
    });
}

function deleteRegisteredData(id: number) {
  axios
    .delete("/api/db_register", {
      data: {
        id: id,
      },
    })
    .then(() => {
      updateViewData();
    })
    .catch((err) => {
      throw err;
    });
}

function startEdit(data: RegisteredData) {
  data.editing = true;
}

function cancelEdit(data: RegisteredData) {
  data.editing = false;
  // 登録済み情報を更新することで編集したデータを破棄
  updateViewData();
}

// ページ表示や更新のときに行う処理
updateViewData();
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
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><input v-model="newInputData.roomInfo" /></td>
          <td><textarea v-model="newInputData.body"></textarea></td>
          <td><input type="checkbox" v-model="newInputData.selfUnread" /></td>
          <td><button @click="register">新規登録</button></td>
        </tr>
        <tr v-for="d in sortedRegisteredData" :key="d.id">
          <td v-if="d.editing"><input v-model="d.editableData.roomInfo" /></td>
          <td v-else>{{ d.editableData.roomInfo }}</td>
          <td v-if="d.editing"><textarea v-model="d.editableData.body"></textarea></td>
          <td v-else>{{ d.editableData.body }}</td>
          <td v-if="d.editing"><input type="checkbox" v-model="d.editableData.selfUnread" /></td>
          <td v-else>{{ d.editableData.selfUnread }}</td>
          <td v-if="d.editing"><button @click="updateRegisteredData(d)">更新</button></td>
          <td v-else><button @click="startEdit(d)">編集</button></td>
          <td v-if="d.editing"><button @click="cancelEdit(d)">キャンセル</button></td>
          <td v-else><button @click="deleteRegisteredData(d.id)">削除</button></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
