<script setup lang="ts">
import Condition from "../condition/condition-interface";
import DaysLaterCondition from "../condition/dayslater-condition";
import DaysLaterConditionComponent from "./DaysLaterCondition.vue";

defineProps<{
  condition: Condition;
  editting: boolean;
}>();

function concreteCondition(cond: Condition) {
  switch (cond.typename) {
    case "DaysLaterCondition":
      return cond as DaysLaterCondition;
    default:
      throw new Error('Invalid name "Condition.type"');
  }
}
</script>

<template>
  <DaysLaterConditionComponent v-if="condition.typename == 'DaysLaterCondition'" :condition="concreteCondition(condition)" :editting="editting" />
</template>
