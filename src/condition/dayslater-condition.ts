import { Condition } from "./condition-interface";

export class DaysLaterCondition implements Condition {
  name = "DaysLaterCondition";
  daysLater = 0;
  hoursMinutesString = "";
  startDateString = "";

  // static selectLabel = "〇年〇月〇日から〇日後の〇時〇分に投稿";
  static selectLabel = "指定の日付と時刻に投稿";
  check(): boolean {
    // 完了済みなら以後チェックは通さない
    if (this.completed) return false;
    // 現在時間が目標時間を越えたらチェックを通す
    const today = new Date();
    return today.getTime() > this.goalTime();
  }
  update(): void {
    this.completed = true;
  }
  getData(): string {
    return JSON.stringify({
      name: this.name,
      daysLater: this.daysLater,
      hoursMinutesString: this.hoursMinutesString,
      startDateString: this.startDateString,
      completed: this.completed,
    });
  }
  setData(data: string) {
    const d = JSON.parse(data);
    this.daysLater = d.daysLater;
    this.hoursMinutesString = d.hoursMinutesString;
    this.startDateString = d.startDateString;
    this.completed = d.completed;
  }

  constructor() {
    const today = new Date();
    // 年月日のスウェーデン基準(sv-SE)はyyyy-MM-dd。これは<input type="date">で扱う形式と同一
    this.startDateString = today.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
    this.hoursMinutesString = today.toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" });
  }

  goalDateString(): string {
    const goal = new Date(this.goalTime());
    return goal.toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  private completed = false;
  private goalTime(): number {
    return this.startTime() + this.daysLaterTime() + this.hoursMinutesTime();
  }
  private startTime(): number {
    const match = this.startDateString.match(/([0-9]+)-([0-9]+)-([0-9]+)/);
    if (match?.length != 4) throw new Error(`this.startDateString=${this.startDateString}`);
    const date = new Date(0);
    date.setFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3])); // 月はデータが0始まりなので調整する
    return date.getTime();
  }
  private daysLaterTime(): number {
    return this.daysLater * 86400000; // 86400000ミリ秒 = 1日
  }
  private hoursMinutesTime(): number {
    const match = this.hoursMinutesString.match(/([0-9]+):([0-9]+)/);
    if (match?.length != 3) throw new Error(`this.hoursMinutesString=${this.hoursMinutesString}`);
    const date = new Date(0);
    date.setHours(Number(match[1]), Number(match[2]));
    return date.getTime();
  }
}
