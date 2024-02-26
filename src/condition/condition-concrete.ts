import { Condition } from "./condition-interface";
import { DateTimeCondition } from "./datetime-condition";

export function conditionConcrete(cond: Condition) {
  switch (cond.name) {
    case DateTimeCondition.name:
      return cond as DateTimeCondition;
    default:
      throw new Error(`cond.name=${cond.name}`);
  }
}
