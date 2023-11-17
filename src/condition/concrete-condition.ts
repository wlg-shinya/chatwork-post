import { Condition } from "./condition-interface";
import { DaysLaterCondition } from "./dayslater-condition";

export function concreteCondition(cond: Condition) {
  switch (cond.name) {
    case "DaysLaterCondition":
      return cond as DaysLaterCondition;
    default:
      throw new Error(`cond.name=${cond.name}`);
  }
}
