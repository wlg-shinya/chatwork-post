import Condition from "./condition-interface";

class DaysLaterCondition implements Condition {
  typename = this.constructor.name;
  check(): boolean {
    const todayTime = this.today().getTime();
    const borderTime = this.startTime + this.daysLaterTime() + this.hoursMinutesTime();
    return todayTime > borderTime;
  }
  setup() {
    // この関数を呼び出した日の00:00:00.000を起点にする
    const today = this.today();
    today.setHours(0, 0, 0, 0);
    this.startTime = today.getTime();

    // 0未満は0(当日)と扱う
    this.daysLater = Math.max(this.daysLater, 0);

    // 指定された時分を時と分に数値として分解
    const match = this.hoursMinutesString.match(/([0-9]+):([0-9]+)/);
    if (match?.length != 3) throw new Error('Invalid value "hoursMinutesString"');
    this.hours = Number(match[1]);
    this.minutes = Number(match[2]);
  }

  constructor(daysLater: number, hoursMinutesString: string) {
    this.daysLater = daysLater;
    this.hoursMinutesString = hoursMinutesString;
  }
  daysLater;
  hoursMinutesString;
  daysLaterString(): string {
    if (this.daysLater == 0) {
      return "今日";
    } else {
      return `${this.daysLater}日後`;
    }
  }

  private today(): Date {
    return new Date(Date.now());
  }
  private daysLaterTime(): number {
    const date = new Date();
    date.setDate(this.daysLater);
    return date.getTime();
  }
  private hoursMinutesTime(): number {
    const date = new Date();
    date.setHours(this.hours, this.minutes, 0, 0);
    return date.getTime();
  }
  private hours = 0;
  private minutes = 0;
  private startTime = 0;
}

export default DaysLaterCondition;
