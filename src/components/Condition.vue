<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { Condition, concreteCondition, createCondition, DaysLaterCondition } from "../condition";
import DaysLaterConditionComponent from "./DaysLaterCondition.vue";

const props = defineProps<{
  condition: Condition | null;
  editting: boolean;
}>();

const emit = defineEmits<{
  onSelectedCondition: [selected: Condition];
}>();

const selectCondition = ref({
  name: props.condition ? props.condition.name : "DaysLaterCondition",
  class: props.condition,
});

watchEffect(() => {
  selectCondition.value.class = createCondition(selectCondition.value.name);
  emit("onSelectedCondition", selectCondition.value.class);
});
</script>

<template>
  <template v-if="editting">
    <select v-model="selectCondition.name">
      <option value="DaysLaterCondition">{{ DaysLaterCondition.selectLabel }}</option>
    </select>
    <br />
  </template>
  <template v-if="condition == null" />
  <DaysLaterConditionComponent v-else-if="condition.name == 'DaysLaterCondition'" :condition="concreteCondition(condition)" :editting="editting" />
</template>
