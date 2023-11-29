<script setup lang="ts">
import { ref, computed, watch, watchEffect } from "vue";
import axios from "axios";
import { Toast } from "bootstrap";
import { RegisteredData, RegisteredDataUserInput } from "../types";
import { Condition, concreteCondition, restoreCondition } from "../condition";
import ConditionComponent from "./Condition.vue";
import ToRoomMemberSelector from "./ToRoomMemberSelector.vue";

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
  roomInfo: "https://www.chatwork.com/#!rid335028121", // TEST:
  body: "",
  selfUnread: false,
  postCondition: {
    name: "",
    class: null,
  },
});
const workingData = ref<WorkingData[]>([]);
const roomNameTable = ref<Record<string, string>>({});

const sortedWorkingData = computed(() => workingData.value.sort((a: any, b: any) => (a.id < b.id ? 1 : -1)));

// APIトークンが更新されたら作業中データも更新
watch(
  () => props.apiToken,
  () => updateWorkingData()
);

// 部屋情報から部屋名をテーブル化して後から参照できるようにする
watchEffect(() => {
  workingData.value.forEach(async (x) => {
    roomNameTable.value[x.editableData.roomInfo] = await getRoomName(x.editableData.roomInfo);
  });
});

// 登録済みデータを作業中データに反映させる
async function updateWorkingData() {
  try {
    // 登録済みデータをもとにした未編集の作業中データを構築
    const registeredData = await getRegisteredData();
    const noEdittingWorkingData = registeredData.map((r): WorkingData => {
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
      return {
        id: r.id,
        api_token: r.api_token,
        editableData: editableData,
        editing: false,
      };
    });

    // 編集中の作業中データを覚えておく
    const edittingWorkingData: WorkingData[] = workingData.value.filter((w) => w.editing);

    // 未編集データと編集中データを考慮して作業中データの新規構築
    if (noEdittingWorkingData.length > 0) {
      if (edittingWorkingData.length > 0) {
        // 未編集データも編集中のデータもある場合
        // 編集中データと未編集データを合わせて作業中データとする
        workingData.value = noEdittingWorkingData.map((n) => {
          const find = edittingWorkingData.find((e) => e.id == n.id);
          return find ? find : n;
        });
      } else {
        // 編集中データがない場合は未編集データすべてを作業中データとする
        workingData.value = noEdittingWorkingData;
      }
    } else {
      // 未編集データも編集中のデータもない場合は作業中データは空にしておく
      workingData.value = [];
    }
  } catch (error) {
    // エラー情報はログに流すが処理は止めない
    console.error(error);
    return;
  }
}

