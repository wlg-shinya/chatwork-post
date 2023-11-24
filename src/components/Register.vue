<script setup lang="ts">
import { ref, computed, watch } from "vue";
import axios from "axios";
import { RegisteredData, RegisteredDataUserInput } from "../types";
import { Condition, concreteCondition, restoreCondition } from "../condition";
import ConditionComponent from "./Condition.vue";

const props = defineProps<{
  apiToken: string;
}>();

interface InputData {
  roomInfo: string;
  body: string;
  selfUnread: boolean;
  postCondition: {
    name: string;
    class: Condition | null;
  };
}
interface WorkingData {
  id: number;
  api_token: string;
  editableData: InputData;
  editing: boolean;
}

const newInputData = ref<InputData>({
  roomInfo: "https://www.chatwork.com/#!rid335028121", // test data
  body: import.meta.env.VITE_APP_TITLE, // test data
  selfUnread: false,
  postCondition: {
    name: "",
    class: null,
  },
});
const workingData = ref<WorkingData[]>([]);

const sortedWorkingData = computed(() => workingData.value.sort((a: any, b: any) => (a.id < b.id ? 1 : -1)));

// APIトークンが更新されたら作業中データも更新
watch(
  () => props.apiToken,
  () => {
    updateWorkingData();
  }
);

// 登録済みデータを作業中データに反映させる
async function updateWorkingData() {
  try {
    const registeredData = await getRegisteredData();

    // 登録済みデータから削除されたものがまだ作業中データに残っていたら除外する
    workingData.value = workingData.value.filter((v) => registeredData.some((r) => r.id == v.id));

    registeredData.forEach((r: RegisteredData) => {
      // 編集可能データを構築
      const condition = restoreCondition(r.post_condition);
      const editableData: InputData = {
        roomInfo: r.room_id.toString(),
        body: r.body,
        selfUnread: r.self_unread,
        postCondition: {
          name: condition.name,
          class: concreteCondition(condition),
        },
      };
      // 作業中データ側に登録済みデータと一致するIDがあれば編集可能データのみの更新
      let foundIndex = -1;
      if (
        workingData.value.some((v, i) => {
          if (v.id == r.id) foundIndex = i;
          return v.id == r.id;
        })
      ) {
        const foundWorkingData = workingData.value[foundIndex];
        // 編集ではない作業中データのみ上書きすることで編集中のデータをリセットさせないようにする
        if (!foundWorkingData.editing) {
          foundWorkingData.editableData = editableData;
        }
      }
      // 初取得した登録済みデータなら作業中データに新規登録
      else {
        workingData.value.push({
          id: r.id,
          api_token: r.api_token,
          editableData: editableData,
          editing: false,
        });
      }
    });
  } catch (error) {
    // エラー情報はログに流すが処理は止めない
    console.error(error);
    return;
  }
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
    throw new Error(`roomInfo=${roomInfo}`);
  }
}

function register() {
  if (newInputData.value.postCondition.class == null) {
    throw new Error(`newInputData.value.postCondition.class=${newInputData.value.postCondition.class}`);
  }
  const data: RegisteredDataUserInput = {
    api_token: props.apiToken,
    room_id: getRoomId(newInputData.value.roomInfo),
    body: newInputData.value.body,
    self_unread: newInputData.value.selfUnread,
    post_condition: newInputData.value.postCondition.class.getData(),
  };
  axios
    .post("/api/db_register", data)
    .then(() => {
      updateWorkingData();
    })
    .catch((error) => {
      throw error;
    });
}

async function getRegisteredData(): Promise<RegisteredData[]> {
  if (!props.apiToken) {
    throw new Error(`props.apiToken = ${props.apiToken}`);
  }
  const dataArray: RegisteredData[] = [];
  await axios
    .get("/api/db_register", {
      params: {
        api_token: props.apiToken,
      },
    })
    .then((response: any) => {
      const data = JSON.parse(JSON.stringify(response.data));
      if (data.length > 0) {
        data.forEach((x: any) => {
          dataArray.push({
            id: x.id,
            api_token: x.api_token,
            room_id: x.room_id,
            body: x.body,
            self_unread: x.self_unread,
            post_condition: x.post_condition,
          });
        });
      }
    })
    .catch((error) => {
      throw error;
    });
  return dataArray;
}

function updateRegisteredData(data: WorkingData) {
  if (data.editableData.postCondition.class == null) {
    throw new Error(`data.editableData.postCondition.class=${data.editableData.postCondition.class}`);
  }
  const putData: RegisteredData = {
    id: data.id,
    api_token: data.api_token,
    room_id: getRoomId(data.editableData.roomInfo),
    body: data.editableData.body,
    self_unread: data.editableData.selfUnread,
    post_condition: data.editableData.postCondition.class.getData(),
  };
  axios
    .put("/api/db_register", putData)
    .then(() => {
      updateWorkingData();
      // 編集終了
      data.editing = false;
    })
    .catch((error) => {
      throw error;
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
    .catch((error) => {
      throw error;
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
</script>

<template>
  <template v-if="apiToken">
    <table>
      <thead>
        <tr>
          <th>投稿先チャット部屋ID</th>
          <th>投稿予定文</th>
          <th>投稿者にとっても未読にするか</th>
          <th>投稿する条件</th>
          <th colspan="2"></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><input v-model="newInputData.roomInfo" placeholder="IDかURLを入力してください" /></td>
          <td><textarea v-model="newInputData.body"></textarea></td>
          <td><input type="checkbox" v-model="newInputData.selfUnread" /></td>
          <td>
            <ConditionComponent
              :condition="newInputData.postCondition.class"
              :editting="true"
              @onSelectedCondition="newInputData.postCondition.class = concreteCondition($event)"
            />
          </td>
          <td colspan="2"><button @click="register">新規登録</button></td>
        </tr>
        <tr v-for="d in sortedWorkingData" :key="d.id">
          <template v-if="d.editing">
            <td><input v-model="d.editableData.roomInfo" /></td>
            <td><textarea v-model="d.editableData.body"></textarea></td>
            <td><input type="checkbox" v-model="d.editableData.selfUnread" /></td>
            <td>
              <ConditionComponent
                :condition="d.editableData.postCondition.class"
                :editting="d.editing"
                @onSelectedCondition="d.editableData.postCondition.class = concreteCondition($event)"
              />
            </td>
            <td><button @click="updateRegisteredData(d)">更新</button></td>
            <td><button @click="cancelEdit(d)">キャンセル</button></td>
          </template>
          <template v-else>
            <td>{{ d.editableData.roomInfo }}</td>
            <td>{{ d.editableData.body }}</td>
            <td>{{ d.editableData.selfUnread }}</td>
            <td>
              <ConditionComponent :condition="d.editableData.postCondition.class" :editting="d.editing" />
            </td>
            <td><button @click="startEdit(d)">編集</button></td>
            <td><button @click="deleteRegisteredData(d.id)">削除</button></td>
          </template>
        </tr>
      </tbody>
    </table>
  </template>
</template>
