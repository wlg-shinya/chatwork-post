<script setup lang="ts">
import { ref } from "vue";
import { RoomData } from "../types";

const props = defineProps<{
  apiToken: string;
  roomDataArray: readonly RoomData[];
  currentRoomId: number;
}>();

const emit = defineEmits<{
  onSelectRoom: [id: number];
}>();

const selectRoomId = ref(props.currentRoomId);

function onChange() {
  emit("onSelectRoom", selectRoomId.value);
}
</script>

<template>
  <select v-model="selectRoomId" @change="onChange" class="form-select text-center">
    <option v-for="room in roomDataArray" :key="room.id" :value="room.id">{{ room.name }}</option>
  </select>
</template>
