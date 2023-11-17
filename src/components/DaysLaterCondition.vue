<script setup lang="ts">
import { DaysLaterCondition } from "../condition";
defineProps<{
  condition: DaysLaterCondition;
  editting: boolean;
}>();
</script>

<template>
  <template v-if="editting">
    <input type="date" v-model="condition.startDateString" />
    <input type="time" v-model="condition.hoursMinutesString" />に投稿する<br />
    <input type="checkbox" v-model="condition.repeat" />繰り返す
    <template v-if="condition.repeat"> <input type="number" v-model="condition.repeatIntervalDay" />日ごと </template>
  </template>
  <template v-else>
    {{ condition.goalDateString() }}に投稿する。
    <template v-if="condition.repeat">{{ condition.repeatIntervalDay }}日ごとに繰り返す</template>
  </template>
</template>
