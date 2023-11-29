<script setup lang="ts">
import { DateTimeCondition } from "../condition";
defineProps<{
  condition: DateTimeCondition;
  editting: boolean;
}>();

// TODO:propsの直接書き換えをやめてemitを使うようにする
</script>

<template>
  <template v-if="editting">
    <div class="text-start">
      <div class="container-fluid">
        <div class="row">
          <div class="col-5 p-0">
            <input type="date" v-model="condition.startDateString" class="form-control" />
          </div>
          <div class="col-4 p-0">
            <input type="time" v-model="condition.hoursMinutesString" class="form-control" />
          </div>
          <div class="col-3 p-0 align-self-center">
            <span>に投稿する</span>
          </div>
        </div>
      </div>
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-3 form-check form-switch">
            <input type="checkbox" v-model="condition.repeat" class="form-check-input" id="repeat" />
            <label class="form-check-label m-0" for="repeat">繰り返す</label>
          </div>
          <template v-if="condition.repeat">
            <div class="col-3 p-0">
              <input type="number" v-model="condition.repeatIntervalDay" class="form-control" />
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
    <template v-if="condition.repeat"> {{ condition.repeatIntervalDay }}日ごとに繰り返す。次は{{ condition.goalDateString() }}に投稿する</template>
    <template v-else> {{ condition.goalDateString() }}に投稿する</template>
  </template>
</template>