function getRoomId(roomInfo: string): number {
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

async function getRoomName(roomInfo: string): Promise<string> {
  let name = "";
  try {
    const roomId = getRoomId(roomInfo);
    await axios
      .get("/api/chatwork_room", {
        params: {
          api_token: props.apiToken,
          room_id: roomId,
        },
      })
      .then((response: any) => {
        const data = JSON.parse(JSON.stringify(response.data));
        switch (data.type) {
          case "my":
            name = "マイチャット";
            break;
          case "direct":
            name = `DM:${data.name}`;
            break;
          case "group":
          default:
            name = data.name;
            break;
        }
      })
      .catch((error) => {
        throw error;
      });
  } catch (error) {
    // エラー情報はログに流すが処理は止めない
    console.error(error);
    name = "ERROR";
  }
  return name;
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

function notifyWarning(delegate: Function) {
  const toastEl = document.getElementById("toastWarning");
  if (!toastEl) return;
  const toast = Toast.getOrCreateInstance(toastEl);
  const buttonEl = document.getElementById("delete");
  if (!buttonEl) return;

  // 指定関数の登録
  buttonEl.addEventListener("click", () => {
    delegate();
    toast.hide(); // 実行後はトーストを閉じる
  });

  // トースト表示
  toast.show();
}
</script>

<template>
  <template v-if="apiToken">
    <table class="table table-hover align-middle text-center">
      <thead>
        <tr>
          <th class="col-2">投稿先チャット部屋</th>
          <th class="col-auto">投稿予定文</th>
          <!-- <th class="col-1">投稿者にとっても未読にするか</th> -->
          <th class="col-3">投稿する条件</th>
          <th class="col-2" colspan="2"></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <input v-model="newInputData.roomInfo" placeholder="IDかURLを入力してください" class="input-room-info form-control" />
          </td>
          <td>
            <ToRoomMemberSelector
              :apiToken="apiToken"
              :roomId="getRoomId(newInputData.roomInfo)"
              @onDecideToRoomMember="newInputData.body += $event"
            />
            <textarea v-model="newInputData.body" class="input-body form-control"></textarea>
          </td>
          <!-- <td>
            <div class="form-switch">
              <input type="checkbox" v-model="newInputData.selfUnread" class="form-check-input" />
            </div>
          </td> -->
          <td>
            <ConditionComponent
              :condition="newInputData.postCondition.class"
              :editting="true"
              @onSelectedCondition="newInputData.postCondition.class = concreteCondition($event)"
            />
          </td>
          <td colspan="2"><button @click="register" class="btn btn-primary">新規登録</button></td>
        </tr>
        <tr v-for="d in sortedWorkingData" :key="d.id">
          <template v-if="d.editing">
            <td><input v-model="d.editableData.roomInfo" placeholder="IDかURLを入力してください" class="input-room-info form-control" /></td>
            <td>
              <ToRoomMemberSelector
                :apiToken="apiToken"
                :roomId="getRoomId(d.editableData.roomInfo)"
                @onDecideToRoomMember="d.editableData.body += $event"
              />
              <textarea v-model="d.editableData.body" class="input-body form-control"></textarea>
            </td>
            <!-- <td>
              <div class="form-switch">
                <input type="checkbox" v-model="d.editableData.selfUnread" class="form-check-input" />
              </div>
            </td> -->
            <td>
              <ConditionComponent
                :condition="d.editableData.postCondition.class"
                :editting="d.editing"
                @onSelectedCondition="d.editableData.postCondition.class = concreteCondition($event)"
              />
            </td>
            <td><button @click="updateRegisteredData(d)" class="btn btn-primary">更新</button></td>
            <td><button @click="cancelEdit(d)" class="btn btn-outline-primary">キャンセル</button></td>
          </template>
          <template v-else>
            <td>{{ roomNameTable[d.editableData.roomInfo] }}</td>
            <td>
              <pre class="text-start">{{ d.editableData.body }}</pre>
            </td>
            <!-- <td>{{ d.editableData.selfUnread ? "はい" : "いいえ" }}</td> -->
            <td>
              <ConditionComponent :condition="d.editableData.postCondition.class" :editting="d.editing" />
            </td>
            <td><button @click="startEdit(d)" class="btn btn-primary">編集</button></td>
            <td><button @click="notifyWarning(() => deleteRegisteredData(d.id))" class="btn btn-danger">削除</button></td>
          </template>
        </tr>
      </tbody>
    </table>
  </template>
  <div class="position-fixed top-50 start-50 translate-middle">
    <div id="toastWarning" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header">
        <span class="me-auto fw-bold">注意</span>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">この操作は取り消せません。本当に削除しますか？</div>
      <div class="d-flex justify-content-center">
        <button id="delete" class="btn btn-danger m-3">削除</button>
      </div>
    </div>
  </div>
</template>

<style>
th {
  /* なぜかth要素にはbootstrapのalign-middleが適用されないので直接指定 */
  vertical-align: middle;
}

.input-room-info {
  width: 350px;
  margin-right: auto;
  margin-left: auto;
}

.input-body {
  width: 100%;
  min-width: 600px;
  height: 150px;
  margin-right: auto;
  margin-left: auto;
}
</style>
