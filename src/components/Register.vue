<script setup lang="ts">
import { ref, computed } from "vue";
import axios from "axios";
import Condition from "../condition/condition-interface";
import ConditionComponent from "./Condition.vue";
import DaysLaterCondition from "../condition/dayslater-condition";

interface RegisteredData {
  id: number;
  room_id: number;
  body: string;
  self_unread: boolean;
}
interface InputData {
  roomInfo: string;
  body: string;
  selfUnread: boolean;
  postCondition: Condition;
}
interface WorkingData {
  id: number;
  editableData: InputData;
  editing: boolean;
}

const newInputData = ref<InputData>({
  roomInfo: "https://www.chatwork.com/#!rid335028121", // test data
  body: import.meta.env.VITE_APP_TITLE, // test data
  selfUnread: false,
  postCondition: new DaysLaterCondition(0, "10:00"),
});
const workingData = ref<WorkingData[]>([]);

const sortedWorkingData = computed(() => workingData.value.sort((a: any, b: any) => (a.id < b.id ? 1 : -1)));

async function updateWorkingData() {
  // 登録済みデータを表示用データに反映させる
  (await getRegisteredDataAll()).forEach((r: RegisteredData) => {
    const editableData: InputData = {
      roomInfo: r.room_id.toString(),
      body: r.body,
      selfUnread: r.self_unread,
      postCondition: new DaysLaterCondition(0, "10:00"),
    };
    // 表示用データ側に登録済みデータと一致するIDがあれば編集可能データのみの更新
    let foundIndex = -1;
    if (
      workingData.value.some((v, i) => {
        if (v.id == r.id) foundIndex = i;
        return v.id == r.id;
      })
    ) {
      const foundWorkingData = workingData.value[foundIndex];
      // ただし編集中なら上書きせずに表示用データを維持する
      if (!foundWorkingData.editing) {
        foundWorkingData.editableData = editableData;
      }
    }
    // 初取得した登録済みデータなら表示用データに新規登録
    else {
      workingData.value.push({
        id: r.id,
        editableData: editableData,
        editing: false,
      });
    }
  });
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
      updateWorkingData();
    })
    .catch((err) => {
      throw err;
    });
}

async function getRegisteredDataAll(): Promise<RegisteredData[]> {
  const dataArray: RegisteredData[] = [];
  await axios
    .get("/api/db_register")
    .then((response: any) => {
      const data = JSON.parse(JSON.stringify(response.data));
      if (data.length > 0) {
        data.forEach((x: any) => {
          dataArray.push({
            id: x.id,
            room_id: x.room_id,
            body: x.body,
            self_unread: x.self_unread,
          });
        });
      }
    })
    .catch((err) => {
      throw err;
    });
  return dataArray;
}

function updateRegisteredData(data: WorkingData) {
  axios
    .put("/api/db_register", {
      id: data.id,
      room_id: getRoomId(data.editableData.roomInfo),
      body: data.editableData.body,
      self_unread: data.editableData.selfUnread,
    })
    .then(() => {
      updateWorkingData();
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
      updateWorkingData();
    })
    .catch((err) => {
      throw err;
    });
}

function startEdit(data: WorkingData) {
  data.editing = true;
}

function cancelEdit(data: WorkingData) {
  data.editing = false;
  // 登録済み情報を更新することで編集したデータを破棄
  updateWorkingData();
}

// ページ表示や更新のときに行う処理
updateWorkingData();
</script>

<template>
  <div>
    <table>
      <thead>
        <tr>
          <th>チャット部屋ID</th>
          <th>投稿予定文</th>
          <th>投稿者にとっても未読にするか</th>
          <th>投稿条件</th>
          <th colspan="2"></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><input v-model="newInputData.roomInfo" /></td>
          <td><textarea v-model="newInputData.body"></textarea></td>
          <td><input type="checkbox" v-model="newInputData.selfUnread" /></td>
          <td>
            <ConditionComponent :condition="newInputData.postCondition" :editting="true" />
          </td>
          <td colspan="2"><button @click="register">新規登録</button></td>
        </tr>
        <tr v-for="d in sortedWorkingData" :key="d.id">
          <template v-if="d.editing">
            <td><input v-model="d.editableData.roomInfo" /></td>
            <td><textarea v-model="d.editableData.body"></textarea></td>
            <td><input type="checkbox" v-model="d.editableData.selfUnread" /></td>
            <td>
              <ConditionComponent :condition="d.editableData.postCondition" :editting="d.editing" />
            </td>
            <td><button @click="updateRegisteredData(d)">更新</button></td>
            <td><button @click="cancelEdit(d)">キャンセル</button></td>
          </template>
          <template v-else>
            <td>{{ d.editableData.roomInfo }}</td>
            <td>{{ d.editableData.body }}</td>
            <td>{{ d.editableData.selfUnread }}</td>
            <td>
              <ConditionComponent :condition="d.editableData.postCondition" :editting="d.editing" />
            </td>
            <td><button @click="startEdit(d)">編集</button></td>
            <td><button @click="deleteRegisteredData(d.id)">削除</button></td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>
