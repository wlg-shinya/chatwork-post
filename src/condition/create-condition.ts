import { Condition } from "./condition-interface";
import { DaysLaterCondition } from "./dayslater-condition";

export function createCondition(type: string): Condition {
  switch (type) {
    case "DaysLaterCondition":
      return new DaysLaterCondition();
    default:
      throw new Error(`Invalid type "${type}"`);
  }
}
