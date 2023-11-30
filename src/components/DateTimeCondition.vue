<script setup lang="ts">
import { ref, watch } from "vue";
import { DateTimeCondition } from "../condition";
const props = defineProps<{
  condition: DateTimeCondition;
  editting: boolean;
}>();

const emit = defineEmits<{
  onUpdateCondition: [data: string];
}>();

const inputCondition = ref(new DateTimeCondition());
inputCondition.value.setData(props.condition.getData());

watch(
  inputCondition,
  () => {
    emit("onUpdateCondition", inputCondition.value.getData());
  },
  { deep: true }
);
</script>

<template>
  <template v-if="editting">
    <div class="text-start">
      <div class="container-fluid">
        <div class="row">
          <div class="col-5 p-0">
            <input type="date" v-model="inputCondition.startDateString" class="form-control" />
          </div>
          <div class="col-4 p-0">
            <input type="time" v-model="inputCondition.hoursMinutesString" class="form-control" />
          </div>
          <div class="col-3 p-0 align-self-center">
            <span>に投稿する</span>
          </div>
        </div>
      </div>
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-3 form-check form-switch">
            <input type="checkbox" v-model="inputCondition.repeat" class="form-check-input" id="repeat" />
            <label class="form-check-label m-0" for="repeat">繰り返す</label>
          </div>
          <template v-if="inputCondition.repeat">
            <div class="col-3 p-0">
              <input type="number" v-model="inputCondition.repeatIntervalDay" class="form-control" />
            </div>
            <div class="col-auto p-0">
              <span>日ごと</span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </template>
  <template v-else>
    <template v-if="inputCondition.repeat">
      {{ inputCondition.repeatIntervalDay }}日ごとに繰り返す。次は{{ inputCondition.goalDateString() }}に投稿する</template
    >
    <template v-else> {{ inputCondition.goalDateString() }}に投稿する</template>
  </template>
</template>
