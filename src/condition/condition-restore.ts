import { Condition } from "./condition-interface";
import { conditionCreate } from "./condition-create";

export function conditionRestore(dataString: string): Condition {
  const data = JSON.parse(dataString);
  if (typeof data.name === "undefined") {
    throw new Error(`data.name undefined`);
  }
  const condition = conditionCreate(data.name);
  if (condition == null) {
    throw new Error(`condition=${condition}`);
  }
  condition.setData(dataString);
  return condition;
}
