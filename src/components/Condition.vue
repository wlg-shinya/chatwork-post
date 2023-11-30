<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { Condition, concreteCondition, DateTimeCondition } from "../condition";
import DateTimeConditionComponent from "./DateTimeCondition.vue";

const props = defineProps<{
  condition: Condition;
  editting: boolean;
}>();

const emit = defineEmits<{
  onSelectedCondition: [selected: Condition];
  onUpdateCondition: [data: string];
}>();

const selectCondition = ref({
  name: props.condition.name,
  class: props.condition,
});

watchEffect(() => {
  emit("onSelectedCondition", selectCondition.value.class);
});

function onUpdateCondition(data: string) {
  emit("onUpdateCondition", data);
}
</script>

<template>
  <!-- TODO:Condition が2種類以上になったら選択可能にする
  <template v-if="editting">
    <select v-model="selectCondition.name" class="form-select">
      <option :value="DateTimeCondition.name">{{ DateTimeCondition.selectLabel }}</option>
    </select>
    <hr class="m-1" />
  </template> 
  -->
  <template v-if="condition == null" />
  <DateTimeConditionComponent
    v-else-if="condition.name == DateTimeCondition.name"
    :condition="concreteCondition(selectCondition.class)"
    :editting="editting"
    @onUpdateCondition="onUpdateCondition"
  />
</template>
