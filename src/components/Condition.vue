<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { Condition, concreteCondition, createCondition, DateTimeCondition } from "../condition";
import DateTimeConditionComponent from "./DateTimeCondition.vue";

const props = defineProps<{
  condition: Condition | null;
  editting: boolean;
}>();

const emit = defineEmits<{
  onSelectedCondition: [selected: Condition];
}>();

const selectCondition = ref({
  name: props.condition ? props.condition.name : DateTimeCondition.name,
  class: props.condition,
});

watchEffect(() => {
  selectCondition.value.class = createCondition(selectCondition.value.name);
  emit("onSelectedCondition", selectCondition.value.class);
});
</script>

<template>
  <template v-if="editting">
    <select v-model="selectCondition.name" class="form-select">
      <option :value="DateTimeCondition.name">{{ DateTimeCondition.selectLabel }}</option>
    </select>
    <hr class="m-1" />
  </template>
  <template v-if="condition == null" />
  <DateTimeConditionComponent v-else-if="condition.name == DateTimeCondition.name" :condition="concreteCondition(condition)" :editting="editting" />
</template>
