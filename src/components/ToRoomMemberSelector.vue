<script setup lang="ts">
import { ref, watch } from "vue";
import axios from "axios";

const props = defineProps<{
  apiToken: string;
  roomId: number;
}>();

const emit = defineEmits<{
  onDecideToRoomMember: [tag: string];
}>();

// 部屋IDが更新されたらメンバー情報も更新
watch(
  () => props.roomId,
  () => updateMembers()
);

interface Member {
  name: string;
  id: number;
}

const selectMember = ref<Member>();
const members = ref<Member[]>([]);

function onClick() {
  if (!selectMember.value) {
    throw new Error(`selectMember.value=${selectMember.value}`);
  }
  emit("onDecideToRoomMember", `[To:${selectMember.value.id}] ${selectMember.value.name} さん`);
}

function updateMembers() {
  axios
    .get("/api/chatwork_room_members", {
      params: {
        api_token: props.apiToken,
        room_id: props.roomId,
      },
    })
    .then((response: any) => {
      const data = JSON.parse(JSON.stringify(response.data));
      if (data && data.length > 0) {
        members.value = data.map((x: any) => ({ name: x.name, id: Number(x.account_id) }));
        selectMember.value = members.value[0];
      } else {
        throw new Error(`data=${data}`);
      }
    })
    .catch((error) => {
      throw error;
    });
}

updateMembers();
</script>

<template>
  <div class="input-group">
    <label class="input-group-text" for="selectMember">To</label>
    <select v-model="selectMember" class="form-select" id="selectMember">
      <option v-for="m in members" :key="m.id" :value="m">{{ m.name }}</option>
    </select>
    <button @click="onClick" type="button" class="btn btn-outline-secondary">追加</button>
  </div>
</template>
