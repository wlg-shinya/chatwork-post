<script setup lang="ts">
import { Condition, DaysLaterCondition } from "../condition";
import DaysLaterConditionComponent from "./DaysLaterCondition.vue";

defineProps<{
  condition: Condition;
  editting: boolean;
}>();

function concreteCondition(cond: Condition) {
  switch (cond.name) {
    case "DaysLaterCondition":
      return cond as DaysLaterCondition;
    default:
      throw new Error(`Invalid cond.name=${cond.name}`);
  }
}
</script>

<template>
  <DaysLaterConditionComponent v-if="condition.name == 'DaysLaterCondition'" :condition="concreteCondition(condition)" :editting="editting" />
</template>
