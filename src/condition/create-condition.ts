import { Condition } from "./condition-interface";
import { DaysLaterCondition } from "./dayslater-condition";

export function createCondition(name: string): Condition {
  switch (name) {
    case "DaysLaterCondition":
      return new DaysLaterCondition();
    default:
      throw new Error(`name=${name}`);
  }
}
