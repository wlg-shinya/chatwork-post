import { Condition } from "./condition-interface";
import { DateTimeCondition } from "./datetime-condition";

export function conditionCreate(name: string): Condition {
  switch (name) {
    case DateTimeCondition.name:
      return new DateTimeCondition();
    default:
      throw new Error(`name=${name}`);
  }
}
