import { Condition } from "./condition-interface";
import { createCondition } from "./create-condition";

export function restoreCondition(dataString: string): Condition {
  const data = JSON.parse(dataString);
  if (typeof data.name === "undefined") {
    throw new Error(`data.name undefined`);
  }
  const condition = createCondition(data.name);
  if (condition == null) {
    throw new Error(`condition=${condition}`);
  }
  condition.setData(dataString);
  return condition;
}
