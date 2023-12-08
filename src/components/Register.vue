<script setup lang="ts">
import { ref, computed, watch } from "vue";
import axios from "axios";
import { Modal } from "bootstrap";
import { RegisteredData, RegisteredDataUserInput } from "../types";
import { Condition, concreteCondition, createCondition, restoreCondition } from "../condition";
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
    class: Condition;
  };
}
interface WorkingData {
  id: number;
  api_token: string;
  editableData: InputData;
  editing: boolean;
}
interface RoomData {
  id: number;
  name: string;
  type: string;
}

const newInputData = ref<InputData>({
  roomInfo: "",
  body: "",
  selfUnread: false,
  postCondition: {
    name: "",
    class: createCondition("DateTimeCondition"),
  },
});
const workingDataArray = ref<WorkingData[]>([]);
const roomDataArray = ref<RoomData[]>([]);

const sortedWorkingData = computed(() => workingDataArray.value.sort((a: any, b: any) => (a.id < b.id ? 1 : -1)));

// APIトークンが更新されたら各種データ更新
watch(
  () => props.apiToken,
  async () => {
    updateWorkingData();
    roomDataArray.value = await getRoomList();
  }
);

// チャット部屋の情報取得
async function getRoomList(): Promise<RoomData[]> {
  return await axios
    .get("/api/chatwork_rooms", {
      params: {
        api_token: props.apiToken,
      },
    })
    .then((response: any) => {
      const data = JSON.parse(JSON.stringify(response.data));
      if (!data || data.length == 0) {
        console.error(`[Error] data=${data}`); // エラー情報はログに流すが処理は止めない
      } else {
        return data.map((x: any): RoomData => {
          return {
            id: x.room_id,
            name: x.name,
            type: x.type,
          };
        });
      }
    })
    .catch((error) => {
      console.error(error); // エラー情報はログに流すが処理は止めない
      return [];
    });
}

function getRoomId(roomInfo: string): number {
  if (roomInfo.startsWith("https://www.chatwork.com/#!rid")) {
    // チャット部屋のURLを指定していた場合はID部分を抽出
    return Number(roomInfo.replace(/.*rid([0-9]+)$/, "$1"));
  } else {
    const num = Number(roomInfo);
    return num ? num : 0;
  }
}

function getRoomNameByInfo(roomInfo: string): string {
  const roomId = getRoomId(roomInfo);
  const target = roomDataArray.value.find((x) => x.id === roomId);
  return target ? target.name : "";
}

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
    const edittingWorkingData: WorkingData[] = workingDataArray.value.filter((w) => w.editing);

    // 未編集データと編集中データを考慮して作業中データの新規構築
    if (noEdittingWorkingData.length > 0) {
      if (edittingWorkingData.length > 0) {
        // 未編集データも編集中のデータもある場合
        // 編集中データと未編集データを合わせて作業中データとする
        workingDataArray.value = noEdittingWorkingData.map((n) => {
          const find = edittingWorkingData.find((e) => e.id == n.id);
          return find ? find : n;
        });
      } else {
        // 編集中データがない場合は未編集データすべてを作業中データとする
        workingDataArray.value = noEdittingWorkingData;
      }
    } else {
      // 未編集データも編集中のデータもない場合は作業中データは空にしておく
      workingDataArray.value = [];
    }
  } catch (error) {
    // エラー情報はログに流すが処理は止めない
    console.error(error);
    return;
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

function notifyWarning(delegate: Function) {
  const modal = new Modal("#notifyWarning");

  // 削除ボタンに指定関数を割り当てる
  const buttonEl = document.getElementById("delete");
  if (!buttonEl) return;
  buttonEl.addEventListener("click", () => {
    delegate();
    modal.hide();
  });

  // UI表示
  modal.show();
}

function onDecideToRoomMember(textareId: string, tag: string, data: InputData) {
  // 入力補助とセットのテキストエリアのカーソル位置にタグを挿入
  const textarea = document.getElementById(textareId) as HTMLInputElement;
  if (!textarea) throw new Error(`textarea = ${textarea}`);
  const selectionStart = textarea.selectionStart ?? 0;
  const valueBefore = textarea.value.substring(0, selectionStart);
  const valueAfter = textarea.value.substring(selectionStart, textarea.value.length);
  data.body = valueBefore + tag + valueAfter;
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
              @onDecideToRoomMember="onDecideToRoomMember('inputBodyNew', $event, newInputData)"
            />
            <textarea v-model="newInputData.body" class="input-body form-control" id="inputBodyNew"></textarea>
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
              @onUpdateCondition="newInputData.postCondition.class?.setData($event)"
            />
          </td>
          <td colspan="2"><button @click="register" class="btn btn-primary container-fluid">新規登録</button></td>
        </tr>
        <tr v-for="d in sortedWorkingData" :key="d.id" @click="startEdit(d)">
          <template v-if="d.editing">
            <td><input v-model="d.editableData.roomInfo" placeholder="IDかURLを入力してください" class="input-room-info form-control" /></td>
            <td>
              <ToRoomMemberSelector
                :apiToken="apiToken"
                :roomId="getRoomId(d.editableData.roomInfo)"
                @onDecideToRoomMember="onDecideToRoomMember(`inputBody${d.id}`, $event, d.editableData)"
              />
              <textarea v-model="d.editableData.body" class="input-body form-control" :id="`inputBody${d.id}`"></textarea>
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
                @onUpdateCondition="d.editableData.postCondition.class?.setData($event)"
              />
            </td>
            <td><button @click.stop="updateRegisteredData(d)" class="btn btn-primary container-fluid">更新</button></td>
            <td><button @click.stop="cancelEdit(d)" class="btn btn-outline-primary container-fluid">キャンセル</button></td>
          </template>
          <template v-else>
            <td>{{ getRoomNameByInfo(d.editableData.roomInfo) }}</td>
            <td>
              <pre class="text-start m-0">{{ d.editableData.body }}</pre>
            </td>
            <!-- <td>{{ d.editableData.selfUnread ? "はい" : "いいえ" }}</td> -->
            <td>
              <ConditionComponent
                :condition="d.editableData.postCondition.class"
                :editting="d.editing"
                @onSelectedCondition="d.editableData.postCondition.class = concreteCondition($event)"
                @onUpdateCondition="d.editableData.postCondition.class?.setData($event)"
              />
            </td>
            <td><button @click.stop="startEdit(d)" class="btn btn-primary container-fluid">編集</button></td>
            <td>
              <button @click.stop="notifyWarning(() => deleteRegisteredData(d.id))" class="btn btn-danger container-fluid">削除</button>
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </template>
  <div class="modal fade" id="notifyWarning" tabindex="-1" aria-labelledby="notifyWarningLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <span class="modal-title fw-bold fs-5" id="notifyWarningLabel">注意</span>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body text-center">
          <span>この操作は取り消せません。本当に削除しますか？</span>
        </div>
        <div class="modal-footer d-flex justify-content-center">
          <button id="delete" class="btn btn-danger">削除</button>
        </div>
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
