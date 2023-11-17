<script setup lang="ts">
import { DaysLaterCondition } from "../condition";
defineProps<{
  condition: DaysLaterCondition;
  editting: boolean;
}>();
</script>

<template>
  <template v-if="editting">
    <input type="date" v-model="condition.startDateString" />から <input type="number" v-model="condition.daysLater" />日後の
    <input type="time" v-model="condition.hoursMinutesString" />に投稿する
  </template>
  <template v-else> {{ condition.goalDateString() }}に投稿する </template>
</template>
